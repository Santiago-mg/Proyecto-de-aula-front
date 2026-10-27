import {
  BarChart3,
  Bell,
  ChevronRight,
  LayoutDashboard,
  Menu,
  LogOut,
  Package,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAlertas } from '../../hooks/useAlertas'
import { useTituloPagina } from '../../hooks/useTituloPagina'

const NAV_ITEMS = [
  { to: '/admin', label: 'Panel', icon: LayoutDashboard, exact: true },
  { to: '/admin/phones', label: 'Celulares', icon: Package },
  { to: '/admin/alerts', label: 'Alertas', icon: Bell, conInsignia: true },
  { to: '/admin/orders', label: 'Órdenes', icon: ShoppingCart },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
  { to: '/admin/stats', label: 'Estadísticas', icon: BarChart3 },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Se vuelve a pedir en cada cambio de ruta: así la insignia refleja el stock
  // recién repuesto sin que haya que recargar la página.
  const { alertas } = useAlertas(location.pathname)
  const abiertas = alertas.length

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function isActive(to: string, exact?: boolean) {
    if (exact) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  // Heurística 1: la pestaña del navegador dice en qué sección del panel se está
  const seccion = NAV_ITEMS.find((i) => isActive(i.to, i.exact))?.label ?? 'Panel'
  useTituloPagina(`${seccion} — Administración`)

  return (
    <div className="cp-admin-layout">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="cp-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          style={{ zIndex: 98 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`cp-admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="cp-admin-sidebar-header">
          <Link to="/admin" className="cp-admin-brand">
            <span className="cp-admin-brand-icon">⬡</span>
            <div>
              <div className="cp-admin-brand-name">CelularPro</div>
              <div className="cp-admin-brand-sub">Panel de control</div>
            </div>
          </Link>
          <button
            className="cp-icon-btn cp-show-mobile"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
            style={{ marginLeft: 'auto' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="cp-admin-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`cp-admin-nav-item ${isActive(item.to, item.exact) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.conInsignia && abiertas > 0 && (
                <span
                  className="cp-nav-badge"
                  data-testid="insignia-alertas"
                  aria-label={`${abiertas} ${abiertas === 1 ? 'alerta abierta' : 'alertas abiertas'}`}
                >
                  {abiertas > 99 ? '99+' : abiertas}
                </span>
              )}
              <ChevronRight size={14} className="cp-admin-nav-arrow" />
            </Link>
          ))}
        </nav>

        <div className="cp-admin-sidebar-footer">
          <div className="cp-admin-user-info">
            <div className="cp-admin-user-avatar">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="cp-admin-user-name">{user?.name}</div>
              <div className="cp-admin-user-role">Administrador</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Link to="/" className="cp-btn cp-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
              Ver tienda
            </Link>
            <button className="cp-btn cp-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={handleLogout}>
              <LogOut size={13} aria-hidden="true" /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="cp-admin-content">
        {/* Top bar móvil */}
        <header className="cp-admin-topbar">
          <button
            className="cp-icon-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            {/* Heurística 4: LayoutDashboard significa "Panel" en el menú; abrir el menú lleva el ícono de menú */}
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="cp-admin-topbar-title">
            {NAV_ITEMS.find((i) => isActive(i.to, i.exact))?.label ?? 'Admin'}
          </span>
        </header>

        <main className="cp-admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
