import { expect } from 'chai'
import { describe, it } from 'vitest'
import { AxiosError } from 'axios'
import { adminService } from '../../../../src/services/admin.service'
import { fallo, ok, servidor, sinConexion } from '../../../helpers/servidor'
import { estadisticas, sesionDeAdmin, TOKEN_ADMIN } from '../../../helpers/fixtures'
import { capturarError, capturarErrorHttp } from '../helpers/promesas'

/**
 * ESC-29 — Panel de estadísticas · API testing (front)
 * adminService.getStats() → GET /admin/stats
 */

const RUTA = '/admin/stats'

describe('ESC-29 · API (front) — adminService.getStats', () => {
  it('pide GET /admin/stats con el token del admin y devuelve el objeto sin envoltorio', async () => {
    // Arrange
    sesionDeAdmin()
    const datos = estadisticas()
    servidor.responder('GET', RUTA, ok(datos))

    // Act
    const resultado = await adminService.getStats()

    // Assert
    expect(resultado).to.deep.equal(datos)
    const [peticion] = servidor.peticiones('GET', RUTA)
    expect(peticion.params).to.deep.equal({})
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })

  it.each([
    [403, 'Acceso restringido a administradores'],
    [500, 'Error interno del servidor'],
  ])('si el back responde %i, el error llega con su mensaje', async (estado, mensaje) => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', RUTA, fallo(estado, mensaje))

    // Act
    const error = await capturarErrorHttp(adminService.getStats())

    // Assert
    expect(error.response?.status).to.equal(estado)
    expect(error.response?.data.error).to.equal(mensaje)
  })

  it('sin conexión con el back, el error es de red y no trae respuesta', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', RUTA, sinConexion())

    // Act
    const error = await capturarError(adminService.getStats())

    // Assert
    expect(error).to.be.instanceOf(AxiosError)
    expect((error as AxiosError).code).to.equal('ERR_NETWORK')
    expect((error as AxiosError).response).to.equal(undefined)
  })
})
