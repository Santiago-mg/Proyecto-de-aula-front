import {
  ShieldCheck,
  Battery,
  Cpu,
  Camera,
  Monitor,
  HardDrive,
  MemoryStick,
  Truck,
  RefreshCw,
  Lock,
  PackageX,
} from 'lucide-react'
import axios from 'axios'
import { useCallback, useEffect, useId, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RecentlyViewed } from '../components/phones/RecentlyViewed'
import { SimilarPhones } from '../components/phones/SimilarPhones'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { SkeletonDetail } from '../components/ui/SkeletonCard'
import { StickyAddToCart } from '../components/ui/StickyAddToCart'
import { useCartDrawer } from '../context/CartDrawerContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { phonesService } from '../services/phones.service'
import type { Phone, PhoneColor } from '../types/phone'
import { comoError } from '../utils/errores'
import { formatCOP } from '../utils/formato'
import { registrarVisto } from '../utils/vistos'

const CONDITION_LABEL: Record<string, string> = {
  NEW: 'Nuevo',
  CERTIFIED: 'Reacondicionado certificado',
  USED: 'Usado verificado',
}

// Fotos de la galería: las del celular o, si no tiene, la imagen principal
function imagenesDe(phone: Phone): string[] {
  if (phone.images.length > 0) return phone.images.map((i) => i.url)
  return phone.heroImage ? [phone.heroImage] : []
}

// El servidor contesta 404 si el celular no existe (y 400 si el enlace está mal
// escrito). Cualquier otro fallo no significa "no existe", sino "no pude ver".
function esNoEncontrado(error: Error): boolean {
  const estado = axios.isAxiosError(error) ? error.response?.status : undefined
  return estado === 404 || estado === 400
}

/**
 * Ficha del celular de la URL.
 *
 * Cada celular monta su propia ficha (key = slug): al pasar de uno a otro
 * desde "También te puede interesar" (funcionalidad 13), React descarta el
 * estado del anterior (color, cantidad, foto elegida, "no encontrado") en
 * lugar de reutilizarlo. Antes se arrastraba y, por ejemplo, un iPhone en
 * Azul x3 hacía que el siguiente equipo, sin colores y con 1 en stock, se
 * agregara al carrito en Azul x3 (DEF-13-01, tests/regresion del front).
 *
 * Además vuelve al inicio de la página: las recomendaciones están al final de
 * la ficha y, sin esto, el cliente quedaba mirando el pie de la nueva.
 */
export function PhoneDetail() {
  const { slug = '' } = useParams<{ slug: string }>()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  return <FichaDelCelular key={slug} slug={slug} />
}

/** Fichas técnicas que el equipo sí tiene: lo que viene vacío no se muestra. */
function especificacionesDe(phone: Phone): { icon: JSX.Element; label: string; value: string }[] {
  const specs = [
    phone.chip && { icon: <Cpu size={14} aria-hidden="true" />, label: 'Procesador', value: phone.chip },
    phone.ram && { icon: <MemoryStick size={14} aria-hidden="true" />, label: 'RAM', value: phone.ram },
    phone.storage && { icon: <HardDrive size={14} aria-hidden="true" />, label: 'Almacenamiento', value: phone.storage },
    phone.camera && { icon: <Camera size={14} aria-hidden="true" />, label: 'Cámara', value: phone.camera },
    phone.screen && { icon: <Monitor size={14} aria-hidden="true" />, label: 'Pantalla', value: phone.screen },
    phone.battery && { icon: <Battery size={14} aria-hidden="true" />, label: 'Batería', value: phone.battery },
    phone.batteryHealth !== null && phone.condition !== 'NEW' && {
      icon: <Battery size={14} aria-hidden="true" />,
      label: 'Salud de batería',
      value: `${phone.batteryHealth}%`,
    },
  ]
  return specs.filter(Boolean) as { icon: JSX.Element; label: string; value: string }[]
}

