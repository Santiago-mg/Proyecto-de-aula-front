import { Accessibility, ShoppingBag, Menu, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { usePreferencias } from '../../context/PreferencesContext'

interface NavProps {
  onOpenCart(): void
}

const LINKS = [
  { label: 'Tienda', to: '/catalog' },
  { label: 'Nuevos', to: '/catalog?condition=NEW' },
  { label: 'Certificados', to: '/catalog?condition=CERTIFIED' },
  { label: 'iPhone', to: '/catalog?category=apple' },
  { label: 'Samsung', to: '/catalog?category=samsung' },
  { label: 'Ayuda', to: '/ayuda' },
]

export function Nav({ onOpenCart }: Readonly<NavProps>) {
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const { abrirPanel } = usePreferencias()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const idMenu = useId()
  const idConteo = useId()

  // Al cambiar de página el menú móvil se cierra solo.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  // Escape cierra el menú sin tener que buscar la "X".
  useEffect(() => {
    if (!mobileOpen) return
    function cerrar(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', cerrar)
    return () => document.removeEventListener('keydown', cerrar)
  }, [mobileOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const actual = location.pathname + location.search

  return (
    <header className="cp-nav">
      <div className="cp-container cp-nav-inner">
        {/* Logo */}
        <Link to="/" className="cp-logo" aria-label="CelularPro, ir al inicio">
          Celular<span>Pro</span>
          <span className="cp-logo-badge" aria-hidden="true">✓</span>
        </Link>

        {/* Links desktop */}
        <nav className="cp-nav-links" aria-label="Principal">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`cp-nav-link ${actual === l.to ? 'active' : ''}`}
              aria-current={actual === l.to ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="cp-nav-actions">
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link to="/admin/phones" className="cp-nav-link cp-hide-mobile">
                  Admin
                </Link>
              )}
              <Link to="/dashboard" className="cp-nav-link cp-hide-mobile">
                {user.name.split(' ')[0]}
              </Link>
              <button className="cp-btn cp-btn-ghost cp-hide-mobile" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="cp-nav-link cp-hide-mobile">
                Ingresar
              </Link>
              <Link to="/register" className="cp-btn cp-btn-primary cp-hide-mobile">
                Registrarse
              </Link>
            </>
          )}

          <button
            className="cp-icon-btn"
            onClick={abrirPanel}
            aria-label="Pantalla y accesibilidad"
            title="Pantalla y accesibilidad"
          >
            <Accessibility size={18} aria-hidden="true" />
          </button>

          <button
            className="cp-icon-btn"
            onClick={onOpenCart}
            aria-label="Carrito"
            aria-describedby={idConteo}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            {totalItems > 0 && (
              <span className="cp-cart-badge">{totalItems}</span>
            )}
          </button>
          <span id={idConteo} className="cp-sr-only">
            {totalItems === 1 ? '1 unidad en el carrito' : `${totalItems} unidades en el carrito`}
          </span>

          <button
            className="cp-icon-btn cp-show-mobile"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
            aria-expanded={mobileOpen}
            aria-controls={idMenu}
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileOpen && (
        <div id={idMenu} className="cp-mobile-menu">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="cp-mobile-link"
              aria-current={actual === l.to ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <hr className="cp-mobile-divider" />
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="cp-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Mi cuenta
              </Link>
              <button className="cp-mobile-link" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="cp-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Ingresar
              </Link>
              <Link
                to="/register"
                className="cp-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
