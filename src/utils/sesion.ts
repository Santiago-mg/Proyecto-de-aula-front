// Ayudas para que perder la sesión (o no tenerla) no signifique perder el
// camino: la persona vuelve a donde estaba después de ingresar.

const CLAVE_SESION_VENCIDA = 'cp_sesion_vencida'

/** Solo se acepta una ruta de esta misma página ("/checkout"), nunca una dirección externa. */
export function rutaSegura(ruta: unknown): string | null {
  if (typeof ruta !== 'string') return null
  if (!ruta.startsWith('/') || ruta.startsWith('//') || ruta.startsWith('/\\')) return null
  // Volver al login después de ingresar sería un círculo.
  if (/^\/(login|register)(\/|\?|#|$)/.test(ruta)) return null
  return ruta
}

/** Se llama justo antes de mandar a la persona al login porque su sesión venció. */
export function marcarSesionVencida(rutaActual: string): void {
  try {
    sessionStorage.setItem(CLAVE_SESION_VENCIDA, rutaActual)
  } catch {
    // sin almacenamiento solo se pierde el mensaje y el regreso automático
  }
}

/** La ruta donde estaba cuando venció la sesión, o null si no venció. */
export function leerSesionVencida(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_SESION_VENCIDA)
  } catch {
    return null
  }
}

export function limpiarSesionVencida(): void {
  try {
    sessionStorage.removeItem(CLAVE_SESION_VENCIDA)
  } catch {
    // nada que limpiar
  }
}

interface DesdeRuta {
  pathname?: string
  search?: string
  hash?: string
}

/** Convierte el `from` que deja una ruta protegida en un texto "/ruta?x=1#y". */
export function rutaDesde(from: unknown): string | null {
  if (!from || typeof from !== 'object') return null
  const { pathname, search = '', hash = '' } = from as DesdeRuta
  return rutaSegura(typeof pathname === 'string' ? `${pathname}${search}${hash}` : null)
}
