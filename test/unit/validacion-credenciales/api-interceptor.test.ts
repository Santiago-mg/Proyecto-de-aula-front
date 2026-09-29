import { expect } from 'chai'
import { describe, it, beforeEach } from 'vitest'
import api from '../../../src/services/api'

// Basado en: services/api.ts — interceptor de respuesta de Axios

// axios guarda los handlers registrados en interceptors.response.handlers,
// una propiedad interna que no está en sus tipos públicos
interface ManejadoresInternos {
  handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>
}

function getResponseErrorHandler() {
  const { handlers } = api.interceptors.response as unknown as ManejadoresInternos
  return handlers[0].rejected
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('cp_token', 'fake-token')
  localStorage.setItem('cp_user', JSON.stringify({ id: '1' }))
  // jsdom no implementa navigation real; se reemplaza location por un objeto
  // simple para poder leer a dónde se intentó redirigir
  Object.defineProperty(globalThis, 'location', { value: { href: '' }, configurable: true })
})

describe('interceptor de respuesta ante token inválido (401)', () => {
  // Camino 1,2,3,F — respuesta con status distinto de 401
  it('propaga el error sin tocar la sesión si el status no es 401', async () => {
    // Arrange
    const rejected = getResponseErrorHandler()
    const error = { response: { status: 500 } }

    // Act
    let errorPropagado: unknown
    try {
      await rejected(error)
    } catch (e) {
      errorPropagado = e
    }

    // Assert
    expect(errorPropagado).to.equal(error)
    expect(localStorage.getItem('cp_token')).to.equal('fake-token')
    expect(globalThis.location.href).to.equal('')
  })

  // Camino 1,2,4,5,F — respuesta con status 401 (token vencido/inválido)
  it('limpia la sesión local y redirige a /login si el status es 401', async () => {
    // Arrange
    const rejected = getResponseErrorHandler()
    const error = { response: { status: 401 } }

    // Act
    let errorPropagado: unknown
    try {
      await rejected(error)
    } catch (e) {
      errorPropagado = e
    }

    // Assert
    expect(errorPropagado).to.equal(error)
    expect(localStorage.getItem('cp_token')).to.be.null
    expect(localStorage.getItem('cp_user')).to.be.null
    expect(globalThis.location.href).to.equal('/login')
  })
})
