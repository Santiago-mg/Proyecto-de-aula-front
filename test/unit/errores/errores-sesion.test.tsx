import { expect } from 'chai'
import { describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AxiosError } from 'axios'
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage'
import { avisoDeSesion, codigoDeError, mensajeDeError } from '../../../src/utils/errores'

// Basado en: utils/errores.ts + ErrorMessage.tsx

function errorHttp(status: number, body: unknown) {
  return new AxiosError('fallo', AxiosError.ERR_BAD_REQUEST, undefined, null, {
    status, data: body, statusText: '', headers: {}, config: {} as never,
  })
}

describe('mensajeDeError', () => {
  it('usa el primer mensaje por campo cuando el backend lo detalla (en vez de "Datos inválidos")', () => {
    const e = errorHttp(400, { error: 'Datos inválidos', errors: [{ field: 'password', message: 'La contraseña debe incluir al menos un número' }] })
    expect(mensajeDeError(e)).to.equal('La contraseña debe incluir al menos un número')
  })
  it('sin detalle por campo usa el mensaje general del backend', () => {
    expect(mensajeDeError(errorHttp(401, { error: 'Credenciales inválidas' }))).to.equal('Credenciales inválidas')
  })
  it('con la lista de errores vacía cae al mensaje general, en lenguaje cotidiano (H2)', () => {
    expect(mensajeDeError(errorHttp(400, { error: 'Datos inválidos', errors: [] }))).to.equal(
      'Algunos datos no son válidos. Revisa el formulario e inténtalo de nuevo.',
    )
  })
  it.each([
    ['Token inválido o expirado', 'Tu sesión ya no es válida. Inicia sesión de nuevo.'],
    ['Token requerido', 'Necesitas iniciar sesión para hacer esto.'],
    ['Ruta no encontrada', 'No encontramos lo que buscabas. Recarga la página o vuelve al inicio.'],
    ['Error interno del servidor', 'Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.'],
  ])('H2: traduce el mensaje técnico "%s"', (tecnico, cotidiano) => {
    expect(mensajeDeError(errorHttp(401, { error: tecnico }))).to.equal(cotidiano)
  })
  it('H2: los mensajes del backend que ya son claros se muestran tal cual', () => {
    expect(mensajeDeError(errorHttp(400, { error: 'La contraseña actual no es correcta' }))).to.equal('La contraseña actual no es correcta')
  })
  it('sin respuesta del servidor avisa que falló la conexión', () => {
    expect(mensajeDeError(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).to.equal('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.')
  })
  it('un Error común devuelve su mensaje y null devuelve texto vacío', () => {
    expect(mensajeDeError(new Error('algo falló'))).to.equal('algo falló')
    expect(mensajeDeError(null)).to.equal('')
  })
})

describe('codigoDeError / avisoDeSesion', () => {
  it('lee el code que agrega el backend', () => {
    expect(codigoDeError(errorHttp(401, { error: 'x', code: 'TOKEN_EXPIRED' }))).to.equal('TOKEN_EXPIRED')
  })
  it('devuelve undefined si no es un error HTTP o no trae code', () => {
    expect(codigoDeError(new Error('x'))).to.be.undefined
    expect(codigoDeError(errorHttp(401, { error: 'x' }))).to.be.undefined
  })
  it('cada code tiene su mensaje y cualquier otro cae al genérico', () => {
    expect(avisoDeSesion('TOKEN_EXPIRED')).to.match(/vencido/)
    // El backend actual no envía TOKEN_REVOKED (no revoca tokens): cae al genérico.
    expect(avisoDeSesion('TOKEN_REVOKED')).to.equal('Tu sesión ya no es válida. Inicia sesión de nuevo.')
    expect(avisoDeSesion('TOKEN_INVALID')).to.equal('Tu sesión ya no es válida. Inicia sesión de nuevo.')
    expect(avisoDeSesion(undefined)).to.equal('Tu sesión ya no es válida. Inicia sesión de nuevo.')
  })
})

describe('ErrorMessage', () => {
  it('se anuncia como alerta (role="alert") para lectores de pantalla', () => {
    render(<ErrorMessage error={new Error('Falló algo')} />)
    expect(screen.getByRole('alert').textContent).to.equal('Falló algo')
  })
  it('muestra el detalle por campo del backend', () => {
    render(<ErrorMessage error={errorHttp(400, { error: 'Datos inválidos', errors: [{ message: 'Email inválido' }] })} />)
    expect(screen.getByRole('alert').textContent).to.equal('Email inválido')
  })
})
