import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Stagehand } from '@browserbasehq/stagehand'
import { HAY_LLM } from '../soporte/entorno'
import { abrirStagehand, guardarEvidencia, ir, type Pagina, texto, esperarVisible } from '../soporte/stagehand'

describe.skipIf(!HAY_LLM)('Stagehand — Validación de credenciales', () => {
  let stagehand: Stagehand
  let page: Pagina

  beforeEach(async () => {
    ;({ stagehand, page } = await abrirStagehand())
  })
  afterEach(async (ctx) => {
    await guardarEvidencia(stagehand, page, `credenciales-${ctx.task.name.slice(0, 40).replace(/\W+/g, '-')}`)
    await stagehand.close()
  })

  it('extract lee los requisitos de la contraseña y coincide con el DOM', async () => {
    await ir(page, '/register', '#password')
    await stagehand.act('type "medellin2026" into the "Contraseña" field (not the confirmation)')

    // extract: lo que la IA ve en pantalla
    const { requisitos } = await stagehand.extract(
      'extract each password requirement shown under the password field and whether it is marked as met',
      z.object({ requisitos: z.array(z.object({ texto: z.string(), cumplido: z.boolean() })) }),
    )
    const segunIA = (palabra: string) => requisitos.find((r) => texto(r.texto).includes(palabra))?.cumplido

    // Verdad del DOM (data-cumple), para contrastar la lectura de la IA
    const segunDOM = await page.evaluate(() =>
      Object.fromEntries([...document.querySelectorAll('[data-regla]')].map((e) => [e.getAttribute('data-regla'), e.getAttribute('data-cumple') === 'true'])),
    )

    expect(segunDOM).toEqual({ largo: true, mayuscula: false, minuscula: true, numero: true })
    expect(segunIA('mayuscula')).toBe(false)
    expect(segunIA('minuscula')).toBe(true)
    expect(segunIA('numero')).toBe(true)
  })

  it('una contraseña sin mayúscula no se envía (negativo)', async () => {
    await ir(page, '/register', '#password')
    await stagehand.act('type "Ana Pérez" into the "Nombre completo" field')
    await stagehand.act('type "stagehand.negativo@gmail.com" into the "Email" field')
    await stagehand.act('type "medellin2026" into the "Contraseña" field (not the confirmation)')
    await stagehand.act('type "medellin2026" into the "Confirmar contraseña" field')
    await stagehand.act('click the "Crear cuenta gratis" button')

    await esperarVisible(page, '.cp-field-error')
    const { mensaje } = await stagehand.extract('extract the validation error message under the password field', z.object({ mensaje: z.string() }))
    expect(texto(mensaje)).toContain('mayuscula')
    expect(new URL(page.url()).pathname).toBe('/register')
  })
})
