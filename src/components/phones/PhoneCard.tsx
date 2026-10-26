import { ShieldCheck, Battery } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PhoneListItem } from '../../types/phone'
import { formatCOP } from '../../utils/formato'

const CONDITION_LABEL: Record<string, string> = {
  NEW: 'Nuevo',
  CERTIFIED: 'Certificado',
  USED: 'Usado verificado',
}

interface PhoneCardProps {
  phone: PhoneListItem
}

export function PhoneCard({ phone }: Readonly<PhoneCardProps>) {
  const hasDiscount = phone.compareAt && phone.compareAt > phone.price
  const discountPct = hasDiscount
    ? Math.round((1 - phone.price / phone.compareAt!) * 100)
    : 0
  // "Apple · apple" parece un error: la categoría solo se muestra si aporta algo.
  const mostrarCategoria = phone.category.toLowerCase() !== phone.brand.toLowerCase()

  return (
    <Link
      to={`/phones/${phone.slug}`}
      className={`cp-phone-card ${phone.stock === 0 ? 'agotado' : ''}`}
    >
      {/* Imagen */}
      <div className="cp-phone-card-img">
        {phone.heroImage ? (
          <img src={phone.heroImage} alt={phone.name} loading="lazy" decoding="async" />
        ) : (
          <div className="cp-phone-card-placeholder" aria-hidden="true">📱</div>
        )}

        {/* Badges */}
        <div className="cp-phone-card-badges">
          {phone.badge && (
            <span className="cp-badge cp-badge-accent">{phone.badge}</span>
          )}
          {phone.verified && (
            <span className="cp-badge cp-badge-verified">
              <ShieldCheck size={12} aria-hidden="true" /> Verificado
            </span>
          )}
          {hasDiscount && (
            <span className="cp-badge cp-badge-discount">-{discountPct}%</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="cp-phone-card-body">
        <div className="cp-phone-card-condition">
          {CONDITION_LABEL[phone.condition]}
        </div>
        <div className="cp-phone-card-meta">
          <span className="cp-phone-card-brand">{phone.brand}</span>
          {mostrarCategoria && <span className="cp-phone-card-category">{phone.category}</span>}
        </div>
        <h3 className="cp-phone-card-name">{phone.name}</h3>

        {/* Specs rápidas */}
        <div className="cp-phone-card-specs">
          {phone.storage && <span>{phone.storage}</span>}
          {phone.ram && <span>{phone.ram} RAM</span>}
          {phone.batteryHealth !== null && phone.condition !== 'NEW' && (
            <span>
              <Battery size={12} aria-hidden="true" />
              <span className="cp-sr-only">Salud de batería </span>
              {phone.batteryHealth}%
            </span>
          )}
        </div>

        {/* Precio */}
        <div className="cp-phone-card-pricing">
          <span className="cp-phone-card-price">{formatCOP(phone.price)}</span>
          {hasDiscount && (
            <span className="cp-phone-card-compare">
              <span className="cp-sr-only">Antes </span>
              {formatCOP(phone.compareAt!)}
            </span>
          )}
        </div>

        {phone.stock === 0 && (
          <div className="cp-phone-card-no-stock">Sin stock</div>
        )}
        {phone.stock > 0 && phone.stock <= 3 && (
          <div className="cp-phone-card-low-stock">
            Últimas {phone.stock} unidades
          </div>
        )}
      </div>
    </Link>
  )
}
