import type { OrderStatus } from '../types/order'

// Los estados de un pedido se mostraban con tres tablas distintas (cliente,
// panel de pedidos y panel de resumen), cada una con sus propios colores.
// Ahora hay una sola y los colores salen de las variables del tema.

export interface InfoEstado {
  etiqueta: string
  /** Color del texto y del borde (variable CSS del tema) */
  color: string
  /** Posición en el recorrido normal: 1 a 4. Cancelado no tiene recorrido. */
  paso: number
  /** Qué significa, en una frase, para quien compró */
  ayuda: string
}

export const ESTADOS_PEDIDO: Record<OrderStatus, InfoEstado> = {
  PENDING: {
    etiqueta: 'Pendiente',
    color: 'var(--warn)',
    paso: 1,
    ayuda: 'Recibimos tu pedido y está en revisión.',
  },
  CONFIRMED: {
    etiqueta: 'Confirmado',
    color: 'var(--accent)',
    paso: 2,
    ayuda: 'Tu pedido fue confirmado.',
  },
  SHIPPED: {
    etiqueta: 'En camino',
    color: 'var(--violet)',
    paso: 3,
    ayuda: 'Tu pedido salió hacia la dirección de entrega.',
  },
  DELIVERED: {
    etiqueta: 'Entregado',
    color: 'var(--ok)',
    paso: 4,
    ayuda: 'Tu pedido llegó a la dirección de entrega.',
  },
  CANCELLED: {
    etiqueta: 'Cancelado',
    color: 'var(--bad)',
    paso: 0,
    ayuda: 'Este pedido fue cancelado.',
  },
}

export const ORDEN_ESTADOS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

/** Total de pasos del recorrido normal (sin contar cancelado). */
export const PASOS_PEDIDO = 4

const DESCONOCIDO: InfoEstado = { etiqueta: '', color: 'var(--ink-soft)', paso: 0, ayuda: '' }

/** Tolera estados que el front aún no conoce: muestra el texto tal cual llegó. */
export function infoEstado(estado: string): InfoEstado {
  return ESTADOS_PEDIDO[estado as OrderStatus] ?? { ...DESCONOCIDO, etiqueta: estado }
}
