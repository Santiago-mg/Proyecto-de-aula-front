import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { ConnectionBanner } from '../ui/ConnectionBanner'
import { SkipLink } from '../ui/SkipLink'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/phones', label: 'Celulares', icon: Package },
  { to: '/admin/orders', label: 'Órdenes', icon: ShoppingCart },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
  { to: '/admin/stats', label: 'Estadísticas', icon: BarChart3 },
]

const MENSAJE_SIN_CONEXION =
  'Sin conexión a internet. Los cambios que hagas no se guardarán hasta que vuelva.'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menu = useRef<HTMLElement>(null)
  const contenido = useRef<HTMLDivElement>(null)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function isActive(to: string, exact?: boolean) {
    if (exact) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  // En pantallas angostas el menú es un panel que tapa la página: mientras está
  // abierto el teclado se queda dentro de él, Escape lo cierra y el foco vuelve
  // al botón que lo abrió. Cerrado, no debe poder recibir foco (ver el CSS).
  useFocusTrap(menu, menuAbierto, { alEscapar: () => setMenuAbierto(false) })

  // Lo que queda detrás del menú abierto no se puede leer ni tocar.
  useEffect(() => {
    const detras = contenido.current
    if (!detras) return
    if (menuAbierto) detras.setAttribute('inert', '')
    else detras.removeAttribute('inert')
    return () => detras.removeAttribute('inert')
  }, [menuAbierto])

  // Si la ventana se ensancha con el menú abierto (girar el celular, por
  // ejemplo), el menú pasa a ser fijo y ya no hay nada que cerrar.
  useEffect(() => {
    if (!menuAbierto || typeof globalThis.matchMedia !== 'function') return
    const escritorio = globalThis.matchMedia('(min-width: 769px)')
    const alCambiar = () => {
      if (escritorio.matches) setMenuAbierto(false)
    }
    escritorio.addEventListener('change', alCambiar)
    return () => escritorio.removeEventListener('change', alCambiar)
  }, [menuAbierto])

  return (
    <div className="cp-admin-layout">
      <SkipLink />

      {/* Telón del menú en móvil */}
      {menuAbierto && (
        <div
          className="cp-overlay cp-admin-overlay"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Menú lateral */}
      <aside
        ref={menu}
        id="menu-admin"
        aria-label="Menú de administración"
        className={`cp-admin-sidebar ${menuAbierto ? 'open' : ''}`}
      >
        <div className="cp-admin-sidebar-header">
          <Link to="/admin" className="cp-admin-brand">
            <span className="cp-admin-brand-icon" aria-hidden="true">⬡</span>
            <div>
              <div className="cp-admin-brand-name">CelularPro</div>
              <div className="cp-admin-brand-sub">Panel de control</div>
            </div>
          </Link>
          <button
            type="button"
            className="cp-icon-btn cp-show-mobile cp-admin-close"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="cp-admin-nav" aria-label="Secciones del panel">
          {NAV_ITEMS.map((item) => {
            const activo = isActive(item.to, item.exact)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`cp-admin-nav-item ${activo ? 'active' : ''}`}
                aria-current={activo ? 'page' : undefined}
                onClick={() => setMenuAbierto(false)}
              >
                <item.icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
                <ChevronRight size={14} aria-hidden="true" className="cp-admin-nav-arrow" />
              </Link>
            )
          })}
        </nav>

        <div className="cp-admin-sidebar-footer">
          <div className="cp-admin-user-info">
            <div className="cp-admin-user-avatar" aria-hidden="true">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="cp-admin-user-name">{user?.name}</div>
              <div className="cp-admin-user-role">Administrador</div>
            </div>
          </div>
          <div className="cp-admin-sidebar-actions">
            <Link to="/" className="cp-btn cp-btn-ghost cp-btn-sm">
              Ver tienda
            </Link>
            <button type="button" className="cp-btn cp-btn-ghost cp-btn-sm" onClick={handleLogout}>
              <LogOut size={14} aria-hidden="true" /> Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="cp-admin-content" ref={contenido}>
        {/* Barra superior en móvil */}
        <div className="cp-admin-topbar">
          <button
            type="button"
            className="cp-icon-btn"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            aria-controls="menu-admin"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="cp-admin-topbar-title">
            {NAV_ITEMS.find((i) => isActive(i.to, i.exact))?.label ?? 'Admin'}
          </span>
        </div>

        <ConnectionBanner mensaje={MENSAJE_SIN_CONEXION} />

        <main id="contenido" tabIndex={-1} className="cp-admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
