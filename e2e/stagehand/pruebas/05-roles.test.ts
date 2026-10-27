import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Stagehand } from '@browserbasehq/stagehand'
import { HAY_LLM } from '../soporte/entorno'
import { abrirStagehand, crearCliente, esperarRuta, guardarEvidencia, ir, iniciarSesionEnNavegador, sesionAdmin, type Pagina, texto } from '../soporte/stagehand'

describe.skipIf(!HAY_LLM)('Stagehand — Control de roles', () => {
  let stagehand: Stagehand
  let page: Pagina

  beforeEach(async () => {
    ;({ stagehand, page } = await abrirStagehand())
  })
  afterEach(async (ctx) => {
    await guardarEvidencia(stagehand, page, `roles-${ctx.task.name.slice(0, 40).replace(/\W+/g, '-')}`)
    await stagehand.close()
  })

  it('un cliente que abre /admin termina en Acceso no autorizado (negativo)', async () => {
    await iniciarSesionEnNavegador(page, await crearCliente())
    await ir(page, '/admin')

    expect(await esperarRuta(page, '/unauthorized')).toBe('/unauthorized')
    const pantalla = await stagehand.extract(
      'extract the main heading and whether the navigation bar shows a link to the admin panel',
      z.object({ titulo: z.string(), hayEnlaceAdmin: z.boolean() }),
    )
    expect(texto(pantalla.titulo)).toBe('acceso no autorizado')
    expect(pantalla.hayEnlaceAdmin).toBe(false)
  })

  it('el administrador ve el panel y su menú lateral (positivo)', async () => {
    await iniciarSesionEnNavegador(page, await sesionAdmin())
    await ir(page, '/admin', 'aside nav a')

    const secciones = await stagehand.observe('find the links of the admin sidebar menu')
    expect(secciones.length, 'el menú lateral tiene varias secciones').toBeGreaterThanOrEqual(4)
    const { titulo } = await stagehand.extract('extract the main heading of the page', z.object({ titulo: z.string() }))
    expect(texto(titulo)).toBe('panel')
  })
})
