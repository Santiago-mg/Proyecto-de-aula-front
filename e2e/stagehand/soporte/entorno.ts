// Configuración compartida de las pruebas con Stagehand.
//
//   FRONT_URL        frontend  (por defecto http://localhost:5173)
//   API_URL          backend   (por defecto http://localhost:3001/api/v1)
//   ADMIN_EMAIL / ADMIN_PASSWORD   usuario del seed
//
// Modelo: por defecto Gemma 4 de Google a través de Ollama Cloud. Gemma es la familia de modelos
// abiertos de Google construida con la misma investigación que Gemini. (Gemini 3 Flash estuvo en
// Ollama Cloud como gemini-3-flash-preview:cloud, pero Ollama lo retiró.)
//   STAGEHAND_MODEL  ollama/gemma4:31b-cloud               (por defecto)
//   OLLAMA_URL       http://127.0.0.1:11434/api            (por defecto)
// Preparación: `ollama signin` y `ollama pull gemma4:31b-cloud`.
//
// También se puede usar Gemini directamente con una clave gratuita de Google AI Studio:
// STAGEHAND_MODEL="google/<modelo-gemini>" y GOOGLE_GENERATIVE_AI_API_KEY.
//   HEADLESS=false   para ver el navegador

export const FRONT_URL = (process.env.FRONT_URL ?? 'http://localhost:5173').replace(/\/$/, '')
export const API_URL = (process.env.API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '')
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@celularpro.co'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin1234'
export const CLAVE_PRUEBA = process.env.CLAVE_PRUEBA ?? 'Medellin2026'

// Con la clave de Google AI Studio definida, el modelo por defecto es Gemini por su API oficial
// (garantiza el JSON del esquema); si no, Gemma 4 por Ollama.
export const MODELO = process.env.STAGEHAND_MODEL
  ?? (process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'google/gemini-3.8-flash' : 'ollama/gemma4:31b-cloud')

/**
 * Modelos de respaldo, en orden. Los planes gratuitos tienen un cupo DIARIO por modelo: cuando
 * uno se agota (o no existe), la consulta sigue con el siguiente sin que la prueba falle.
 * STAGEHAND_MODELOS="google/a,google/b" reemplaza la lista.
 */
const RESPALDO_GEMINI = ['google/gemini-3.8-flash', 'google/gemini-3.6-flash', 'google/gemini-3.5-flash-lite', 'google/gemini-3.1-flash-lite']
export const MODELOS: string[] = [
  MODELO,
  ...(process.env.STAGEHAND_MODELOS
    ? process.env.STAGEHAND_MODELOS.split(',').map((m) => m.trim()).filter(Boolean)
    : MODELO.startsWith('google/') ? RESPALDO_GEMINI : []),
].filter((m, i, todos) => todos.indexOf(m) === i)
export const OLLAMA_URL = (process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434/api').replace(/\/$/, '')
export const USA_OLLAMA = MODELO.startsWith('ollama/')

const CLAVES_POR_PROVEEDOR: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
}

/**
 * ¿Se puede razonar con el modelo configurado? Con Ollama: el servidor responde
 * y el modelo aparece en /api/tags (los modelos :cloud aparecen después del pull).
 * Con otro proveedor: existe su clave. Devuelve el motivo cuando no se puede.
 */
async function comprobarModelo(): Promise<{ ok: boolean; motivo: string }> {
  if (USA_OLLAMA) {
    const nombre = MODELO.slice('ollama/'.length)
    try {
      const res = await fetch(`${OLLAMA_URL}/tags`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) return { ok: false, motivo: `Ollama respondió ${res.status} en ${OLLAMA_URL}/tags` }
      const { models = [] } = (await res.json()) as { models?: Array<{ name: string; model?: string }> }
      const existe = models.some((m) => m.name === nombre || m.model === nombre)
      return existe
        ? { ok: true, motivo: '' }
        : { ok: false, motivo: `Ollama no tiene "${nombre}". Ejecuta: ollama signin && ollama pull ${nombre}` }
    } catch {
      return { ok: false, motivo: `Ollama no responde en ${OLLAMA_URL}. Inícialo con: ollama serve` }
    }
  }
  const proveedor = MODELO.split('/')[0]
  const variable = CLAVES_POR_PROVEEDOR[proveedor]
  if (variable && !process.env[variable]) return { ok: false, motivo: `Falta ${variable} para el modelo ${MODELO}` }
  return { ok: true, motivo: '' }
}

const estado = await comprobarModelo()
if (!estado.ok) console.warn(`[stagehand] Pruebas omitidas: ${estado.motivo}`)

export const HAY_LLM = estado.ok
export const MOTIVO_OMISION = estado.motivo
