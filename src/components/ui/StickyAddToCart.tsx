import { ShoppingBag, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Phone, PhoneColor } from '../../types/phone'
import { formatCOP } from '../../utils/formato'

interface StickyAddToCartProps {
  phone: Phone
  selectedColor: PhoneColor | null
  qty: number
  onAdd(): void
}

export function StickyAddToCart({ phone, selectedColor, qty, onAdd }: Readonly<StickyAddToCartProps>) {
  const [visible, setVisible] = useState(false)

  // Aparece cuando se hace scroll hacia abajo > 500px
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible || phone.stock === 0) return null

  return (
    <div className={`cp-sticky-cart ${visible ? 'visible' : ''}`}>
      <div className="cp-container cp-sticky-cart-inner">
        <div className="cp-sticky-cart-info">
          {phone.heroImage && (
            <img src={phone.heroImage} alt={phone.name} className="cp-sticky-cart-img" />
          )}
          <div>
            <div className="cp-sticky-cart-name">{phone.name}</div>
            {selectedColor && (
              <div className="cp-sticky-cart-color">
                <span
                  className="cp-sticky-cart-dot"
                  style={{ background: selectedColor.hex }}
                  aria-hidden="true"
                />
                {selectedColor.name}
              </div>
            )}
          </div>
        </div>

        <div className="cp-sticky-cart-right">
          <div className="cp-sticky-cart-price">{formatCOP(phone.price * qty)}</div>
          <button
            type="button"
            className="cp-btn cp-btn-primary cp-sticky-cart-btn"
            onClick={onAdd}
          >
            <ShoppingBag size={15} aria-hidden="true" />
            Agregar al carrito
          </button>
          <div className="cp-sticky-cart-trust">
            <ShieldCheck size={12} className="cp-ok-icon" aria-hidden="true" />
            <span>Garantía incluida</span>
          </div>
        </div>
      </div>
    </div>
  )
}
