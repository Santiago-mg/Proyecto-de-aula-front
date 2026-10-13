import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { fallo, listado, servidor, type Peticion } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'

/**
 * ESC-28 — Consultar usuarios · regression-testing (front)
 * Pantalla /admin/users: carga, búsqueda, paginación y lo que muestra cada fila.
 */

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })

/** Responde según la página y la búsqueda que lleguen, como el back real. */
function backDeUsuarios(total: number, totalPages: number) {
  servidor.responder('GET', '/admin/users', (peticion: Peticion) => {
    const pagina = Number(peticion.params.page)
    const busqueda = peticion.params.search as string | undefined
    const nombre = busqueda ? `Resultado de "${busqueda}"` : `Usuario de la página ${pagina}`
    return listado(paginado([FILA_ADMIN, filaUsuario({ id: `user-p${pagina}`, name: nombre })], {
      total,
      page: pagina,
      totalPages: busqueda ? 1 : totalPages,
    }))
  })
}

describe('ESC-28 · Regresión (front) — consultar usuarios', () => {
  it('al entrar pide la página 1 sin búsqueda y muestra el total registrado', async () => {
    // Arrange
    sesionDeAdmin()
    backDeUsuarios(57, 3)

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByText('57 usuarios registrados')).to.exist
    expect(servidor.peticiones('GET', '/admin/users')[0].params).to.deep.equal({ page: 1, limit: 20, search: undefined })
  })

  it('"Siguiente" pide la página 2 y muestra "2 / 3"', async () => {
    // Arrange
    sesionDeAdmin()
    backDeUsuarios(57, 3)
    const user = abrirApp('/admin/users')
    await screen.findByText('Usuario de la página 1')

    // Act
    await user.click(screen.getByRole('button', { name: /siguiente/i }))

    // Assert
    expect(await screen.findByText('Usuario de la página 2')).to.exist
    expect(screen.getByText('2 / 3')).to.exist
    expect(servidor.peticiones('GET', '/admin/users').map((p) => p.params.page)).to.deep.equal([1, 2])
  })

  it('"Anterior" desde la página 2 vuelve a pedir la 1 y muestra "1 / 3"', async () => {
    // Arrange
    sesionDeAdmin()
    backDeUsuarios(57, 3)
    const user = abrirApp('/admin/users')
    await screen.findByText('Usuario de la página 1')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await screen.findByText('Usuario de la página 2')

    // Act
    await user.click(screen.getByRole('button', { name: /anterior/i }))

    // Assert
    expect(await screen.findByText('Usuario de la página 1')).to.exist
    expect(screen.getByText('1 / 3')).to.exist
    expect(servidor.peticiones('GET', '/admin/users').map((p) => p.params.page)).to.deep.equal([1, 2, 1])
  })

  it('buscar estando en la página 2 vuelve a la página 1', async () => {
    // Arrange
    sesionDeAdmin()
    backDeUsuarios(57, 3)
    const user = abrirApp('/admin/users')
    await screen.findByText('Usuario de la página 1')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await screen.findByText('Usuario de la página 2')

    // Act
    await user.type(screen.getByPlaceholderText(/buscar por nombre o email/i), 'ana')

    // Assert
    expect(await screen.findByText('Resultado de "ana"', {}, { timeout: 2_000 })).to.exist
    const ultima = servidor.peticiones('GET', '/admin/users').at(-1)
    expect(ultima?.params).to.deep.equal({ page: 1, limit: 20, search: 'ana' })
  })

  it('borrar la búsqueda vuelve a la lista completa, sin mandar search vacío', async () => {
    // Arrange
    sesionDeAdmin()
    backDeUsuarios(57, 3)
    const user = abrirApp('/admin/users')
    const buscador = await screen.findByPlaceholderText(/buscar por nombre o email/i)
    await user.type(buscador, 'ana')
    await screen.findByText('Resultado de "ana"', {}, { timeout: 2_000 })

    // Act
    await user.clear(buscador)

    // Assert
    expect(await screen.findByText('Usuario de la página 1', {}, { timeout: 2_000 })).to.exist
    expect(servidor.peticiones('GET', '/admin/users').at(-1)?.params.search).to.equal(undefined)
  })

  it('cada fila muestra rol, pedidos y estado; la propia lleva la marca "(tú)"', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', listado(paginado([
      FILA_ADMIN,
      filaUsuario({ orderCount: 7 }),
      filaUsuario({ id: 'user-3', name: 'Beto Ruiz', email: 'beto@gmail.com', banned: true, banReason: 'spam' }),
    ])))

    // Act
    abrirApp('/admin/users')

    // Assert
    const propia = (await screen.findByText('(tú)')).closest('tr') as HTMLElement
    expect(within(propia).getByText('Admin')).to.exist
    const ana = screen.getByText('Ana Torres').closest('tr') as HTMLElement
    expect(within(ana).getByText('Usuario')).to.exist
    expect(within(ana).getByText('7')).to.exist
    expect(within(ana).getByText('Activo')).to.exist
    const beto = screen.getByText('Beto Ruiz').closest('tr') as HTMLElement
    expect(within(beto).getByText('Baneado')).to.exist
    expect(within(beto).getByText('spam')).to.exist
  })

  it('si la lista no carga, se explica el motivo que da el back', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByText('Error interno del servidor')).to.exist
    await waitFor(() => {
      expect(screen.queryByText('Cargando usuarios...')).to.equal(null)
    })
  })
})
