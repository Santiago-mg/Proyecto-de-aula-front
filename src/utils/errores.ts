import axios from 'axios'

// Una promesa puede rechazar con cualquier valor; la interfaz siempre trabaja
// con Error para poder mostrarlo con <ErrorMessage />.
export function comoError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
}

export interface DescripcionError {
  /** Qué pasó, en una frase que cualquiera entienda. */
  mensaje: string
  /** Qué puede hacer la persona ahora. */
  pista?: string
  /** Referencia corta para decirle a soporte cuando la persona no puede arreglarlo sola. */
  codigo?: string
  /** Volver a intentar tiene sentido (red caída, servidor ocupado). */
  reintentable: boolean
}

const MENSAJE_SIN_DETALLE = 'Error de conexión con el servidor'

/**
 * Traduce un error técnico a lo que la persona necesita saber: qué pasó, qué
 * hacer y una referencia por si tiene que escribir a soporte. Antes todos los
 * fallos terminaban en el mismo texto, sin una salida (heurística 9).
 *
 * El mensaje que manda el servidor ("El email ya está registrado") siempre
 * manda sobre el genérico, porque ese ya está redactado para la persona.
 */
export function describirError(error: Error | null): DescripcionError | null {
  if (!error) return null

  if (!axios.isAxiosError(error)) {
    return { mensaje: error.message, reintentable: false }
  }

  const estado = error.response?.status
  const delServidor = (error.response?.data as { error?: string } | undefined)?.error
  const mensaje = delServidor ?? MENSAJE_SIN_DETALLE

  // Sin respuesta: se cayó el internet, el servidor no contesta o se agotó el tiempo.
  if (estado === undefined) {
    return {
      mensaje,
      pista: 'Revisa tu conexión a internet y vuelve a intentarlo.',
      codigo: 'SIN-RED',
      reintentable: true,
    }
  }

  const codigo = `HTTP ${estado}`
  if (estado >= 500) {
    return {
      mensaje,
      pista: 'El problema es de nuestro lado, no tuyo. Inténtalo de nuevo en unos minutos.',
      codigo,
      reintentable: true,
    }
  }
  if (estado === 401) {
    return { mensaje, pista: 'Tu sesión pudo haber vencido. Ingresa de nuevo para continuar.', reintentable: false }
  }
  if (estado === 403) {
    return { mensaje, pista: 'Tu cuenta no tiene permiso para hacer esto.', reintentable: false }
  }
  if (estado === 429) {
    return { mensaje, pista: 'Hiciste muchos intentos seguidos. Espera un momento y prueba otra vez.', reintentable: true }
  }
  // 400, 404, 409, 422…: el mensaje del servidor ya dice qué corregir.
  return { mensaje, reintentable: false }
}
