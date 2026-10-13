import { expect } from 'chai'
import { describe, it } from 'vitest'
import { adminService } from '../../../../src/services/admin.service'
import { fallo, ok, servidor } from '../../../helpers/servidor'
import { filaUsuario, sesionDeAdmin, TOKEN_ADMIN } from '../../../helpers/fixtures'
import { capturarErrorHttp } from '../helpers/promesas'

/**
 * ESC-27 — Desbanear usuario · API testing (front)
 * adminService.unbanUser(id) → PUT /admin/users/:id/unban (sin cuerpo)
 */

const RUTA = '/admin/users/user-2/unban'

describe('ESC-27 · API (front) — adminService.unbanUser', () => {
  it('envía PUT sin cuerpo, con el token del admin, y devuelve el usuario reactivado', async () => {
    // Arrange
    sesionDeAdmin()
    const activa = filaUsuario({ banned: false, banReason: null, bannedAt: null })
    servidor.responder('PUT', RUTA, ok(activa))

    // Act
    const resultado = await adminService.unbanUser('user-2')

    // Assert
    expect(resultado).to.deep.equal(activa)
    const [peticion] = servidor.peticiones('PUT', RUTA)
    expect(peticion.body).to.equal(undefined)
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })

  it('desbanear a alguien dos veces hace dos peticiones iguales (PUT idempotente)', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('PUT', RUTA, ok(filaUsuario()))

    // Act
    await adminService.unbanUser('user-2')
    await adminService.unbanUser('user-2')

    // Assert
    const [primera, segunda] = servidor.peticiones('PUT', RUTA)
    expect(segunda).to.deep.equal(primera)
  })

  it.each([
    [403, 'Acceso restringido a administradores'],
    [404, 'Usuario no encontrado'],
  ])('si el back responde %i, el error llega con su mensaje', async (estado, mensaje) => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('PUT', RUTA, fallo(estado, mensaje))

    // Act
    const error = await capturarErrorHttp(adminService.unbanUser('user-2'))

    // Assert
    expect(error.response?.status).to.equal(estado)
    expect(error.response?.data.error).to.equal(mensaje)
  })
})
