// Borrador de los datos de entrega del checkout.
//
// Mientras la persona escribe se guarda en este navegador (clave
// cp_checkout_draft) para que no pierda lo escrito si se cae la conexión, se
// cierra la pestaña o va a revisar el carrito. Se borra al confirmar el pedido
// y al cerrar sesión (ver /privacidad).

import type { CheckoutFormData } from '../types/order'

const CLAVE = 'cp_checkout_draft'
const CAMPOS: (keyof CheckoutFormData)[] = ['email', 'name', 'phone', 'address', 'city', 'dept']

export type Borrador = Partial<CheckoutFormData>

export function leerBorrador(): Borrador {
  try {
    const crudo = localStorage.getItem(CLAVE)
    const datos: unknown = crudo ? JSON.parse(crudo) : {}
    if (!datos || typeof datos !== 'object') return {}
    const origen = datos as Record<string, unknown>
    const limpio: Borrador = {}
    for (const campo of CAMPOS) {
      if (typeof origen[campo] === 'string') limpio[campo] = origen[campo] as string
    }
    return limpio
  } catch {
    return {}
  }
}

export function guardarBorrador(valores: Borrador): void {
  try {
    const limpio: Borrador = {}
    for (const campo of CAMPOS) {
      if (typeof valores[campo] === 'string') limpio[campo] = valores[campo]
    }
    localStorage.setItem(CLAVE, JSON.stringify(limpio))
  } catch {
    // sin almacenamiento simplemente no hay borrador
  }
}

export function borrarBorrador(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
}

/** ¿Hay algo escrito en los datos de entrega (sin contar el nombre y el correo, que vienen de la cuenta)? */
export function tieneDatosDeEntrega(borrador: Borrador): boolean {
  return Boolean(borrador.phone || borrador.address || borrador.city || borrador.dept)
}
