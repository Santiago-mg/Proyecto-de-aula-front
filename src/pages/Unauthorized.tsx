import { Link } from 'react-router-dom'
import { useTituloPagina } from '../hooks/useTituloPagina'

export function Unauthorized() {
  useTituloPagina('Acceso no autorizado')
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          marginBottom: 12,
        }}
      >
        Acceso no autorizado
      </h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
        No tienes permisos para ver esta página.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="cp-btn cp-btn-primary">
          Volver al inicio
        </Link>
        <Link to="/ayuda#faq-admin" className="cp-btn cp-btn-secondary">
          ¿Por qué veo esto?
        </Link>
      </div>
    </div>
  )
}
