import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Unauthorized() {
  useDocumentTitle('Acceso no autorizado')

  return (
    <div className="cp-container cp-status-page">
      <EmptyState
        nivel={1}
        icono={<Lock size={40} />}
        titulo="Acceso no autorizado"
        acciones={
          <>
            <Link to="/" className="cp-btn cp-btn-primary">
              Volver al inicio
            </Link>
            <Link to="/catalog" className="cp-btn cp-btn-secondary">
              Ver el catálogo
            </Link>
          </>
        }
      >
        No tienes permisos para ver esta página. Si crees que deberías tenerlos, pídele acceso a un administrador.
      </EmptyState>
    </div>
  )
}
