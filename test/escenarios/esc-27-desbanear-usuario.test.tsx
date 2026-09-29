import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../helpers/app'
import { fallo, listado, ok, servidor } from '../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin, sesionIniciada, TOKEN_ADMIN } from '../helpers/fixtures'

// ESC-27 — Desbanear usuario (V(G)=5)
// Caminos de tests/escenarios/esc-27-desbanear-usuario.test.ts del back.

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })
const SUSPENDIDO = filaUsuario({
  id: 'user-3',
  name: 'Luis Baneado',
  email: 'luis@gmail.com',
  banned: true,
  banReason: 'Spam en reseñas',
  bannedAt: '2026-02-01T00:00:00.000Z',
})

function listadoConSuspendido() {
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, SUSPENDIDO])))
}

async function filaDe(nombre: string) {
  return (await screen.findByText(nombre)).closest('tr') as HTMLElement
}

describe('ESC-27 — Desbanear usuario', () => {
  it('Camino 1 (1-2-10): sin sesión no se entra al panel y se pide iniciar sesión', async () => {
    // Arrange
    const ruta = '/admin/users'

    // Act
    abrirApp(ruta)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(rutaActual()).to.equal('/login')
  })

  it('Camino 2 (1-3-4-10): token inválido → 401, se borra la sesión y se redirige a /login', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', fallo(401, 'Token inválido o expirado'))
    const redirecciones = capturarRedirecciones()

    // Act
    abrirApp('/admin/users')

    // Assert
    await waitFor(() => {
      expect(redirecciones).to.deep.equal(['/login'])
    })
    expect(localStorage.getItem('cp_token')).to.be.null
  })

  it('Camino 3 (1-3-5-6-10): rol USER → acceso no autorizado', async () => {
    // Arrange
    sesionIniciada()

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).to.exist
    expect(servidor.peticiones()).to.be.empty
  })

  it('Camino 4 (1-3-5-7-8-10): el id no existe → 404, se muestra el error y sigue baneado', async () => {
    // Arrange
    sesionDeAdmin()
    listadoConSuspendido()
    servidor.responder('PUT', '/admin/users/user-3/unban', fallo(404, 'Usuario no encontrado'))
    const user = abrirApp('/admin/users')
    const fila = await filaDe('Luis Baneado')

    // Act
    await user.click(within(fila).getByRole('button', { name: /desbanear/i }))

    // Assert
    expect(await screen.findByText('Usuario no encontrado')).to.exist
    expect(within(fila).queryByText('Baneado')).to.exist
    expect(within(fila).getByRole('button', { name: /desbanear/i })).to.have.property('disabled', false)
  })

  it('Camino 5 (1-3-5-7-9-10): usuario suspendido → 200, queda activo y sin motivo', async () => {
    // Arrange
    sesionDeAdmin()
    listadoConSuspendido()
    servidor.responder(
      'PUT',
      '/admin/users/user-3/unban',
      ok({ ...SUSPENDIDO, banned: false, banReason: null, bannedAt: null }),
    )
    const user = abrirApp('/admin/users')
    const fila = await filaDe('Luis Baneado')

    // Act
    await user.click(within(fila).getByRole('button', { name: /desbanear/i }))

    // Assert
    expect(await within(fila).findByText('Activo')).to.exist
    expect(within(fila).queryByText('Spam en reseñas')).to.be.null
    expect(within(fila).queryByRole('button', { name: /^banear/i })).to.exist
    const [peticion] = servidor.peticiones('PUT', '/admin/users/user-3/unban')
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })
})