function FichaDelCelular({ slug }: Readonly<{ slug: string }>) {
  const [phone, setPhone] = useState<Phone | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [intento, setIntento] = useState(0)
  const [selectedColor, setSelectedColor] = useState<PhoneColor | null>(null)
  const [selectedImg, setSelectedImg] = useState(0)
  const [qty, setQty] = useState(1)
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const { abrir: abrirCarrito, disponible: hayCarrito } = useCartDrawer()
  const idCantidad = useId()
  const idColor = useId()

  let titulo: string | null = null
  if (phone) titulo = phone.name
  else if (notFound) titulo = 'Celular no encontrado'
  useDocumentTitle(titulo)

  useEffect(() => {
    if (!slug) return
    let vigente = true
    setLoading(true)
    setError(null)
    phonesService
      .getBySlug(slug)
      .then((p) => {
        if (!vigente) return
        setPhone(p)
        if (p.colors.length > 0) setSelectedColor(p.colors[0])
        registrarVisto({ slug: p.slug, name: p.name, price: p.price, heroImage: p.heroImage })
      })
      .catch((e: unknown) => {
        if (!vigente) return
        const err = comoError(e)
        if (esNoEncontrado(err)) setNotFound(true)
        else setError(err)
      })
      .finally(() => {
        if (vigente) setLoading(false)
      })
    return () => {
      vigente = false
    }
  }, [slug, intento])

  const verCarrito = useCallback(
    () => (hayCarrito ? { etiqueta: 'Ver carrito', onClick: abrirCarrito } : undefined),
    [hayCarrito, abrirCarrito],
  )

  function handleAddToCart() {
    // Si el equipo tiene colores hay que elegir uno; si no tiene, se agrega sin
    // color. Antes se exigía color siempre y, en un equipo sin colores, el botón
    // quedaba activo pero no hacía nada.
    if (!phone || (phone.colors.length > 0 && !selectedColor)) return
    const agregadas = addToCart(phone, selectedColor, qty)

    if (agregadas === 0) {
      showToast(`Ya tienes en el carrito todas las unidades disponibles de ${phone.name}`, {
        tono: 'info',
        accion: verCarrito(),
      })
    } else if (agregadas < qty) {
      showToast(`Agregamos ${agregadas} de ${qty}: no hay más unidades de ${phone.name}`, {
        tono: 'info',
        accion: verCarrito(),
      })
    } else {
      showToast(`✓ ${phone.name} añadido al carrito`, { accion: verCarrito() })
    }
  }

  if (loading) return <SkeletonDetail />

  if (notFound)
    return (
      <div className="cp-container cp-notfound">
        <EmptyState
          icono={<PackageX size={56} />}
          titulo="Celular no encontrado"
          nivel={1}
          acciones={
            <Link to="/catalog" className="cp-btn cp-btn-primary">
              Volver al catálogo
            </Link>
          }
        >
          Puede que ya no esté a la venta o que el enlace tenga un error. En el catálogo encuentras equipos parecidos.
        </EmptyState>
      </div>
    )

  if (error || !phone)
    return (
      <div className="cp-container cp-notfound">
        <ErrorState
          titulo="No pudimos mostrar este celular"
          error={error}
          onReintentar={() => setIntento((n) => n + 1)}
          acciones={
            <Link to="/catalog" className="cp-btn cp-btn-secondary">
              Volver al catálogo
            </Link>
          }
        />
      </div>
    )

  const images = imagenesDe(phone)
  const enTope = qty >= phone.stock

  const specs = especificacionesDe(phone)

  return (
    <>
    <StickyAddToCart
      phone={phone}
      selectedColor={selectedColor}
      qty={qty}
      onAdd={handleAddToCart}
    />
    <div className="cp-container cp-reveal cp-detail-page">
      <Breadcrumbs
        migas={[
          { etiqueta: 'Inicio', to: '/' },
          { etiqueta: 'Catálogo', to: '/catalog' },
          { etiqueta: phone.name },
        ]}
      />

      {/* Solo se muestra lo que es verdad: el stock real, no un contador inventado */}
      {phone.stock > 0 && phone.stock <= 5 && (
        <div className="cp-detail-social-proof">
          <span className="cp-social-proof-urgency">
            <span aria-hidden="true">⚡</span> Solo <strong>{phone.stock}</strong> en stock
          </span>
        </div>
      )}

      <div className="cp-detail-grid">
        {/* Galería */}
        <div className="cp-detail-gallery">
          <div className="cp-detail-main-img">
            {images[selectedImg] ? (
              <img src={images[selectedImg]} alt={phone.name} />
            ) : (
              <div className="cp-detail-noimg" role="img" aria-label="Este equipo todavía no tiene fotos">
                📱
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="cp-detail-thumbnails">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  className={`cp-detail-thumb ${selectedImg === i ? 'active' : ''}`}
                  onClick={() => setSelectedImg(i)}
                  aria-label={`Ver imagen ${i + 1} de ${images.length}`}
                  aria-pressed={selectedImg === i}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="cp-detail-info">
          {/* Badges */}
          <div className="cp-detail-badges">
            <span className="cp-badge cp-badge-accent">
              {CONDITION_LABEL[phone.condition]}
            </span>
            {phone.verified && (
              <span className="cp-badge cp-badge-verified">
                <ShieldCheck size={12} aria-hidden="true" /> Verificado
              </span>
            )}
            {phone.badge && (
              <span className="cp-badge cp-badge-accent">{phone.badge}</span>
            )}
          </div>

          <div className="cp-detail-brand">{phone.brand}</div>

          <h1 className="cp-detail-name">{phone.name}</h1>

          <p className="cp-detail-short">{phone.shortDesc}</p>

          {/* Precio */}
          <div className="cp-detail-pricing">
            <div className="cp-detail-price">{formatCOP(phone.price)}</div>
            {phone.compareAt && phone.compareAt > phone.price && (
              <div className="cp-detail-compare">
                <span className="cp-sr-only">Precio anterior: </span>
                {formatCOP(phone.compareAt)}
              </div>
            )}
          </div>

          {/* Batería */}
          {phone.batteryHealth !== null && phone.condition !== 'NEW' && (
            <div className="cp-battery-bar-wrap">
              <div className="cp-battery-head">
                <span className="cp-mini-label">Salud de batería</span>
                <span className="cp-battery-value">{phone.batteryHealth}%</span>
              </div>
              {/* El valor ya está escrito arriba: la barra es solo el dibujo */}
              <div className="cp-battery-bar" aria-hidden="true">
                <div
                  className="cp-battery-fill"
                  style={{ width: `${phone.batteryHealth}%` }}
                />
              </div>
            </div>
          )}

          {/* Colores */}
          {phone.colors.length > 0 && (
            <div className="cp-detail-block" role="group" aria-labelledby={idColor}>
              <div className="cp-mini-label" id={idColor}>
                Color — {selectedColor?.name}
              </div>
              <div className="cp-color-row">
                {phone.colors.map((c) => (
                  <button
                    key={c.colorId}
                    type="button"
                    className={`cp-color-btn ${selectedColor?.colorId === c.colorId ? 'active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColor(c)}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={selectedColor?.colorId === c.colorId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div className="cp-detail-qty" role="group" aria-labelledby={idCantidad}>
            <div className="cp-mini-label" id={idCantidad}>
              Cantidad
            </div>
            <div className="cp-detail-qty-controls">
              <button
                type="button"
                className="cp-qty-btn"
                title="Quitar una unidad"
                aria-disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="cp-qty-value" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                className="cp-qty-btn"
                title={enTope ? 'No hay más unidades disponibles' : 'Sumar una unidad'}
                aria-disabled={enTope}
                onClick={() => setQty((q) => Math.min(phone.stock, q + 1))}
              >
                +
              </button>
            </div>
            {phone.stock <= 3 && phone.stock > 0 && (
              <span className="cp-stock-warn">
                Solo {phone.stock} disponibles
              </span>
            )}
          </div>

          {/* CTA */}
          {phone.stock > 0 ? (
            <button
              type="button"
              className="cp-btn cp-btn-primary cp-btn-buy"
              onClick={handleAddToCart}
              disabled={phone.colors.length > 0 && !selectedColor}
            >
              Agregar al carrito
            </button>
          ) : (
            <button type="button" className="cp-btn cp-btn-block cp-btn-soldout" disabled>
              Sin stock
            </button>
          )}

          {/* Trust badges */}
          <ul className="cp-detail-trust-badges">
            {[
              { icon: <ShieldCheck size={14} aria-hidden="true" />, label: 'IMEI limpio verificado' },
              { icon: <Truck size={14} aria-hidden="true" />, label: 'Envío en 24–48 h' },
              { icon: <RefreshCw size={14} aria-hidden="true" />, label: 'Garantía incluida' },
              { icon: <Lock size={14} aria-hidden="true" />, label: 'Pago 100% seguro' },
            ].map((b) => (
              <li key={b.label} className="cp-detail-trust-badge">
                <span className="cp-accent-icon">{b.icon}</span>
                <span>{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Specs */}
      {specs.length > 0 && (
        <section className="cp-detail-section" aria-labelledby="detalle-specs">
          <h2 className="cp-detail-h2" id="detalle-specs">
            Especificaciones
          </h2>
          <div className="cp-specs-grid">
            {specs.map((s) => (
              <div key={s.label} className="cp-spec-item">
                <div className="cp-spec-icon">{s.icon}</div>
                <div>
                  <div className="cp-spec-label">{s.label}</div>
                  <div className="cp-spec-value">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      {phone.features.length > 0 && (
        <section className="cp-detail-section" aria-labelledby="detalle-caracteristicas">
          <h2 className="cp-detail-h2" id="detalle-caracteristicas">
            Características
          </h2>
          <ul className="cp-features-list">
            {phone.features.map((f) => (
              <li key={f} className="cp-feature-item">
                <span className="cp-accent-icon" aria-hidden="true">✓</span> {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {phone.longDesc && (
        <section className="cp-detail-section cp-detail-desc" aria-labelledby="detalle-descripcion">
          <h2 className="cp-detail-h2" id="detalle-descripcion">
            Descripción
          </h2>
          <p className="cp-detail-long">{phone.longDesc}</p>
        </section>
      )}

      {/* Funcionalidad 13 — recomendaciones */}
      <SimilarPhones slug={phone.slug} />

      <RecentlyViewed excluir={[phone.slug]} />
    </div>
    </>
  )
}
