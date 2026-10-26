import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from '../components/routes/AdminRoute'
import { ProtectedRoute } from '../components/routes/ProtectedRoute'
import { AdminLayout } from '../components/admin/AdminLayout'
import { MainLayout } from '../components/layout/MainLayout'
import { RouteEffects } from '../components/layout/RouteEffects'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { PreferencesProvider, usePreferencias } from '../context/PreferencesContext'
import { ToastProvider } from '../context/ToastContext'
import { Help } from '../pages/Help'
import { Home } from '../pages/Home'
import { Privacy } from '../pages/Privacy'
import { Catalog } from '../pages/Catalog'
import { PhoneDetail } from '../pages/PhoneDetail'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { Dashboard } from '../pages/Dashboard'
import { Checkout } from '../pages/Checkout'
import { AdminDashboard } from '../pages/admin/AdminDashboard'
import { AdminPhones } from '../pages/admin/AdminPhones'
import { PhoneForm } from '../pages/admin/PhoneForm'
import { AdminUsers } from '../pages/admin/AdminUsers'
import { AdminOrders } from '../pages/admin/AdminOrders'
import { AdminStats } from '../pages/admin/AdminStats'
import { NotFound } from '../pages/NotFound'
import { Unauthorized } from '../pages/Unauthorized'

/**
 * Las animaciones de framer-motion (aparecer al hacer scroll, formas flotantes,
 * entrada de tarjetas) no las frena el CSS: hay que decírselo a la librería.
 * Con "menos movimiento" —pedido en nuestro panel o en el sistema— quedan los
 * cambios de opacidad y se quitan los desplazamientos (WCAG 2.3.3 y 2.2.2).
 */
function Movimiento({ children }: Readonly<{ children: ReactNode }>) {
  const { movimientoReducido } = usePreferencias()
  return <MotionConfig reducedMotion={movimientoReducido ? 'always' : 'user'}>{children}</MotionConfig>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <PreferencesProvider>
        <Movimiento>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <RouteEffects />
                <Routes>
                  {/* Públicas sin layout */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Tienda pública + layout principal */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/phones/:slug" element={<PhoneDetail />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/ayuda" element={<Help />} />
                    <Route path="/privacidad" element={<Privacy />} />
                    <Route path="/404" element={<NotFound />} />

                    {/* Requieren sesión */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/checkout" element={<Checkout />} />
                    </Route>
                  </Route>

                  {/* Panel admin — layout propio con sidebar */}
                  <Route element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/phones" element={<AdminPhones />} />
                      <Route path="/admin/phones/new" element={<PhoneForm />} />
                      <Route path="/admin/phones/:id/edit" element={<PhoneForm />} />
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/stats" element={<AdminStats />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </Movimiento>
      </PreferencesProvider>
    </BrowserRouter>
  )
}
