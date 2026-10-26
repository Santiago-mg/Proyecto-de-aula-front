import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Página no encontrada')

  return (
    <div className="cp-container cp-status-page">
      <div className="cp-status-code" aria-hidden="true">404</div>
      <EmptyState
        nivel={1}
        icono={<Compass size={40} />}
        titulo="Página no encontrada"
        acciones={
          <>
            <Link to="/" className="cp-btn cp-btn-primary">
              Volver al inicio
            </Link>
            <Link to="/catalog" className="cp-btn cp-btn-secondary">
              Ver el catálogo
            </Link>
            <Link to="/ayuda" className="cp-btn cp-btn-ghost">
              Centro de ayuda
            </Link>
          </>
        }
      >
        La URL que buscas no existe o fue movida.
      </EmptyState>
    </div>
  )
}
