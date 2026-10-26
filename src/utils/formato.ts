// Formato de dinero y fechas. Antes cada pantalla traía su propia copia de
// formatCOP (había siete) y el mismo precio podía verse distinto según la
// página; ahora hay una sola fuente.

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/** $1.200.000 COP — el formato de la tienda y del carrito. */
export function formatCOP(n: number): string {
  return '$' + numero.format(n) + ' COP'
}

/** $1.200.000 — para tablas del panel, donde el encabezado ya dice que es COP. */
export function formatPrecio(n: number): string {
  return '$' + numero.format(n)
}

/** $12.5M COP / $450K COP — para tarjetas de métricas donde importa el orden de magnitud. */
export function formatCOPCorto(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace('.0', '') + 'M COP'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K COP'
  return '$' + n + ' COP'
}

/** "2026-10-01" → "1 oct". Si el servidor ya manda "Lun" o algo parecido, lo deja igual. */
export function formatDiaCorto(dia: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia)
  if (!m) return dia
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime())) return dia
  const mes = d.toLocaleDateString('es-CO', { month: 'short' }).replace(/\./g, '')
  return `${d.getDate()} ${mes}`
}

/** 12 de octubre de 2026 */
export function formatFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}
