import { expect } from 'chai'
import { describe, it } from 'vitest'
import api from '../../../src/services/api'
import { capturarRedirecciones } from '../../helpers/app'
import { fallo, ok, servidor } from '../../helpers/servidor'
import { sesionIniciada, TOKEN_USUARIO } from '../../helpers/fixtures'

// Basado en: services/api.ts — interceptores de petición y de respuesta.
// Equivalente front de tests/unit/login/authenticate.middleware.test.ts:
// el token viaja como Bearer y un 401 solo cierra la sesión si había una.

describe('interceptor de petición — cabecera Authorization', () => {
  it('con sesión, cada petición lleva el token como Bearer', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([]))

    // Act
    await api.get('/orders/my')

    // Assert
    expect(servidor.peticiones('GET', '/orders/my')[0].authorization).to.equal(`Bearer ${TOKEN_USUARIO}`)
  })

  it('sin sesión la petición sale sin cabecera', async () => {
    // Arrange
    servidor.responder('GET', '/phones', ok([]))

    // Act
    await api.get('/phones')

    // Assert
    expect(servidor.peticiones('GET', '/phones')[0].authorization).to.be.undefined
  })
})

describe('interceptor de respuesta — 401 sin sesión', () => {
  it('un login fallido (401 sin token guardado) solo propaga el error, sin redirigir', async () => {
    // Arrange
    servidor.responder('POST', '/auth/login', fallo(401, 'Credenciales inválidas'))
    const redirecciones = capturarRedirecciones()

    // Act
    const error = await api.post('/auth/login', {}).catch((e: unknown) => e)

    // Assert
    expect(error).to.have.nested.property('response.status', 401)
    expect(redirecciones).to.be.empty
  })
})
