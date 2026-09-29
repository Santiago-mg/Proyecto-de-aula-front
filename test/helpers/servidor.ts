import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import api from '../../src/services/api'

// Doble de la red. Solo se reemplaza el adaptador de axios, que es la pieza que
// sale a internet; los interceptores de api.ts, los servicios, los contextos y
// las páginas se ejecutan de verdad. Cada prueba programa lo que "responde el
// backend" con servidor.responder() y después revisa qué le llegó con
// servidor.peticiones().

export type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface Respuesta {
  status: number
  body?: unknown
}

export interface Peticion {
  metodo: Metodo
  url: string
  params: Record<string, unknown>
  body: unknown
  authorization: string | undefined
}

type Manejador = Respuesta | ((peticion: Peticion) => Respuesta | Promise<Respuesta>)

// Lo que contesta el backend cuando la ruta no existe (ver ramas de 404 del back)
const RUTA_INEXISTENTE: Respuesta = { status: 404, body: { error: 'Ruta no encontrada' } }

// status 0 = no hubo respuesta (backend apagado, sin red)
const SIN_RESPUESTA = 0

const rutas = new Map<string, Manejador>()
const registro: Peticion[] = []

function leerPeticion(config: InternalAxiosRequestConfig): Peticion {
  const auth = config.headers.get('Authorization')
  return {
    metodo: (config.method ?? 'get').toUpperCase() as Metodo,
    url: config.url ?? '',
    params: config.params ?? {},
    body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    authorization: typeof auth === 'string' ? auth : undefined,
  }
}

async function adaptador(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const peticion = leerPeticion(config)
  registro.push(peticion)

  const manejador = rutas.get(`${peticion.metodo} ${peticion.url}`) ?? RUTA_INEXISTENTE
  const { status, body } = typeof manejador === 'function' ? await manejador(peticion) : manejador

  if (status === SIN_RESPUESTA) {
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)
  }

  const response: AxiosResponse = { data: body, status, statusText: String(status), headers: {}, config }
  if (status >= 200 && status < 300) return response
  throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
}

export const servidor = {
  instalar() {
    api.defaults.adapter = adaptador
  },

  reiniciar() {
    rutas.clear()
    registro.length = 0
  },

  responder(metodo: Metodo, url: string, respuesta: Manejador) {
    rutas.set(`${metodo} ${url}`, respuesta)
  },

  // Deja la petición colgada, como un backend que tarda en contestar
  colgar(metodo: Metodo, url: string) {
    rutas.set(`${metodo} ${url}`, () => new Promise<Respuesta>(() => {
      // nunca responde
    }))
  },

  peticiones(metodo?: Metodo, url?: string): Peticion[] {
    return registro.filter((p) => (!metodo || p.metodo === metodo) && (!url || p.url === url))
  },
}

// ─── Respuestas con la misma forma que las del backend ──────────────────────

export const ok = (data: unknown): Respuesta => ({ status: 200, body: { data } })
export const creado = (data: unknown): Respuesta => ({ status: 201, body: { data } })
export const sinContenido = (): Respuesta => ({ status: 204 })
export const listado = (body: unknown): Respuesta => ({ status: 200, body })
export const fallo = (status: number, error: string): Respuesta => ({ status, body: { error } })
export const sinConexion = (): Respuesta => ({ status: SIN_RESPUESTA })
