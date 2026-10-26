import { TriangleAlert } from 'lucide-react'
import { describirError } from '../../utils/errores'

interface ErrorMessageProps {
  error: Error | null
  /** Qué hacer ahora, cuando la situación lo conoce mejor que el código HTTP. */
  pista?: string
  /** Si se pasa, el aviso ofrece "Reintentar" (por ejemplo cuando no cargó una lista). */
  onReintentar?: () => void
}

/**
 * Error dentro de un formulario o una tabla. Dice qué pasó y, cuando se puede,
 * qué hacer; el icono evita que el aviso dependa solo del color rojo.
 */
export function ErrorMessage({ error, pista, onReintentar }: Readonly<ErrorMessageProps>) {
  const descripcion = describirError(error)

  // role="alert": el lector de pantalla anuncia el error en cuanto aparece.
  if (!descripcion) return <div role="alert" className="cp-error" />

  const sugerencia = pista ?? descripcion.pista

  return (
    <div role="alert" className="cp-error">
      <TriangleAlert size={16} aria-hidden="true" className="cp-error-icon" />
      <div>
        <p className="cp-error-msg">{descripcion.mensaje}</p>
        {sugerencia && <p className="cp-error-hint">{sugerencia}</p>}
        {descripcion.codigo && (
          <p className="cp-error-code">Referencia para soporte: {descripcion.codigo}</p>
        )}
        {onReintentar && (
          <button type="button" className="cp-btn cp-btn-secondary cp-btn-sm cp-error-retry" onClick={onReintentar}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}
