import { expect } from 'chai'
import { describe, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, rutaActual } from '../../../helpers/app'
import { fallo, listado, ok, servidor, type Respuesta } from '../../../helpers/servidor'
import { celular, celularCompleto } from '../../../helpers/fixtures'
import { respuestaDiferida } from '../helpers/promesas'

/**
 * ESC-13 — Recomendación de productos · regression-testing (front)
 * Sección "También te puede interesar" al final de la ficha del celular.
 *
 * La app completa corre de verdad (router, ficha, tarjetas); solo se simula la
 * red. Cada prueba sigue AAA y usa sus propios datos (FIRST).
 */

const TITULO = 'También te puede interesar'

function conFicha(slug = 'iphone-15', cambios = {}) {
  servidor.responder('GET', `/phones/${slug}`, ok(celularCompleto({ slug, ...cambios })))
}

describe('ESC-13 · Regresión (front) — "También te puede interesar"', () => {
  it('muestra las recomendaciones al final de la ficha, cada una enlazada a su detalle', async () => {
    // Arrange
    conFicha()
    servidor.responder('GET', '/phones/iphone-15/similares', ok([
      celular({ id: 'p-2', slug: 'iphone-14', name: 'iPhone 14' }),
      celular({ id: 'p-3', slug: 'galaxy-s24', name: 'Galaxy S24', brand: 'Samsung' }),
    ]))

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    const seccion = await screen.findByRole('region', { name: TITULO })
    const enlaces = within(seccion).getAllByRole('link')
    expect(enlaces.map((a) => a.getAttribute('href'))).to.deep.equal(['/phones/iphone-14', '/phones/galaxy-s24'])
    expect(within(seccion).getByText('iPhone 14')).to.exist
    expect(within(seccion).getByText('Galaxy S24')).to.exist
    // Al final: después de las especificaciones, las características y la
    // descripción, que es lo que el cliente lee antes de decidir.
    for (const titulo of ['Especificaciones', 'Características', 'Descripción']) {
      const anterior = screen.getByRole('heading', { name: titulo, level: 2 })
      expect(anterior.compareDocumentPosition(seccion) & Node.DOCUMENT_POSITION_FOLLOWING, titulo).to.not.equal(0)
    }
  })

  it('pide 4 recomendaciones, las que caben en la fila de la ficha', async () => {
    // Arrange
    conFicha()
    servidor.responder('GET', '/phones/iphone-15/similares', ok([]))

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    await waitFor(() => {
      expect(servidor.peticiones('GET', '/phones/iphone-15/similares')).to.have.lengthOf(1)
    })
    expect(servidor.peticiones('GET', '/phones/iphone-15/similares')[0].params).to.deep.equal({ limit: 4 })
  })

  it('si el back no encuentra nada parecido, la sección no aparece', async () => {
    // Arrange
    conFicha()
    servidor.responder('GET', '/phones/iphone-15/similares', ok([]))

    // Act
    abrirApp('/phones/iphone-15')
    await screen.findByRole('heading', { name: 'iPhone 15' })
    await waitFor(() => {
      expect(servidor.peticiones('GET', '/phones/iphone-15/similares')).to.have.lengthOf(1)
    })

    // Assert
    expect(screen.queryByRole('region', { name: TITULO })).to.equal(null)
  })

  it('si la recomendación falla, la ficha se ve completa y sin la sección', async () => {
    // Arrange
    conFicha()
    servidor.responder('GET', '/phones/iphone-15/similares', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    expect(await screen.findByRole('heading', { name: 'iPhone 15' })).to.exist
    expect(screen.getByRole('button', { name: 'Agregar al carrito' })).to.exist
    await waitFor(() => {
      expect(servidor.peticiones('GET', '/phones/iphone-15/similares')).to.have.lengthOf(1)
    })
    expect(screen.queryByRole('region', { name: TITULO })).to.equal(null)
    expect(screen.queryByText('Error interno del servidor')).to.equal(null)
  })

  it('si el back responde 200 pero con una página HTML (no JSON), la ficha no se rompe', async () => {
    // Arrange
    // Pasa cuando un proxy o el hosting contestan en lugar de la API.
    conFicha()
    servidor.responder('GET', '/phones/iphone-15/similares', listado('<!doctype html><title>Proxy</title>'))

    // Act
    abrirApp('/phones/iphone-15')
    await screen.findByRole('heading', { name: 'iPhone 15', level: 1 })
    // Se deja terminar la respuesta de las recomendaciones antes de revisar.
    await new Promise((resolver) => setTimeout(resolver, 20))

    // Assert
    expect(screen.getByRole('heading', { name: 'iPhone 15', level: 1 })).to.exist
    expect(servidor.peticiones('GET', '/phones/iphone-15/similares')).to.have.lengthOf(1)
    expect(screen.queryByRole('region', { name: TITULO })).to.equal(null)
  })

  it('al abrir una recomendación se muestra su ficha y se piden SUS recomendaciones', async () => {
    // Arrange
    conFicha('iphone-15')
    servidor.responder('GET', '/phones/iphone-15/similares', ok([
      celular({ id: 'p-2', slug: 'iphone-14', name: 'iPhone 14' }),
      celular({ id: 'p-5', slug: 'galaxy-s24', name: 'Galaxy S24', brand: 'Samsung' }),
    ]))
    conFicha('iphone-14', { id: 'p-2', name: 'iPhone 14' })
    // Las recomendaciones del iPhone 14 tardan: así se ve qué muestra la
    // ficha mientras tanto.
    const lentas = respuestaDiferida<Respuesta>()
    servidor.responder('GET', '/phones/iphone-14/similares', () => lentas.promesa)
    const user = abrirApp('/phones/iphone-15')
    const seccion = await screen.findByRole('region', { name: TITULO })

    // Act
    await user.click(within(seccion).getByRole('link', { name: /iphone 14/i }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'iPhone 14', level: 1 })).to.exist
    expect(rutaActual()).to.equal('/phones/iphone-14')
    // Mientras llegan las nuevas no quedan las del iPhone 15, que
    // recomendarían el mismo iPhone 14 que ya se está viendo.
    expect(screen.queryByRole('region', { name: TITULO })).to.equal(null)
    lentas.entregar(ok([celular({ id: 'p-4', slug: 'iphone-13', name: 'iPhone 13' })]))
    const nuevaSeccion = await screen.findByRole('region', { name: TITULO })
    expect(within(nuevaSeccion).getAllByRole('link').map((a) => a.getAttribute('href'))).to.deep.equal(['/phones/iphone-13'])
  })

  // DEF-13-01: la ficha es la misma pantalla para todos los celulares, así
  // que al pasar de uno a otro por una recomendación conservaba el color, la
  // cantidad y la foto elegidos en el anterior. Con un iPhone 15 en Azul x3,
  // abrir un equipo sin colores y con 1 en stock agregaba 3 unidades en Azul.
  it('al abrir una recomendación no se arrastran el color ni la cantidad de la ficha anterior', async () => {
    // Arrange
    conFicha('iphone-15', { stock: 10 })
    servidor.responder('GET', '/phones/iphone-15/similares', ok([
      celular({ id: 'p-2', slug: 'pixel-8', name: 'Pixel 8' }),
    ]))
    conFicha('pixel-8', { id: 'p-2', name: 'Pixel 8', colors: [], stock: 1 })
    servidor.responder('GET', '/phones/pixel-8/similares', ok([]))
    const user = abrirApp('/phones/iphone-15')
    await user.click(await screen.findByRole('button', { name: 'Azul' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    const seccion = await screen.findByRole('region', { name: TITULO })

    // Act
    await user.click(within(seccion).getByRole('link', { name: /pixel 8/i }))
    await screen.findByRole('heading', { name: 'Pixel 8', level: 1 })
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

    // Assert
    const carrito = JSON.parse(localStorage.getItem('cp_cart') ?? '[]')
    expect(carrito).to.have.lengthOf(1)
    expect(carrito[0]).to.include({ phoneId: 'p-2', qty: 1, colorId: null, colorName: null })
  })

  it('al abrir una recomendación la página vuelve arriba, a la nueva ficha', async () => {
    // Arrange
    conFicha('iphone-15')
    servidor.responder('GET', '/phones/iphone-15/similares', ok([
      celular({ id: 'p-2', slug: 'iphone-14', name: 'iPhone 14' }),
    ]))
    conFicha('iphone-14', { id: 'p-2', name: 'iPhone 14' })
    servidor.responder('GET', '/phones/iphone-14/similares', ok([]))
    const user = abrirApp('/phones/iphone-15')
    const seccion = await screen.findByRole('region', { name: TITULO })
    // La sección está al final de la ficha: sin volver arriba, el cliente
    // quedaría mirando el pie de la página nueva.
    const scrollTo = vi.spyOn(window, 'scrollTo')

    // Act
    await user.click(within(seccion).getByRole('link', { name: /iphone 14/i }))

    // Assert
    await screen.findByRole('heading', { name: 'iPhone 14', level: 1 })
    expect(scrollTo.mock.calls).to.deep.include([0, 0])
  })
})
