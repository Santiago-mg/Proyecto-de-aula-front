import type { ReactNode } from 'react'

interface EmptyStateProps {
  icono?: ReactNode
  titulo: string
  /** Si la pantalla no tiene otro título, el vacío se escribe como encabezado (1, 2 o 3). */
  nivel?: 1 | 2 | 3
  /** Qué pasó y qué puede hacer el usuario ahora */
  children?: ReactNode
  /** Botones o enlaces de salida */
  acciones?: ReactNode
}

/**
 * Pantalla "no hay nada aquí". Siempre debe dejar una salida: una lista vacía
 * sin botón es un callejón sin salida (heurística 3).
 */
export function EmptyState({ icono, titulo, nivel, children, acciones }: Readonly<EmptyStateProps>) {
  const Titulo = nivel ? (`h${nivel}` as 'h1' | 'h2' | 'h3') : 'p'
  return (
    <div className="cp-empty">
      {icono && <div className="cp-empty-icon" aria-hidden="true">{icono}</div>}
      <Titulo className="cp-empty-title">{titulo}</Titulo>
      {children && <div className="cp-empty-body">{children}</div>}
      {acciones && <div className="cp-empty-actions">{acciones}</div>}
    </div>
  )
}
