import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Stagehand } from '@browserbasehq/stagehand'
import { HAY_LLM } from '../soporte/entorno'
import { abrirStagehand, alertasPorApi, crearCliente, esperarRuta, guardarEvidencia, ir, iniciarSesionEnNavegador, sesionAdmin, type Pagina, texto } from '../soporte/stagehand'

describe.skipIf(!HAY_LLM)('Stagehand — Alertas de stock bajo', () => {
  let stagehand: Stagehand
  let page: Pagina

  beforeEach(async () => {
    ;({ stagehand, page } = await abrirStagehand())
  })
  afterEach(async (ctx) => {
    await guardarEvidencia(stagehand, page, `alertas-${ctx.task.name.slice(0, 40).replace(/\W+/g, '-')}`)
    await stagehand.close()
  })

  it('lo que extract lee en pantalla coincide con lo que devuelve la API (positivo)', async () => {
    const admin = await sesionAdmin()
    const segunApi = await alertasPorApi(admin.token)
    await iniciarSesionEnNavegador(page, admin)
    await ir(page, '/admin/alerts', '#alertas-lista, #alertas-vacio')

    const { alertas } = await stagehand.extract(
      'extract every low-stock alert listed on the page with the phone name and its current stock; return an empty list if the page says there are no open alerts',
      z.object({ alertas: z.array(z.object({ celular: z.string(), stock: z.number() })) }),
    )

    // Contraste IA vs API: cada alerta que lee la IA existe en la API con el mismo stock.
    // (Con muchas alertas, exigir que la IA las liste TODAS haría la prueba frágil; el conteo
    //  exacto se verifica contra el DOM, que es determinista.)
    const stockSegunApi = new Map(segunApi.map((a) => [texto(a.phone.name), a.phone.stock]))
    if (segunApi.length > 0) expect(alertas.length, 'la IA debe leer las alertas de la pantalla').toBeGreaterThan(0)
    for (const a of alertas) {
      expect(stockSegunApi.has(texto(a.celular)), `"${a.celular}" no está entre las alertas de la API`).toBe(true)
      expect(a.stock, `stock de "${a.celular}"`).toBe(stockSegunApi.get(texto(a.celular)))
    }
    const enPantalla = await page.evaluate(() => document.querySelectorAll('[data-testid="alerta"]').length)
    expect(enPantalla).toBe(segunApi.length)
  })

  it('un cliente no puede ver las alertas (negativo)', async () => {
    await iniciarSesionEnNavegador(page, await crearCliente())
    await ir(page, '/admin/alerts')
    expect(await esperarRuta(page, '/unauthorized')).toBe('/unauthorized')
  })
})
