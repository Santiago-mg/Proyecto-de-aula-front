import { mkdir, writeFile } from 'node:fs/promises'
import { vi } from 'vitest'
import { Stagehand } from '@browserbasehq/stagehand'
import { API_URL, ADMIN_EMAIL, ADMIN_PASSWORD, CLAVE_PRUEBA, FRONT_URL, MODELO, MODELOS, OLLAMA_URL, USA_OLLAMA } from './entorno'

export type Pagina = ReturnType<Stagehand['context']['pages']>[number]

// ── Ritmo y reintentos frente a los límites del modelo ──────────────────────
// Los planes gratuitos limitan las peticiones POR MINUTO (Gemini Flash gratuito: 5/min).
// Stagehand hace varias consultas seguidas, así que se espacian (STAGEHAND_PAUSA_MS, por
// defecto 13 s ≈ 4,6 por minuto) y, ante un 429 o un 503, se espera lo que indique el
// servidor ("retry in 36s") antes de reintentar. El límite POR DÍA no se reintenta: falla
// con su mensaje, porque esperar horas no tiene sentido dentro de una prueba.
const PAUSA_MS = Number(process.env.STAGEHAND_PAUSA_MS ?? 13_000)

// Con la pausa entre consultas y las esperas de los reintentos, una prueba puede tardar varios
// minutos. Se fija aquí (y no solo en vitest.config.ts) para que valga siempre.
vi.setConfig({ testTimeout: 600_000, hookTimeout: 180_000 })
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))
let ultimaConsulta = 0

async function turno() {
  const espera = ultimaConsulta + PAUSA_MS - Date.now()
  if (espera > 0) await dormir(espera)
  ultimaConsulta = Date.now()
}

// Modelo en uso: empieza en el principal y avanza cuando uno agota su cupo diario.
let indiceModelo = 0
export const modeloActual = () => MODELOS[indiceModelo]
const configModelo = (nombre: string) =>
  nombre.startsWith('google/') ? { modelName: nombre, apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY } : nombre

/**
 * Ejecuta una consulta al modelo respetando el ritmo y reintentando:
 *  - límite por minuto / saturación (429, 503): espera lo que pide el servidor y reintenta;
 *  - cupo DIARIO agotado o modelo inexistente: pasa al siguiente modelo de MODELOS y reintenta.
 * `consulta` recibe la configuración del modelo a usar (undefined = el principal de Stagehand).
 */
export async function conRitmo<T>(consulta: (modelo?: unknown) => Promise<T>): Promise<T> {
  for (let intento = 1; ; ) {
    await turno()
    const modelo = indiceModelo === 0 ? undefined : configModelo(MODELOS[indiceModelo])
    try {
      return await consulta(modelo)
    } catch (error) {
      const mensaje = String((error as Error)?.message ?? error)
      const cupoDiario = /per day/i.test(mensaje)
      const noExiste = /not found|is not supported|NOT_FOUND|404/i.test(mensaje) && !/element/i.test(mensaje)
      if ((cupoDiario || noExiste) && indiceModelo < MODELOS.length - 1) {
        const anterior = MODELOS[indiceModelo]
        indiceModelo++
        console.warn(`[stagehand] ${anterior} ${cupoDiario ? 'agotó su cupo diario' : 'no está disponible'}; se continúa con ${MODELOS[indiceModelo]}`)
        continue
      }
      const esLimite = /quota|RESOURCE_EXHAUSTED|429|high demand|503|UNAVAILABLE/i.test(mensaje)
      if (!esLimite || cupoDiario || intento >= 4) throw error
      intento++
      const pedido = mensaje.match(/retry in ([\d.]+)s/i)
      const espera = pedido ? Math.ceil(Number(pedido[1])) * 1000 + 2000 : 30_000
      console.warn(`[stagehand] Límite del modelo: reintento ${intento - 1}/3 en ${Math.round(espera / 1000)} s`)
      await dormir(espera)
    }
  }
}

/** Navegador local (Chrome/Chromium) controlado por Stagehand v3. */
export async function abrirStagehand(): Promise<{ stagehand: Stagehand; page: Pagina }> {
  const stagehand = new Stagehand({
    env: 'LOCAL',
    // Gemini vía Ollama: el proveedor de Ollama de Stagehand no necesita clave;
    // se le indica dónde está el servidor.
    model: USA_OLLAMA ? { modelName: MODELO, baseURL: OLLAMA_URL } : MODELO,
    localBrowserLaunchOptions: {
      headless: process.env.HEADLESS !== 'false',
      // CHROMIUM_PATH (opcional): usar un navegador ya instalado, por ejemplo Microsoft Edge,
      // cuando no está Google Chrome. Es la misma variable que usan Serenity y Autify Nexus.
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
      // CHROMIUM_ARGS (opcional): argumentos extra del navegador, por ejemplo "--no-sandbox" en contenedores
      ...(process.env.CHROMIUM_ARGS ? { args: process.env.CHROMIUM_ARGS.split(' ').filter(Boolean) } : {}),
    },
    verbose: 0,
    disablePino: true,
    // Las acciones que funcionaron se guardan y se reutilizan (menos llamadas al modelo)
    cacheDir: '.cache/stagehand',
  })
  await stagehand.init()

  // Cada consulta al modelo pasa por conRitmo. act con una acción ya observada (objeto)
  // no consulta al modelo, así que no espera.
  const act = stagehand.act.bind(stagehand)
  const observe = stagehand.observe.bind(stagehand)
  const extract = stagehand.extract.bind(stagehand)
  // Agrega { model } a las opciones de la llamada cuando hay que usar un modelo de respaldo
  const con = (opciones: unknown, modelo: unknown) =>
    modelo ? { ...((opciones as object) ?? {}), model: modelo } : opciones
  /* eslint-disable @typescript-eslint/no-explicit-any */
  stagehand.act = ((instruccion: any, opciones?: any) =>
    typeof instruccion === 'string'
      ? conRitmo((m) => act(instruccion, con(opciones, m) as any))
      : act(instruccion, opciones)) as typeof act
  stagehand.observe = ((instruccion?: any, opciones?: any) =>
    conRitmo((m) => (observe as any)(instruccion, con(opciones, m)))) as typeof observe
  stagehand.extract = ((instruccion: any, esquema?: any, opciones?: any) =>
    conRitmo((m) => (extract as any)(instruccion, esquema, con(opciones, m)))) as typeof extract
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const page = stagehand.context.pages()[0]
  return { stagehand, page }
}

