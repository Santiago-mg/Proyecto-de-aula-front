import { AlertTriangle, PackageX } from 'lucide-react'
import type { AlertType } from '../../types/admin'

const TEXTO: Record<AlertType, string> = {
  OUT_OF_STOCK: 'Sin stock',
  LOW_STOCK: 'Stock bajo',
}

// El estado se dice con texto e ícono, no solo con color: quien no distingue
// rojo de naranja también entiende de qué alerta se trata.
export function AlertBadge({ type }: Readonly<{ type: AlertType }>) {
  const Icono = type === 'OUT_OF_STOCK' ? PackageX : AlertTriangle
  return (
    <span className={`cp-alert-badge cp-alert-badge-${type === 'OUT_OF_STOCK' ? 'out' : 'low'}`}>
      <Icono size={12} aria-hidden="true" />
      {TEXTO[type]}
    </span>
  )
}
