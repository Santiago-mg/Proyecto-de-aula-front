import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

type Tono = 'info' | 'ok' | 'warn'

interface AvisoProps {
  tono?: Tono
  children: ReactNode
  /** Botones o enlaces al final del aviso */
  acciones?: ReactNode
}

const ICONOS = { info: Info, ok: CircleCheck, warn: TriangleAlert }

/**
 * Aviso fijo dentro de la página (no desaparece solo): para cosas que la
 * persona necesita leer con calma, como "tu sesión venció" o "recuperamos tus
 * datos". El icono y el texto cuentan lo mismo que el color.
 */
export function Aviso({ tono = 'info', children, acciones }: Readonly<AvisoProps>) {
  const Icono = ICONOS[tono]
  return (
    <div className={`cp-notice cp-notice-${tono}`} role="status">
      <Icono size={18} aria-hidden="true" className="cp-notice-icon" />
      <div className="cp-notice-body">{children}</div>
      {acciones && <div className="cp-notice-actions">{acciones}</div>}
    </div>
  )
}
