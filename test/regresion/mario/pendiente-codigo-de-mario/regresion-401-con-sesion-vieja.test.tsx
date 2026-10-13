import { describe, it, expect, beforeEach } from 'vitest'
import api from '../../../../src/services/api'

/**
 * Escenario original de Mario, tal cual: hay un token viejo guardado y el
 * login responde 401 por credenciales incorrectas. En el proyecto de Mario la
 * página NO se recarga. En este front sí: el interceptor de src/services/api.ts
 * solo mira si hay token guardado, no a qué ruta pertenece el 401, así que
 * borra la sesión y manda a /login (recarga y se pierde el mensaje de error).
 *
 * Es un caso borde real de este front. Se arregla con la misma idea de Mario:
 * dejar pasar el 401 cuando la petición es /auth/login o /auth/register.
 */
describe('Regresión — 401 del login con un token viejo guardado', () => {
  beforeEach(() => {
    localStorage.setItem('cp_token', 't')
    delete (window as unknown as { location?: unknown }).location
    // @ts-expect-error - simplificación para el test
    window.location = { href: '' }
  })

  it('regresion_401_del_login_con_token_viejo_no_recarga_la_pagina', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rejected = (api.interceptors.response as any).handlers[0].rejected
    const error = { response: { status: 401, data: {} }, config: { url: '/auth/login' } }

    await expect(rejected(error)).rejects.toBe(error)
    expect(window.location.href).toBe('')
  })
})
