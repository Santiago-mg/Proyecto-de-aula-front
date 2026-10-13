import { describe, it, expect, beforeEach } from 'vitest'
import api from '../../../src/services/api'

/**
 * Regresión de un defecto corregido en el proyecto de Mario: un 401 del login,
 * sin sesión guardada, no debe recargar la página (el usuario perdería el
 * mensaje de "credenciales incorrectas").
 */

describe('Regresión — 401 del login', () => {
  beforeEach(() => {
    // Sin sesión guardada: es lo que pasa cuando alguien se equivoca de
    // contraseña en el login. (El caso con un token viejo guardado es otro y
    // está en pendiente-codigo-de-mario/.)
    localStorage.removeItem('cp_token')
    delete (window as unknown as { location?: unknown }).location
    // @ts-expect-error - simplificación para el test
    window.location = { href: '' }
  })

  it('regresion_401_del_login_no_recarga_la_pagina', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rejected = (api.interceptors.response as any).handlers[0].rejected
    const error = { response: { status: 401, data: {} }, config: { url: '/auth/login' } }

    await expect(rejected(error)).rejects.toBe(error)
    expect(window.location.href).toBe('')
  })
})
