import { expect } from 'chai'
import { afterEach, describe, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { abrirApp, rutaActual } from '../../../helpers/app'
import { listado, servidor } from '../../../helpers/servidor'
import { celular, paginado, sesionDeAdmin } from '../../../helpers/fixtures'
import { SIN_PERMISO_DE_ADMIN, XSS_IMAGEN, XSS_SCRIPT, hayHtmlInyectado } from '../helpers/seguridad'

/**
 * ESC-30 — Administración del catálogo · security-testing (front)
 * Pantallas /admin/phones, /admin/phones/new y /admin/phones/:id/edit.
 */

const PANTALLAS = ['/admin/phones', '/admin/phones/new', '/admin/phones/phone-1/edit']

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ESC-30 · Seguridad (front) — administración del catálogo', () => {
  describe.each(PANTALLAS)('%s', (ruta) => {
    it.each(SIN_PERMISO_DE_ADMIN)('%s no entra y no se toca el back', async (_caso, prepararSesion, titulo, destino) => {
      // Arrange
      prepararSesion()

      // Act
      abrirApp(ruta)

      // Assert
      expect(await screen.findByRole('heading', { name: titulo })).to.exist
      expect(rutaActual()).to.equal(destino)
      expect(servidor.peticiones()).to.be.empty
    })
  })

  it.each([
    [XSS_IMAGEN, 'imagen con onerror'],
    [XSS_SCRIPT, 'etiqueta script'],
  ])('un celular llamado %j (%s) se lista como texto', async (nombre) => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones', listado(paginado([celular({ name: nombre })])))

    // Act
    abrirApp('/admin/phones')

    // Assert
    expect(await screen.findByText(nombre)).to.exist
    expect(hayHtmlInyectado()).to.equal(false)
  })

  it('borrar exige confirmación: si el admin cancela, no sale ningún DELETE', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones', listado(paginado([celular()])))
    const confirmar = vi.spyOn(globalThis, 'confirm').mockReturnValue(false)
    const user = abrirApp('/admin/phones')
    const fila = (await screen.findByText('iPhone 15')).closest('tr') as HTMLElement

    // Act
    await user.click(within(fila).getByTitle('Eliminar'))

    // Assert
    expect(confirmar.mock.calls).to.deep.equal([['¿Eliminar "iPhone 15"?']])
    expect(servidor.peticiones('DELETE')).to.be.empty
    expect(screen.getByText('iPhone 15')).to.exist
  })

  it('al guardar, un 500 muestra el mensaje genérico y no el detalle interno', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('POST', '/phones', {
      status: 500,
      body: { error: 'Error interno del servidor', detail: 'Foreign key constraint failed on Phone_categoryId_fkey' },
    })
    const user = abrirApp('/admin/phones/new')
    await screen.findByRole('heading', { name: 'Nuevo celular' })

    // Act
    await user.type(screen.getByLabelText('Nombre'), 'Galaxy S24')
    await user.type(screen.getByLabelText('Slug (URL)'), 'galaxy-s24')
    await user.type(screen.getByLabelText('Marca'), 'Samsung')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'samsung')
    await user.type(screen.getByLabelText('Precio (COP)'), '3500000')
    await user.type(screen.getByLabelText('Stock'), '4')
    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    // Assert
    expect(await screen.findByText('Error interno del servidor')).to.exist
    expect(screen.queryByText(/Phone_categoryId_fkey/)).to.be.null
  })

  it('la imagen principal debe ser una URL: texto suelto no llega al back', async () => {
    // Arrange
    sesionDeAdmin()
    const user = abrirApp('/admin/phones/new')
    await screen.findByRole('heading', { name: 'Nuevo celular' })

    // Act
    await user.type(screen.getByLabelText('Nombre'), 'Galaxy S24')
    await user.type(screen.getByLabelText('Slug (URL)'), 'galaxy-s24')
    await user.type(screen.getByLabelText('Marca'), 'Samsung')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'samsung')
    await user.type(screen.getByLabelText('Precio (COP)'), '3500000')
    await user.type(screen.getByLabelText('Stock'), '4')
    await user.type(screen.getByLabelText('URL imagen principal'), 'no-es-una-url')
    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    // Assert
    expect(await screen.findByText('URL inválida')).to.exist
    // El mensaje aparece al validar, antes de que se pudiera enviar nada.
    expect(servidor.peticiones('POST')).to.be.empty
  })
})
