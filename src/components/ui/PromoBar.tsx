import { Pause, Play, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePreferencias } from '../../context/PreferencesContext'

const MESSAGES = [
  '⚡ ENVÍO GRATIS en compras superiores a $500.000 COP',
  '🛡️ IMEI verificado y limpio en todos nuestros equipos',
  '🔋 Batería certificada — publicamos el % real antes de comprar',
  '✅ Garantía real: 6 meses en certificados, 30 días en usados',
  '📦 Despacho en 24–48 h a toda Colombia',
]

export function PromoBar() {
  const [visible, setVisible] = useState(true)
  const [pausado, setPausado] = useState(false)
  const { movimientoReducido } = usePreferencias()

  if (!visible) return null

  const quieto = pausado || movimientoReducido

  return (
    <aside className="cp-promo-bar" aria-label="Promociones">
      <div className="cp-promo-bar-track">
        {/* Mensajes en desplazamiento. La segunda copia solo existe para que el
            recorrido no tenga un hueco; se oculta a los lectores de pantalla
            para que no lean todo dos veces. */}
        <div className={`cp-promo-marquee ${quieto ? 'quieto' : ''}`}>
          {['a', 'b'].flatMap((copia) => MESSAGES.map((msg) => ({ copia, msg }))).map(({ copia, msg }) => (
            <span
              key={`${copia}-${msg}`}
              className="cp-promo-marquee-item"
              aria-hidden={copia === 'b' ? true : undefined}
            >
              <Zap size={11} aria-hidden="true" />
              {msg}
            </span>
          ))}
        </div>
      </div>

      <div className="cp-promo-bar-cta">
        <Link to="/catalog?condition=CERTIFIED" className="cp-promo-bar-link">
          Ver certificados →
        </Link>
        {/* Contenido que se mueve más de 5 s debe poder detenerse (WCAG 2.2.2) */}
        {!movimientoReducido && (
          <button
            type="button"
            className="cp-promo-bar-close"
            onClick={() => setPausado((p) => !p)}
            aria-label={pausado ? 'Reanudar mensajes' : 'Pausar mensajes'}
            aria-pressed={pausado}
          >
            {pausado ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
          </button>
        )}
        <button
          type="button"
          className="cp-promo-bar-close"
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
