import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Stagehand } from '@browserbasehq/stagehand'
import { ADMIN_EMAIL, ADMIN_PASSWORD, HAY_LLM } from '../soporte/entorno'
import { abrirStagehand, esperarRuta, guardarEvidencia, ir, type Pagina, texto, esperarVisible } from '../soporte/stagehand'

describe.skipIf(!HAY_LLM)('Stagehand — Inicio de sesión', () => {
  let stagehand: Stagehand
  let page: Pagina

  beforeEach(async () => {
    ;({ stagehand, page } = await abrirStagehand())
  })
  afterEach(async (ctx) => {
    await guardarEvidencia(stagehand, page, `login-${ctx.task.name.slice(0, 40).replace(/\W+/g, '-')}`)
    await stagehand.close()
  })

  it('observe → act: se reutilizan las acciones observadas sin volver a llamar al modelo (positivo)', async () => {
    await ir(page, '/login', '#email')

    // Patrón observe → act: observe devuelve acciones con selector; act(acción) las ejecuta tal cual
    const [campoCorreo] = await stagehand.observe('find the email input of the login form')
    const [campoClave] = await stagehand.observe('find the password input of the login form')
    expect(campoCorreo?.selector, 'observe debe devolver un selector para el correo').toBeTruthy()
    expect(campoClave?.selector).toBeTruthy()

    await stagehand.act({ ...campoCorreo, method: 'fill', arguments: [ADMIN_EMAIL] })
    await stagehand.act({ ...campoClave, method: 'fill', arguments: [ADMIN_PASSWORD] })
    const resultado = await stagehand.act('click the "Ingresar" submit button')
    expect(resultado.success).toBe(true)

    expect(await esperarRuta(page, '/dashboard')).toBe('/dashboard')
    const enlaces = await stagehand.observe('find the "Mi cuenta" and "Panel admin" links in the navigation bar')
    expect(enlaces.length).toBeGreaterThanOrEqual(2)
  })

  it('con la contraseña incorrecta no entra y explica el motivo (negativo)', async () => {
    await ir(page, '/login', '#email')
    await stagehand.act(`type "${ADMIN_EMAIL}" into the email field`)
    await stagehand.act('type "NoEsLaClave1" into the password field')
    await stagehand.act('click the "Ingresar" submit button')

    await esperarVisible(page, '[role="alert"]')
    const error = await stagehand.extract(
      'extract the text of the error alert shown after the failed login (the alert message itself, not the help links) and whether there is a help link next to it',
      z.object({ mensaje: z.string(), hayEnlaceDeAyuda: z.boolean() }),
    )
    expect(texto(error.mensaje)).toContain('credenciales invalidas')
    expect(error.hayEnlaceDeAyuda).toBe(true)
    // Determinista: el texto también está en el DOM, en el rol alert
    const alerta = await page.evaluate(() => document.querySelector('[role="alert"]')?.textContent ?? '')
    expect(alerta).toContain('Credenciales inválidas')
    expect(new URL(page.url()).pathname).toBe('/login')
  })
})
