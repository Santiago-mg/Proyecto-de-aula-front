import { expect } from 'chai'
import { describe, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SimilarPhones } from '../../../../src/components/phones/SimilarPhones'
import { abrirApp } from '../../../helpers/app'
import { ok, servidor, type Respuesta } from '../../../helpers/servidor'
import { celular, celularCompleto } from '../../../helpers/fixtures'
import { medir } from '../helpers/medicion'
import { respuestaDiferida } from '../helpers/promesas'

/**
 * ESC-13 — Recomendación de productos · performance-testing (front)
 *
 * La sección es un complemento: no puede retrasar la ficha, no debe pedir más
 * de lo que muestra, ni repetir la petición en cada repintado, y si llegan
 * respuestas en desorden tiene que quedarse con la del celular actual.
 */

const PRESUPUESTO_MS = 1_000 // amplio a propósito: jsdom es más lento que un navegador real
const TITULO = 'También te puede interesar'

function similares(n: number, prefijo = 'sim') {
  return Array.from({ length: n }, (_, i) =>
    celular({ id: `${prefijo}-${i}`, slug: `${prefijo}-${i}`, name: `${prefijo.toUpperCase()} ${i}` }),
  )
}

describe('ESC-13 · Performance (front) — recomendaciones', () => {
  it('muestra exactamente las recomendaciones que llegaron', async () => {
    // Arrange
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto()))
    servidor.responder('GET', '/phones/iphone-15/similares', ok(similares(3)))

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    const seccion = await screen.findByRole('region', { name: TITULO })
    expect(within(seccion).getAllByRole('link')).to.have.lengthOf(3)
  })

  it('la ficha no espera a las recomendaciones: se puede comprar mientras siguen cargando', async () => {
    // Arrange
    const diferida = respuestaDiferida<Respuesta>()
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto()))
    servidor.responder('GET', '/phones/iphone-15/similares', () => diferida.promesa)

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    expect(await screen.findByRole('heading', { name: 'iPhone 15', level: 1 })).to.exist
    expect(screen.getByRole('button', { name: 'Agregar al carrito' })).to.exist
    expect(screen.queryByRole('region', { name: TITULO })).to.equal(null)
    diferida.entregar(ok(similares(1)))
    expect(await screen.findByRole('region', { name: TITULO })).to.exist
  })

  it('una sola petición por ficha, aunque la ficha se vuelva a pintar', async () => {
    // Arrange
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto()))
    servidor.responder('GET', '/phones/iphone-15/similares', ok(similares(2)))
    const user = abrirApp('/phones/iphone-15')
    await screen.findByRole('region', { name: TITULO })

    // Act
    // Elegir color y cantidad repinta la ficha completa.
    await user.click(screen.getByRole('button', { name: 'Azul' }))
    await user.click(screen.getByRole('button', { name: '+' }))

    // Assert
    expect(servidor.peticiones('GET', '/phones/iphone-15/similares')).to.have.lengthOf(1)
  })

  it('si la respuesta del celular anterior llega tarde, se descarta', async () => {
    // Arrange
    const tardia = respuestaDiferida<Respuesta>()
    servidor.responder('GET', '/phones/celular-a/similares', () => tardia.promesa)
    servidor.responder('GET', '/phones/celular-b/similares', ok(similares(2, 'b')))
    const { rerender } = render(<MemoryRouter><SimilarPhones slug="celular-a" /></MemoryRouter>)

    // Act
    // El cliente pasa a otro celular antes de que lleguen las del primero.
    rerender(<MemoryRouter><SimilarPhones slug="celular-b" /></MemoryRouter>)
    await screen.findByText('B 0')
    tardia.entregar(ok(similares(4, 'a')))

    // Assert
    // Se le da tiempo a la respuesta tardía para que, si no se descartara,
    // alcanzara a pintarse.
    await new Promise((resolver) => setTimeout(resolver, 20))
    expect(servidor.peticiones('GET')).to.have.lengthOf(2)
    expect(screen.queryByText('A 0')).to.equal(null)
    expect(screen.getAllByRole('link')).to.have.lengthOf(2)
  })

  it('pintar la ficha con 12 recomendaciones (el máximo del back) cumple el presupuesto', async () => {
    // Arrange
    const abrirFicha = async () => {
      servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto()))
      servidor.responder('GET', '/phones/iphone-15/similares', ok(similares(12)))
      abrirApp('/phones/iphone-15')
      await screen.findByText('SIM 11')
    }
    await abrirFicha() // calentamiento
    cleanup()
    servidor.reiniciar()

    // Act
    const { ms } = await medir(abrirFicha)

    // Assert
    expect(ms, `Tardó ${ms.toFixed(1)} ms`).to.be.below(PRESUPUESTO_MS)
  })
})
