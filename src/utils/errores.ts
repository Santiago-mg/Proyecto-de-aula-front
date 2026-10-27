import axios from 'axios'

// Una promesa puede rechazar con cualquier valor; la interfaz siempre trabaja
// con Error para poder mostrarlo con <ErrorMessage />.
export function comoError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
}

interface CuerpoError {
  error?: string
  code?: string
  errors?: Array<{ field?: string; message?: string }>
}

function cuerpo(error: unknown): CuerpoError | undefined {
  return axios.isAxiosError(error) ? (error.response?.data as CuerpoError | undefined) : undefined
}

/**
 * Código opcional de los errores de sesión (TOKEN_EXPIRED…). El backend actual
 * solo envía { error }, así que normalmente es undefined y se usa el aviso genérico.
 */
export function codigoDeError(error: unknown): string | undefined {
  return cuerpo(error)?.code
}

/**
 * Texto que se le muestra a la persona. Si el backend devolvió el detalle por
 * campo (errores de validación), se usa el primero en lugar del genérico
 * "Datos inválidos", que no dice qué corregir.
 */
export function mensajeDeError(error: Error | null): string {
  if (!error) return ''
  if (axios.isAxiosError(error)) {
    const c = cuerpo(error)
    const texto = c?.errors?.[0]?.message ?? c?.error
    return texto ? enLenguajeCotidiano(texto) : MENSAJE_SIN_CONEXION
  }
  return error.message
}

// Heurística 2 (lenguaje del usuario) y 9 (mensajes que dicen qué hacer): el
// backend devuelve algunos textos técnicos ("Token inválido o expirado") que
// una persona no técnica no entiende. Se traducen aquí; el resto de mensajes
// del backend ya están en español claro y se muestran tal cual.
export const MENSAJE_SIN_CONEXION = 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'

const TRADUCCIONES: Record<string, string> = {
  'Token inválido o expirado': 'Tu sesión ya no es válida. Inicia sesión de nuevo.',
  'Token requerido': 'Necesitas iniciar sesión para hacer esto.',
  'Datos inválidos': 'Algunos datos no son válidos. Revisa el formulario e inténtalo de nuevo.',
  'Ruta no encontrada': 'No encontramos lo que buscabas. Recarga la página o vuelve al inicio.',
  'Error interno del servidor': 'Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.',
}

export function enLenguajeCotidiano(texto: string): string {
  return TRADUCCIONES[texto] ?? texto
}

/** true si el error es de red (no hubo respuesta): conviene ofrecer "Reintentar". */
export function esErrorDeRed(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response
}

// Mensajes de sesión que sobreviven a la redirección a /login (la página se
// recarga y el estado de React se pierde, por eso viajan en sessionStorage).
export const CLAVE_AVISO = 'cp_aviso'

const AVISOS_SESION: Record<string, string> = {
  TOKEN_EXPIRED: 'Tu sesión ha vencido. Inicia sesión de nuevo.',
}
const AVISO_GENERICO = 'Tu sesión ya no es válida. Inicia sesión de nuevo.'

export function avisoDeSesion(code: string | undefined): string {
  return (code && AVISOS_SESION[code]) || AVISO_GENERICO
}

/**
 * El backend responde 403 "Tu cuenta ha sido suspendida. Motivo: …" cuando un
 * administrador suspende la cuenta mientras la sesión está abierta. Es distinto
 * del 403 "Acceso restringido a administradores", que no debe cerrar la sesión.
 */
export function mensajeDeSuspension(error: unknown): string | undefined {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) return undefined
  const texto = cuerpo(error)?.error
  return texto?.startsWith('Tu cuenta ha sido suspendida') ? texto : undefined
}
