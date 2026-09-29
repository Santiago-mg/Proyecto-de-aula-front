import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../helpers/app'
import { fallo, listado, ok, servidor } from '../helpers/servidor'
import {
  administrador,
  filaUsuario,
  paginado,
  sesionDeAdmin,
  sesionIniciada,
  TOKEN_ADMIN,
} from '../helpers/fixtures'

// ESC-26 — Banear usuario (V(G)=7)
// Mismos caminos que tests/escenarios/esc-26-banear-usuario.test.ts del back,
// vistos desde el panel: la app corre completa y cada camino se provoca con la
// respuesta que programa el doble de red.

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })
const ANA = filaUsuario()

function listadoConAna() {
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, ANA])))
}

async function filaDe(nombre: string) {
  return (await screen.findByText(nombre)).closest('tr') as HTMLElement
}

describe('ESC-26 — Banear usuario', () => {
  it('Camino 1 (1-2-14): sin sesión no se entra al panel y se pide iniciar sesión', async () => {
    // Arrange
    const ruta = '/admin/users'

    // Act
    abrirApp(ruta)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(rutaActual()).to.equal('/login')
    expect(servidor.peticiones('GET', '/admin/users')).to.be.empty
  })

  it('Camino 2 (1-3-4-14): token inválido → 401, se borra la sesión y se redirige a /login', async () => {
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
    expect(localStorage.getItem('cp_user')).to.be.null
    expect(servidor.peticiones('GET', '/admin/users')[0].authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })

  it('Camino 3 (1-3-5-6-14): rol USER → acceso no autorizado, sin llamar al backend', async () => {
    // Arrange
    sesionIniciada()

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).to.exist
    expect(servidor.peticiones('GET', '/admin/users')).to.be.empty
  })

  it('Camino 4 (1-3-5-7-8-14): motivo con menos de 4 caracteres → no se puede confirmar', async () => {
    // Arrange
    sesionDeAdmin()
    listadoConAna()
    const user = abrirApp('/admin/users')
    const fila = await filaDe('Ana Torres')
    await user.click(within(fila).getByRole('button', { name: /^banear/i }))

    // Act
    await user.type(screen.getByLabelText('Motivo del baneo'), '  abc  ')

    // Assert
    expect(screen.getByRole('button', { name: /confirmar baneo/i })).to.have.property('disabled', true)
    expect(servidor.peticiones('PUT')).to.be.empty
  })

  it('Camino 5 (1-3-5-7-9-10-14): un admin no puede banearse a sí mismo (RN-05)', async () => {
    // Arrange
    sesionDeAdmin()
    listadoConAna()

    // Act
    abrirApp('/admin/users')
    const filaPropia = await filaDe('(tú)')

    // Assert
    expect(within(filaPropia).queryByRole('button', { name: /banear/i })).to.be.null
    expect(within(filaPropia).queryByRole('button', { name: /admin/i })).to.be.null
  })

  it('Camino 6 (1-3-5-7-9-11-12-14): el id no existe → 404, se muestra el error y la fila no cambia', async () => {
    // Arrange
    sesionDeAdmin()
    listadoConAna()
    servidor.responder('PUT', '/admin/users/user-2/ban', fallo(404, 'Usuario no encontrado'))
    const user = abrirApp('/admin/users')
    const fila = await filaDe('Ana Torres')

    // Act
    await user.click(within(fila).getByRole('button', { name: /^banear/i }))
    await user.type(screen.getByLabelText('Motivo del baneo'), 'Fraude reiterado')
    await user.click(screen.getByRole('button', { name: /confirmar baneo/i }))

    // Assert
    expect(await screen.findByText('Usuario no encontrado')).to.exist
    expect(within(fila).queryByText('Activo')).to.exist
    expect(within(fila).getByRole('button', { name: /^banear/i })).to.have.property('disabled', false)
  })

  it('Camino 7 (1-3-5-7-9-11-13-14): datos correctos → 200 y la fila queda baneada con su motivo', async () => {
    // Arrange
    sesionDeAdmin()
    listadoConAna()
    servidor.responder(
      'PUT',
      '/admin/users/user-2/ban',
      ok(filaUsuario({ banned: true, banReason: 'Fraude reiterado', bannedAt: '2026-03-01T00:00:00.000Z' })),
    )
    const user = abrirApp('/admin/users')
    const fila = await filaDe('Ana Torres')

    // Act
    await user.click(within(fila).getByRole('button', { name: /^banear/i }))
    await user.type(screen.getByLabelText('Motivo del baneo'), '  Fraude reiterado ')
    await user.click(screen.getByRole('button', { name: /confirmar baneo/i }))

    // Assert
    expect(await within(fila).findByText('Baneado')).to.exist
    expect(within(fila).queryByText('Fraude reiterado')).to.exist
    const [peticion] = servidor.peticiones('PUT', '/admin/users/user-2/ban')
    expect(peticion.body).to.deep.equal({ reason: 'Fraude reiterado' })
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })
})
