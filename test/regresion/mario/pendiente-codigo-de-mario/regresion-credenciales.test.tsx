import { describe, it, expect } from 'vitest'
import {
  DOMINIOS_PERMITIDOS,
  MENSAJE_DOMINIO,
  MENSAJES_PASSWORD,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from '../../../../src/validation/credenciales'

/**
 * Regresión de credenciales y de los defectos corregidos en esta versión.
 *
 * Los valores de la primera sección son IDÉNTICOS a los que fija
 * tests/regression/regresion-credenciales.test.ts en el backend. Si una regla
 * cambia en un solo proyecto, una de las dos suites se rompe.
 */

describe('Regresión — reglas alineadas con el backend', () => {
  it('regresion_dominios_permitidos_son_cinco', () => {
    expect(DOMINIOS_PERMITIDOS).toEqual(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'])
  })

  it('regresion_longitud_de_contrasena_entre_8_y_72', () => {
    expect([PASSWORD_MIN, PASSWORD_MAX]).toEqual([8, 72])
  })

  it('regresion_mensajes_identicos_a_los_del_backend', () => {
    expect(MENSAJE_DOMINIO).toBe('Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud.')
    expect(MENSAJES_PASSWORD.mayuscula).toBe('La contraseña debe incluir al menos una letra mayúscula')
  })
})
