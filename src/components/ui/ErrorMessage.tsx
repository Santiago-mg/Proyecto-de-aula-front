import { Link } from 'react-router-dom'
import { mensajeDeError } from '../../utils/errores'

interface ErrorMessageProps {
  error: Error | null
  /** Si se pasa, aparece un botón "Reintentar" (heurística 11: recuperarse de fallos). */
  onReintentar?: () => void
  /** Enlace a la guía de la ayuda que resuelve este problema (heurística 10). */
  ayuda?: { ancla: string; texto: string }
}

export function ErrorMessage({ error, onReintentar, ayuda }: Readonly<ErrorMessageProps>) {
  // role="alert": el lector de pantalla lo anuncia al aparecer, sin que la
  // persona tenga que buscar el mensaje.
  const mensaje = <p role="alert" className="cp-error-message">{mensajeDeError(error)}</p>
  if (!onReintentar && !ayuda) return mensaje

  return (
    <div className="cp-error-bloque">
      {mensaje}
      <div className="cp-error-acciones">
        {onReintentar && (
          <button type="button" className="cp-btn cp-btn-secondary" onClick={onReintentar}>
            Reintentar
          </button>
        )}
        {ayuda && (
          <Link to={`/ayuda#${ayuda.ancla}`} className="cp-link">
            {ayuda.texto}
          </Link>
        )}
      </div>
    </div>
  )
}
