import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

interface AuthLayoutProps {
  titulo: string
  subtitulo: ReactNode
  children: ReactNode
}

/**
 * Marco común de ingresar y crear cuenta. Estas dos pantallas viven fuera del
 * diseño principal, así que aquí se repone lo esencial: contenido principal
 * identificado (para el salto de foco), título de pestaña y una salida a la tienda.
 */
export function AuthLayout({ titulo, subtitulo, children }: Readonly<AuthLayoutProps>) {
  useDocumentTitle(titulo)

  return (
    <main className="cp-auth-page" id="contenido" tabIndex={-1}>
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="cp-auth-motion"
      >
        <div className="cp-auth-card">
          <Link to="/" className="cp-logo cp-auth-logo" aria-label="CelularPro, ir al inicio">
            Celular<span>Pro</span>
            <span className="cp-logo-badge" aria-hidden="true">✓</span>
          </Link>

          <h1 className="cp-auth-title">{titulo}</h1>
          <p className="cp-auth-sub">{subtitulo}</p>

          {children}

          <Link to="/catalog" className="cp-auth-back">
            ← Seguir mirando el catálogo
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
