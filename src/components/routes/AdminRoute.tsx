import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Redirige si el usuario no tiene rol ADMIN
export function AdminRoute() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (user.role !== 'ADMIN') return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
