import { expect } from 'chai'
import { describe, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { adminService } from '../../../../src/services/admin.service'
import { fallo, ok, servidor } from '../../../helpers/servidor'
import { filaUsuario, sesionDeAdmin, TOKEN_ADMIN } from '../../../helpers/fixtures'
import { capturarRedirecciones } from '../../../helpers/app'
import { capturarErrorHttp } from '../helpers/promesas'

/**
 * ESC-26 — Banear usuario · API testing (front)
 * adminService.banUser(id, reason) → PUT /admin/users/:id/ban { reason }
 */

const RUTA = '/admin/users/user-2/ban'

describe('ESC-26 · API (front) — adminService.banUser', () => {
  it('envía PUT con el motivo en el cuerpo y el token del admin, y devuelve el usuario', async () => {
    // Arrange
    sesionDeAdmin()
    const baneada = filaUsuario({ banned: true, banReason: 'fraude en pagos' })
    servidor.responder('PUT', RUTA, ok(baneada))

    // Act
    const resultado = await adminService.banUser('user-2', 'fraude en pagos')

    // Assert
    expect(resultado).to.deep.equal(baneada)
    const [peticion] = servidor.peticiones('PUT', RUTA)
    expect(peticion.body).to.deep.equal({ reason: 'fraude en pagos' })
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })

  it.each([
    [400, 'Datos inválidos'],
    [403, 'Acceso restringido a administradores'],
    [404, 'Usuario no encontrado'],
    [500, 'Error interno del servidor'],
  ])('si el back responde %i, la promesa se rechaza con ese estado y el mensaje del back', async (estado, mensaje) => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('PUT', RUTA, fallo(estado, mensaje))

    // Act
    const error = await capturarErrorHttp(adminService.banUser('user-2', 'fraude en pagos'))

    // Assert
    expect(error.response?.status).to.equal(estado)
    expect(error.response?.data.error).to.equal(mensaje)
  })

  it('un 401 con sesión guardada borra la sesión y lleva a /login', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('PUT', RUTA, fallo(401, 'Token inválido o expirado'))
    const redirecciones = capturarRedirecciones()

    // Act
    await capturarErrorHttp(adminService.banUser('user-2', 'fraude en pagos'))

    // Assert
    await waitFor(() => {
      expect(redirecciones).to.deep.equal(['/login'])
    })
    expect(localStorage.getItem('cp_token')).to.be.null
    expect(localStorage.getItem('cp_user')).to.be.null
  })
})
