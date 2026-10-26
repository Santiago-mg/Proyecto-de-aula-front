import { test } from '@playwright/test'
import { argosScreenshot } from '@argos-ci/playwright'
// @ts-expect-error módulo JS sin tipos: son datos de prueba
import { admin, instalarMocks, itemCarrito, usuario } from '../support/api-simulada.mjs'

// Una captura por pantalla y por tema. Argos las compara con las de la rama
// principal y avisa si algo cambió (un color, un desborde, un botón movido).

type Sesion = 'ninguna' | 'usuario' | 'admin'
interface Pantalla {
  nombre: string
  ruta: string
  sesion?: Sesion
  celular?: boolean
}

const TEMAS = ['oscuro', 'claro', 'contraste'] as const

const PANTALLAS: Pantalla[] = [
  { nombre: 'inicio', ruta: '/' },
  { nombre: 'catalogo', ruta: '/catalog', celular: true },
  { nombre: 'catalogo-con-filtros', ruta: '/catalog?condition=CERTIFIED&maxPrice=3000000' },
  { nombre: 'detalle', ruta: '/phones/galaxy-s24', celular: true },
  { nombre: 'login', ruta: '/login', celular: true },
  { nombre: 'checkout', ruta: '/checkout', sesion: 'usuario', celular: true },
  { nombre: 'ayuda', ruta: '/ayuda' },
  { nombre: 'admin-usuarios', ruta: '/admin/users', sesion: 'admin', celular: true },
  { nombre: 'admin-estadisticas', ruta: '/admin/stats', sesion: 'admin' },
]

for (const tema of TEMAS) {
  test.describe(`tema ${tema}`, () => {
    for (const p of PANTALLAS) {
      const etiqueta = p.celular && tema === 'oscuro' ? ' @celular' : ''
      test(`${p.nombre}${etiqueta}`, async ({ page }) => {
        await instalarMocks(page, {})
        await page.addInitScript(
          ({ sesion, tema, usuario, admin, item }) => {
            if (sesion !== 'ninguna') {
              localStorage.setItem('cp_user', JSON.stringify(sesion === 'admin' ? admin : usuario))
              localStorage.setItem('cp_token', 'token-de-prueba')
            }
            localStorage.setItem('cp_cart', JSON.stringify([item]))
            localStorage.setItem('cp_onboarding_done', '1')
            localStorage.setItem('cp_prefs', JSON.stringify({ tema, tamano: 100, movimiento: 'reducido' }))
          },
          { sesion: p.sesion ?? 'ninguna', tema, usuario, admin, item: itemCarrito() },
        )
        await page.goto(p.ruta, { waitUntil: 'networkidle' })
        await argosScreenshot(page, `${tema}-${p.nombre}`)
      })
    }
  })
}
