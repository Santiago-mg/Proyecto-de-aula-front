import { X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const MESSAGES = [
  '⚡ ENVÍO GRATIS en compras superiores a $500.000 COP',
  '🛡️ IMEI verificado y limpio en todos nuestros equipos',
  '🔋 Batería certificada — publicamos el % real antes de comprar',
  '✅ Garantía real: 6 meses en certificados, 30 días en usados',
  '📦 Despacho en 24–48 h a toda Colombia',
]

export function PromoBar() {
  const [visible, setVisible] = useState(true)

  // Publica su altura para que la navegación fija y el contenido se ubiquen debajo.
  // Al cerrarla (o al salir del diseño principal) vuelve a 0 y la navegación sube.
  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.setProperty('--promo-h', visible ? '36px' : '0px')
    return () => raiz.style.setProperty('--promo-h', '0px')
  }, [visible])

  if (!visible) return null

  return (
    <aside className="cp-promo-bar" aria-label="Promociones">
      <div className="cp-promo-bar-track">
        {/* scrolling marquee */}
        <div className="cp-promo-marquee">
          {['a', 'b'].flatMap((copia) => MESSAGES.map((msg) => ({ copia, msg }))).map(({ copia, msg }) => (
            <span key={`${copia}-${msg}`} className="cp-promo-marquee-item">
              <Zap size={11} />
              {msg}
            </span>
          ))}
        </div>
      </div>

      <div className="cp-promo-bar-cta">
        <Link to="/catalog?condition=CERTIFIED" className="cp-promo-bar-link">
          Ver certificados →
        </Link>
        <button
          className="cp-promo-bar-close"
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
        >
          <X size={12} />
        </button>
      </div>
    </aside>
  )
}
