import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Stagehand } from '@browserbasehq/stagehand'
import { HAY_LLM } from '../soporte/entorno'
import { abrirStagehand, crearCliente, esperarRuta, guardarEvidencia, ir, iniciarSesionEnNavegador, type Pagina, texto, esperarVisible } from '../soporte/stagehand'

describe.skipIf(!HAY_LLM)('Stagehand — Gestión de perfil', () => {
  let stagehand: Stagehand
  let page: Pagina

  beforeEach(async () => {
    ;({ stagehand, page } = await abrirStagehand())
  })
  afterEach(async (ctx) => {
    await guardarEvidencia(stagehand, page, `perfil-${ctx.task.name.slice(0, 40).replace(/\W+/g, '-')}`)
    await stagehand.close()
  })

  it('cambiar el nombre actualiza el saludo de Mi cuenta (positivo)', async () => {
    // Preparación por API: la cuenta no es lo que se prueba aquí
    await iniciarSesionEnNavegador(page, await crearCliente('Ana Pérez'))
    await ir(page, '/dashboard')

    await stagehand.act('click the "Editar perfil" link')
    expect(await esperarRuta(page, '/profile')).toBe('/profile')
    await stagehand.act('replace the text of the "Nombre completo" field with "María Gómez"')
    await stagehand.act('click the "Guardar cambios" button')

    // El aviso desaparece solo a los pocos segundos: se lee del DOM en cuanto aparece
    // (la pausa entre consultas al modelo haría que la IA llegara cuando ya no está).
    await esperarVisible(page, '[data-testid="toast"]')
    const aviso = await page.evaluate(() => document.querySelector('[data-testid="toast"]')?.textContent ?? '')
    expect(texto(aviso)).toContain('perfil actualizado')

    await ir(page, '/dashboard')
    const { saludo } = await stagehand.extract('extract the greeting heading', z.object({ saludo: z.string() }))
    expect(texto(saludo)).toContain('hola, maria')
  })

  it('con la contraseña actual incorrecta no se cambia (negativo)', async () => {
    await iniciarSesionEnNavegador(page, await crearCliente())
    await ir(page, '/profile', '#currentPassword')
    await stagehand.act('type "NoEsLaClave1" into the "Contraseña actual" field')
    await stagehand.act('type "ClaveNueva2027" into the "Contraseña nueva" field')
    await stagehand.act('type "ClaveNueva2027" into the "Confirmar contraseña nueva" field')
    await stagehand.act('click the "Cambiar contraseña" button')

    await esperarVisible(page, '.cp-error-message')
    const { mensaje } = await stagehand.extract('extract the error message of the password form', z.object({ mensaje: z.string() }))
    expect(texto(mensaje)).toContain('la contrasena actual no es correcta')
  })
})
