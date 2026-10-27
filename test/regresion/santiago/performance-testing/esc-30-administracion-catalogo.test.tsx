import { expect } from 'chai'
import { afterEach, describe, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { listado, ok, servidor, sinContenido } from '../../../helpers/servidor'
import { celular, celularCompleto, paginado, sesionDeAdmin } from '../../../helpers/fixtures'
import { medir } from '../helpers/medicion'

/**
 * ESC-30 — Administración del catálogo · performance-testing (front)
 *
 * La tabla del panel se carga con una sola petición (hasta 50 celulares), al
 * eliminar se quita la fila sin volver a pedir el catálogo y el formulario de
 * edición pide el celular una sola vez.
 */

const PRESUPUESTO_MS = 1_000

function catalogo(n: number) {
  return Array.from({ length: n }, (_, i) => celular({ id: `phone-${i}`, slug: `celular-${i}`, name: `Celular ${i}` }))
}

async function tablaCon(n: number) {
  sesionDeAdmin()
  servidor.responder('GET', '/phones', listado(paginado(catalogo(n), { limit: 50 })))
  const user = abrirApp('/admin/phones')
  await screen.findByText(`Celular ${n - 1}`)
  return user
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ESC-30 · Performance (front) — administración del catálogo', () => {
  it('lista los 50 celulares con una sola petición de hasta 50', async () => {
    // Act
    await tablaCon(50)

    // Assert
    expect(screen.getAllByTitle('Eliminar')).to.have.lengthOf(50)
    const peticiones = servidor.peticiones('GET', '/phones')
    expect(peticiones).to.have.lengthOf(1)
    expect(peticiones[0].params).to.deep.equal({ limit: 50 })
  })

  it('eliminar quita la fila sin volver a pedir el catálogo', async () => {
    // Arrange
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    servidor.responder('DELETE', '/phones/phone-1', sinContenido())
    const user = await tablaCon(3)
    const fila = screen.getByText('Celular 1').closest('tr') as HTMLElement

    // Act
    await user.click(within(fila).getByTitle('Eliminar'))

    // Assert
    await waitFor(() => {
      expect(screen.queryByText('Celular 1')).to.be.null
    })
    expect(servidor.peticiones('GET', '/phones')).to.have.lengthOf(1)
    expect(servidor.peticiones('DELETE')).to.have.lengthOf(1)
  })

  it('el formulario de edición pide el celular una sola vez', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-1', ok(celularCompleto({ id: 'phone-1' })))

    // Act
    abrirApp('/admin/phones/phone-1/edit')
    await screen.findByDisplayValue('iPhone 15')
    await new Promise((resolver) => setTimeout(resolver, 50))

    // Assert
    expect(servidor.peticiones()).to.have.lengthOf(1)
  })

  it('una tabla de 50 celulares se pinta dentro del presupuesto', async () => {
    // Arrange
    await tablaCon(50) // calentamiento
    cleanup()
    servidor.reiniciar()

    // Act
    const { ms } = await medir(() => tablaCon(50))

    // Assert
    expect(ms, `Tardó ${ms.toFixed(1)} ms`).to.be.below(PRESUPUESTO_MS)
  })
})