/**
 * Evidencia de cada prueba: captura, métricas de tokens e historial de
 * act/observe/extract. Queda en reports/<nombre>/.
 */
export async function guardarEvidencia(stagehand: Stagehand, page: Pagina, nombre: string) {
  const carpeta = `reports/${nombre}`
  await mkdir(carpeta, { recursive: true })
  await writeFile(`${carpeta}/pantalla.png`, await page.screenshot({ fullPage: true }))
  await writeFile(`${carpeta}/metricas.json`, JSON.stringify(await stagehand.metrics, null, 2))
  await writeFile(`${carpeta}/historial.json`, JSON.stringify(await stagehand.history, null, 2))
}

/** La Page de Stagehand no tiene waitForURL: se consulta la ruta hasta que coincida. */
export async function esperarRuta(page: Pagina, ruta: string, timeoutMs = 15_000): Promise<string> {
  const limite = Date.now() + timeoutMs
  while (Date.now() < limite) {
    if (new URL(page.url()).pathname === ruta) return ruta
    await new Promise((r) => setTimeout(r, 250))
  }
  return new URL(page.url()).pathname
}

/**
 * Normaliza lo que lee la IA para comparar: minúsculas, sin tildes y sin espacios repetidos.
 * En pantalla varios textos se ven en MAYÚSCULAS por CSS (text-transform) y la IA los lee así
 * ("PANEL", "PERFIL ACTUALIZADO"); lo que se verifica es el contenido, no la tipografía.
 */
export const texto = (s: string | null | undefined) =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * De las acciones que devolvió observe, la que apunta al campo con ese id.
 * Ubica cada selector (xpath) en la página y compara el id real del elemento: así se comprueba
 * de forma determinista que observe encontró el campo correcto, y luego act(acción) lo usa
 * sin volver a consultar al modelo.
 */
export async function accionDelCampo<A extends { selector: string }>(page: Pagina, acciones: A[], id: string) {
  for (const accion of acciones) {
    const xpath = accion.selector.replace(/^xpath=/, '')
    const coincide = await page.evaluate(
      ({ xpath, id }: { xpath: string; id: string }) => {
        const nodo = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        return (nodo as Element | null)?.id === id
      },
      { xpath, id },
    )
    if (coincide) return accion
  }
  return undefined
}

/** Espera a que aparezca un mensaje antes de pedirle a la IA que lo lea. */
export const esperarVisible = (page: Pagina, selector: string) =>
  page.waitForSelector(selector, { state: 'visible', timeout: 15_000 })

/**
 * Abre una ruta y ESPERA a que React dibuje la pantalla antes de seguir.
 * Sin esta espera, observe/extract recibían un árbol vacío (solo "RootWebArea … html"):
 * se gastaba una consulta al modelo en una página en blanco y la prueba fallaba.
 * `listo` es el selector que indica que la pantalla terminó de cargar (por defecto, su título h1).
 */
export async function ir(page: Pagina, ruta: string, listo = 'h1') {
  await page.goto(`${FRONT_URL}${ruta}`)
  await page.waitForSelector(listo, { state: 'visible', timeout: 15_000 })
}

// ── Preparación determinista por API (no se gasta el modelo en lo que no se prueba) ──

interface Sesion {
  token: string
  user: { id: string; name: string; email: string; role: string }
}

async function pedir(ruta: string, init: RequestInit = {}) {
  const res = await fetch(`${API_URL}${ruta}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const cuerpo = res.status === 204 ? null : await res.json()
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${ruta} → ${res.status}: ${JSON.stringify(cuerpo)}`)
  return cuerpo
}

export const correoNuevo = (prefijo = 'stagehand') => `${prefijo}+${Date.now()}@gmail.com`

export async function crearCliente(nombre = 'Ana Pérez'): Promise<Sesion> {
  const r = await pedir('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: nombre, email: correoNuevo(), password: CLAVE_PRUEBA }),
  })
  return r.data
}

export async function sesionAdmin(): Promise<Sesion> {
  const r = await pedir('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  return r.data
}

export async function alertasPorApi(token: string) {
  const r = await pedir('/admin/alerts', { headers: { Authorization: `Bearer ${token}` } })
  return r.data as Array<{ type: string; phone: { name: string; stock: number } }>
}

/** Deja la sesión guardada en el navegador, igual que la guarda el frontend. */
export async function iniciarSesionEnNavegador(page: Pagina, sesion: Sesion) {
  await ir(page, '/login')
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('cp_token', token)
      localStorage.setItem('cp_user', JSON.stringify(user))
    },
    { token: sesion.token, user: sesion.user },
  )
}
