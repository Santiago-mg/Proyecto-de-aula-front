import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Redirige a /login si no hay sesión activa. Se lleva la ruta de origen para
// devolver a la persona ahí después de ingresar (por ejemplo, al checkout con
// su carrito intacto).
export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
