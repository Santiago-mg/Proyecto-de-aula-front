import type { ClientLLM, ModelConfig } from '@browserbasehq/stagehand';
import { createOllamaClient } from './ollama-client.js';

// Si hay un archivo .env junto al package.json, se lee. Node lo trae de fábrica.
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables que ya estén en el entorno.
}

/** Los tres proveedores del ejemplo del profesor (Stagehand-E2E-AI). */
export type Proveedor = 'openai' | 'gemini' | 'ollama';

function proveedorElegido(): Proveedor {
  const valor = (process.env.AI_PROVIDER ?? 'openai').trim().toLowerCase();
  if (valor === 'openai' || valor === 'gemini' || valor === 'ollama') return valor;
  throw new Error('AI_PROVIDER debe ser openai, gemini u ollama.');
}

function exigir(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor || valor.includes('your-key-here')) {
    throw new Error(`Falta ${nombre}. Copia .env.example como .env y configura el valor antes de correr las pruebas.`);
  }
  return valor;
}

/** El modelo que Stagehand va a usar y el nombre con el que se anota en los resultados. */
function modeloDe(proveedor: Proveedor): { modelo: ModelConfig | ClientLLM; nombre: string } {
  if (proveedor === 'openai') {
    const nombre = process.env.OPENAI_MODEL ?? 'openai/gpt-4.1-mini';
    return { modelo: { modelName: nombre as `openai/${string}`, apiKey: exigir('OPENAI_API_KEY') }, nombre };
  }
  if (proveedor === 'gemini') {
    const nombre = process.env.GEMINI_MODEL ?? 'google/gemini-2.5-flash';
    return { modelo: { modelName: nombre as `google/${string}`, apiKey: exigir('GOOGLE_GENERATIVE_AI_API_KEY') }, nombre };
  }
  return { modelo: createOllamaClient(), nombre: `ollama/${process.env.OLLAMA_MODEL ?? 'qwen2.5:7b'}` };
}

const proveedor = proveedorElegido();
const { modelo, nombre: nombreModelo } = modeloDe(proveedor);

/**
 * Dónde corre CelularPro y con qué modelo se prueba.
 *
 * Las direcciones por defecto son las del docker-compose del front
 * (`docker compose -p celularpro up -d`): front en el 8081, API en el 3001.
 */
export const entorno = {
  front: process.env.E2E_FRONT_URL ?? 'http://localhost:8081',
  api: process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1',
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@celularpro.co',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'admin1234',
  },
  proveedor,
  modelo,
  nombreModelo,
  sinVentana: process.env.HEADLESS !== 'false',
  chrome: process.env.CHROME_PATH || undefined,
  // Un modelo local tarda bastante más por llamada: se le da más margen (se puede fijar con LLAMADA_TIMEOUT_MS).
  timeoutLlamada: Number(process.env.LLAMADA_TIMEOUT_MS) || (proveedor === 'ollama' ? 240_000 : 120_000),
  margen: proveedor === 'ollama' ? 6 : 3,
  // La clave gratuita de Gemini permite ~5 llamadas por minuto: se deja pasar un rato entre una y otra.
  pausaEntreLlamadas: process.env.LLAMADA_PAUSA_MS !== undefined ? Number(process.env.LLAMADA_PAUSA_MS) : 0,
  nivelLog: process.env.STAGEHAND_LOG_LEVEL === 'debug' ? ('debug' as const) : ('info' as const),
};
