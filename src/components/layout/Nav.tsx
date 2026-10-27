import { ShoppingBag, Menu, X, CircleHelp, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

interface NavProps {
  onOpenCart(): void
}

export function Nav({ onOpenCart }: Readonly<NavProps>) {
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Heurística 1: el menú marca dónde está la persona. aria-current="page"
  // lo anuncia también a los lectores de pantalla.
  const ruta = location.pathname + location.search
  const marca = (destino: string, exacto = true) => {
    const activo = exacto ? ruta === destino : location.pathname.startsWith(destino)
    return { className: activo ? 'active' : '', ariaCurrent: activo ? ('page' as const) : undefined }
  }

  const links = [
    { label: 'Tienda', to: '/catalog' },
    { label: 'Nuevos', to: '/catalog?condition=NEW' },
    { label: 'Certificados', to: '/catalog?condition=CERTIFIED' },
    { label: 'iPhone', to: '/catalog?category=apple' },
    { label: 'Samsung', to: '/catalog?category=samsung' },
  ]

  return (
    <header className="cp-nav">
      <div className="cp-container cp-nav-inner">
        {/* Logo */}
        <Link to="/" className="cp-logo">
          Celular<span>Pro</span>
          <span className="cp-logo-badge">✓</span>
        </Link>

        {/* Links desktop */}
        <nav className="cp-nav-links">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`cp-nav-link ${marca(l.to).className}`}
              aria-current={marca(l.to).ariaCurrent}
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
                <Link to="/admin" className="cp-nav-link cp-hide-mobile">
                  Panel admin
                </Link>
              )}
              {/* Heurística 4: la etiqueta dice a dónde lleva ("Mi cuenta"), no el
                  nombre de la persona; el nombre queda como texto de apoyo. */}
              <Link
                to="/dashboard"
                className={`cp-nav-link cp-hide-mobile ${marca('/dashboard', false).className || marca('/profile', false).className}`}
                aria-current={marca('/dashboard', false).ariaCurrent ?? marca('/profile', false).ariaCurrent}
                title={`Sesión iniciada como ${user.name}`}
              >
                Mi cuenta
              </Link>
              {/* Heurística 2: el mismo nombre en escritorio y en móvil */}
              <button className="cp-btn cp-btn-ghost cp-hide-mobile" onClick={handleLogout}>
                <LogOut size={14} aria-hidden="true" /> Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="cp-nav-link">
                Ingresar
              </Link>
              <Link to="/register" className="cp-btn cp-btn-primary">
                Registrarse
              </Link>
            </>
          )}

          {/* Heurística 10: la ayuda siempre a la vista, no solo en el pie */}
          <Link
            to="/ayuda"
            className={`cp-icon-btn ${marca('/ayuda', false).className}`}
            aria-label="Ayuda"
            aria-current={marca('/ayuda', false).ariaCurrent}
            title="Ayuda (atajo: ?)"
          >
            <CircleHelp size={18} aria-hidden="true" />
          </Link>

          <button
            className="cp-icon-btn"
            onClick={onOpenCart}
            aria-label="Carrito"
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="cp-cart-badge">{totalItems}</span>
            )}
          </button>

          <button
            className="cp-icon-btn cp-show-mobile"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileOpen && (
        <div className="cp-mobile-menu">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="cp-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/ayuda" className="cp-mobile-link" onClick={() => setMobileOpen(false)}>
            Ayuda
          </Link>
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
              <Link
                to="/profile"
                className="cp-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Mi perfil
              </Link>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="cp-mobile-link" onClick={() => setMobileOpen(false)}>
                  Panel admin
                </Link>
              )}
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
