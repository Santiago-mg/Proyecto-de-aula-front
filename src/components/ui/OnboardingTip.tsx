import { useState } from 'react'
import { Link } from 'react-router-dom'

const CLAVE = 'cp_onboarding_done'

/** Hace que la guía de bienvenida vuelva a aparecer en el catálogo. */
export function reabrirGuia() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // sin almacenamiento no hay nada que reabrir
  }
}

function yaVista(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    // Si el navegador no deja guardar, mejor no insistir con la guía.
    return true
  }
}

/**
 * Guía de primera visita. No es un diálogo ni bloquea nada: es una tarjeta que
 * se puede cerrar y que no vuelve (heurística 10: ayuda y documentación, sin
 * entorpecer al que ya sabe).
 */
export function OnboardingTip() {
  const [visible, setVisible] = useState(() => !yaVista())

  if (!visible) return null

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, '1')
    } catch {
      // se cierra igual durante esta visita
    }
    setVisible(false)
  }

  return (
    <section className="cp-onboarding" aria-labelledby="onboarding-titulo">
      <div className="cp-onboarding-body">
        <h2 id="onboarding-titulo" className="cp-onboarding-title">
          ¿Primera vez por aquí?
        </h2>
        <ul className="cp-onboarding-list">
          <li>
            <strong>Filtra a tu medida.</strong> Por condición, marca y precio; "Limpiar filtros" los quita todos.
          </li>
          <li>
            <strong>Mira la ficha completa.</strong> Cada equipo muestra su condición y, si es usado, la salud real de la batería.
          </li>
          <li>
            <strong>Tu carrito se guarda</strong> aunque cierres la página.
          </li>
        </ul>
      </div>
      <div className="cp-onboarding-actions">
        <Link to="/ayuda" className="cp-btn cp-btn-secondary">
          Ver la ayuda
        </Link>
        <button type="button" className="cp-btn cp-btn-primary" onClick={cerrar}>
          Entendido
        </button>
      </div>
    </section>
  )
}
