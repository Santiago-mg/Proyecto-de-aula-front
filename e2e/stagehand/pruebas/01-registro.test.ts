import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Stagehand } from '@browserbasehq/stagehand'
import { CLAVE_PRUEBA, HAY_LLM } from '../soporte/entorno'
import { abrirStagehand, accionDelCampo, correoNuevo, esperarRuta, guardarEvidencia, ir, type Pagina, texto, esperarVisible } from '../soporte/stagehand'

describe.skipIf(!HAY_LLM)('Stagehand — Registro de usuario', () => {
  let stagehand: Stagehand
  let page: Pagina

  beforeEach(async () => {
    ;({ stagehand, page } = await abrirStagehand())
  })
  afterEach(async (ctx) => {
    await guardarEvidencia(stagehand, page, `registro-${ctx.task.name.slice(0, 40).replace(/\W+/g, '-')}`)
    await stagehand.close()
  })

  it('observe encuentra el formulario; act lo llena; extract lee el saludo (positivo)', async () => {
    const correo = correoNuevo()
    await ir(page, '/register', '#name')

    // observe: la IA identifica los campos y el botón del formulario
    const elementos = await stagehand.observe('find the full name, email, password and confirm password inputs and the create account button')
    expect(elementos.length, 'observe debe encontrar al menos los 4 campos y el botón').toBeGreaterThanOrEqual(5)

    // observe → act: se reutilizan las acciones que encontró observe (sin volver a consultar
    // al modelo). Se comprueba que cada una apunta al campo correcto por su id real.
    const valores: Record<string, string> = { name: 'Ana Pérez', email: correo, password: CLAVE_PRUEBA, confirmPassword: CLAVE_PRUEBA }
    for (const [id, valor] of Object.entries(valores)) {
      const accion = await accionDelCampo(page, elementos, id)
      expect(accion, `observe debe encontrar el campo #${id}`).toBeTruthy()
      await stagehand.act({ ...accion!, method: 'fill', arguments: [valor] })
    }
    const boton = elementos.find((e) => e.method === 'click')
    expect(boton, 'observe debe encontrar el botón de crear cuenta').toBeTruthy()
    await stagehand.act({ ...boton!, arguments: [] })

    // Verificación determinista: la URL
    expect(await esperarRuta(page, '/dashboard')).toBe('/dashboard')

    // extract: datos estructurados de la pantalla
    const cuenta = await stagehand.extract(
      'extract the greeting heading and the email address shown for the account',
      z.object({ saludo: z.string(), correo: z.string() }),
    )
    expect(texto(cuenta.saludo)).toContain('hola, ana')
    expect(cuenta.correo.toLowerCase()).toBe(correo.toLowerCase())
  })

  it('un correo de dominio no permitido no se envía (negativo)', async () => {
    await ir(page, '/register', '#name')
    await stagehand.act('type "Ana Pérez" into the "Nombre completo" field')
    await stagehand.act('type "ana@empresa.com" into the "Email" field')
    await stagehand.act(`type "${CLAVE_PRUEBA}" into the "Contraseña" field (not the confirmation)`)
    await stagehand.act(`type "${CLAVE_PRUEBA}" into the "Confirmar contraseña" field`)
    await stagehand.act('click the "Crear cuenta gratis" button')

    await esperarVisible(page, '.cp-field-error')
    const { mensaje } = await stagehand.extract(
      'extract the validation error message shown under the email field',
      z.object({ mensaje: z.string() }),
    )
    expect(texto(mensaje)).toContain('correo invalido')
    // Determinista: sigue en el formulario
    expect(new URL(page.url()).pathname).toBe('/register')
  })
})
