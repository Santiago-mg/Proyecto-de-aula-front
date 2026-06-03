import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from '../components/routes/AdminRoute'
import { ProtectedRoute } from '../components/routes/ProtectedRoute'
import { MainLayout } from '../components/layout/MainLayout'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { ToastProvider } from '../context/ToastContext'
import { Home } from '../pages/Home'
import { Catalog } from '../pages/Catalog'
import { PhoneDetail } from '../pages/PhoneDetail'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { Dashboard } from '../pages/Dashboard'
import { Checkout } from '../pages/Checkout'
import { AdminPhones } from '../pages/admin/AdminPhones'
import { PhoneForm } from '../pages/admin/PhoneForm'
import { NotFound } from '../pages/NotFound'
import { Unauthorized } from '../pages/Unauthorized'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Con layout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/phones/:slug" element={<PhoneDetail />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Requieren sesión */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/checkout" element={<Checkout />} />
                </Route>

                {/* Solo admin */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin/phones" element={<AdminPhones />} />
                  <Route path="/admin/phones/new" element={<PhoneForm />} />
                  <Route path="/admin/phones/:id/edit" element={<PhoneForm />} />
                </Route>
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
