import { expect } from 'chai'
import { describe, it } from 'vitest'
import { phonesService } from '../../../../src/services/phones.service'
import { fallo, ok, servidor } from '../../../helpers/servidor'
import { celular, sesionIniciada } from '../../../helpers/fixtures'
import { capturarErrorHttp } from '../helpers/promesas'

/**
 * ESC-13 — Recomendación de productos · API testing (front)
 * phonesService.getSimilar(slug, limit) → GET /phones/:slug/similares
 *
 * El contrato entre el front y el back visto desde el cliente HTTP: qué
 * petición sale (método, URL, parámetros, cabeceras) y qué hace el servicio
 * con cada respuesta.
 */

const RUTA = '/phones/iphone-15/similares'

describe('ESC-13 · API (front) — phonesService.getSimilar', () => {
  it('pide GET /phones/:slug/similares con limit=4 y devuelve la lista sin envoltorio', async () => {
    // Arrange
    const similares = [celular({ id: 'p-2', slug: 'iphone-14' }), celular({ id: 'p-3', slug: 'iphone-13' })]
    servidor.responder('GET', RUTA, ok(similares))

    // Act
    const resultado = await phonesService.getSimilar('iphone-15')

    // Assert
    expect(resultado).to.deep.equal(similares)
    const peticiones = servidor.peticiones('GET', RUTA)
    expect(peticiones).to.have.lengthOf(1)
    expect(peticiones[0].params).to.deep.equal({ limit: 4 })
  })

  it.each([1, 12])('respeta el límite que se le pida (%i)', async (limite) => {
    // Arrange
    servidor.responder('GET', RUTA, ok([]))

    // Act
    await phonesService.getSimilar('iphone-15', limite)

    // Assert
    expect(servidor.peticiones('GET', RUTA)[0].params).to.deep.equal({ limit: limite })
  })

  it('es pública: sin sesión la petición sale sin cabecera Authorization', async () => {
    // Arrange
    servidor.responder('GET', RUTA, ok([]))

    // Act
    await phonesService.getSimilar('iphone-15')

    // Assert
    expect(servidor.peticiones('GET', RUTA)[0].authorization).to.equal(undefined)
  })

  it('con sesión iniciada sigue funcionando igual (el token no estorba)', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('GET', RUTA, ok([celular()]))

    // Act
    const resultado = await phonesService.getSimilar('iphone-15')

    // Assert
    expect(resultado).to.have.lengthOf(1)
  })

  it.each([
    [400, 'Datos inválidos'],
    [404, 'Celular no encontrado'],
    [500, 'Error interno del servidor'],
  ])('si el back responde %i, la promesa se rechaza con ese estado y su mensaje', async (estado, mensaje) => {
    // Arrange
    servidor.responder('GET', RUTA, fallo(estado, mensaje))

    // Act
    const error = await capturarErrorHttp(phonesService.getSimilar('iphone-15'))

    // Assert
    expect(error.response?.status).to.equal(estado)
    expect(error.response?.data).to.deep.equal({ error: mensaje })
  })
})
