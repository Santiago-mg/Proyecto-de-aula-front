import type { CartItem } from '../types/order'

/**
 * Regla de envío del resumen de compra. Debe coincidir siempre con la del
 * backend (OrderRepository: `subtotal > 500000 ? 0 : 20000`), porque el
 * cliente ve este resumen antes de pagar y el servidor recalcula el total al
 * crear la orden.
 *
 * Antes la cuenta vivía escrita a mano dentro de Checkout.tsx. Al sacarla a
 * una función, un cambio del umbral o del costo rompe la prueba de regresión
 * (test/regresion/mario/regresion.test.ts) en vez de notarse en producción.
 */
export const UMBRAL_ENVIO_GRATIS = 500_000
export const COSTO_ENVIO = 20_000

export interface Totales {
  subtotal: number
  shipping: number
  total: number
}

export function calcularTotales(items: Pick<CartItem, 'price' | 'qty'>[]): Totales {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal > UMBRAL_ENVIO_GRATIS ? 0 : COSTO_ENVIO
  return { subtotal, shipping, total: subtotal + shipping }
}
