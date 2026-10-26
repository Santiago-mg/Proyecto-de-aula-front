import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { describirError } from '../../utils/errores'

interface ErrorStateProps {
  /** Qué no se pudo hacer: "No se pudo cargar el catálogo". */
  titulo: string
  /** El error original, para sacar la pista y la referencia de soporte. */
  error?: Error | null
  /** Texto cuando el error no trae una pista propia. */
  detalle?: string
  /** Si se pasa, aparece el botón "Reintentar". */
  onReintentar?: () => void
  /** Salidas extra (por ejemplo, "Ver todo el catálogo"). */
  acciones?: ReactNode
}

/**
 * Error de una sección completa (no de un campo). Nunca deja la pantalla sin
 * salida: dice qué pasó, qué probar y ofrece reintentar (heurística 9).
 */
export function ErrorState({ titulo, error = null, detalle, onReintentar, acciones }: Readonly<ErrorStateProps>) {
  const descripcion = describirError(error)
  const pista = descripcion?.pista ?? detalle ?? 'Inténtalo de nuevo. Si el problema sigue, escríbenos desde el centro de ayuda.'

  return (
    <div className="cp-errorstate" role="alert">
      <TriangleAlert size={36} aria-hidden="true" className="cp-errorstate-icon" />
      <h2 className="cp-errorstate-title">{titulo}</h2>
      <p className="cp-errorstate-body">{pista}</p>
      {descripcion?.codigo && (
        <p className="cp-error-code">Referencia para soporte: {descripcion.codigo}</p>
      )}
      {(onReintentar || acciones) && (
        <div className="cp-empty-actions">
          {onReintentar && (
            <button type="button" className="cp-btn cp-btn-primary" onClick={onReintentar}>
              Reintentar
            </button>
          )}
          {acciones}
        </div>
      )}
    </div>
  )
}
