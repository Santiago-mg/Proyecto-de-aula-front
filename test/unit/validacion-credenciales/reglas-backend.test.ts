import { expect } from 'chai'
import { describe, it } from 'vitest'
import {
  AYUDA_CONTRASENA,
  DOMINIOS_PERMITIDOS,
  MENSAJE_DOMINIO,
  MENSAJES_PASSWORD,
  PASSWORD_MAX,
  PASSWORD_MIN,
  emailRegistroSchema,
  emailSchema,
  passwordSchema,
} from '../../../src/utils/validacion'

// Regresión: las reglas del formulario deben ser IGUALES a las del backend
// (Proyecto-de-aula-mario/src/domain/credenciales.ts). Los valores de abajo
// son los mismos que fija tests/regression del backend; si una regla cambia en
// un solo lado, esta prueba o la del backend falla.

describe('Regresión — reglas de credenciales alineadas con el backend', () => {
  it('mismos 5 dominios y mismo mensaje de dominio', () => {
    expect([...DOMINIOS_PERMITIDOS]).to.deep.equal(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'])
    expect(MENSAJE_DOMINIO).to.equal('Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud.')
  })

  it('mismos límites y mensajes de contraseña', () => {
    expect(PASSWORD_MIN).to.equal(8)
    expect(PASSWORD_MAX).to.equal(72)
    expect(MENSAJES_PASSWORD).to.deep.equal({
      corta: 'La contraseña debe tener al menos 8 caracteres',
      larga: 'La contraseña no puede superar 72 caracteres',
      minuscula: 'La contraseña debe incluir al menos una letra minúscula',
      mayuscula: 'La contraseña debe incluir al menos una letra mayúscula',
      numero: 'La contraseña debe incluir al menos un número',
    })
    expect(AYUDA_CONTRASENA).to.match(/mayúscula, minúscula y número/)
  })

  it.each([
    ['Segura123', true],
    ['segura123', false], // sin mayúscula: el backend responde 400
    ['SEGURA123', false], // sin minúscula
    ['SeguraSegura', false], // sin número
    ['Seg1', false], // corta
    ['Aa1'.repeat(24), true], // 72 exactos
    ['Aa1'.repeat(24) + 'x', false], // 73
  ])('contraseña %j → válida: %s', (clave, valida) => {
    expect(passwordSchema.safeParse(clave).success).to.equal(valida)
  })

  it('el registro exige dominio permitido; el login no (admin@celularpro.co debe poder entrar)', () => {
    expect(emailRegistroSchema.safeParse('ana@gmail.com').success).to.equal(true)
    expect(emailRegistroSchema.safeParse('ana@celularpro.co').success).to.equal(false)
    expect(emailSchema.safeParse('admin@celularpro.co').success).to.equal(true)
  })

  it('el correo se normaliza igual que en el backend (trim + minúsculas)', () => {
    expect(emailRegistroSchema.parse('  Ana@Gmail.COM ')).to.equal('ana@gmail.com')
  })
})
