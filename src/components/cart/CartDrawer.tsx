import { Trash2, Undo2, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type HTMLAttributes } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import type { CartItem } from '../../types/order'
import { formatCOP } from '../../utils/formato'
import { UMBRAL_ENVIO_GRATIS, calcularTotales } from '../../utils/pricing'

interface CartDrawerProps {
  open: boolean
  onClose(): void
}

/** Lo último que se quitó, para poder devolverlo con "Deshacer". */
interface Quitado {
  items: CartItem[]
  indice: number
  mensaje: string
}

/** A dónde debe ir el foco cuando el carrito cambia de forma. */
type DestinoFoco = { tipo: 'vecino'; indice: number } | { tipo: 'linea'; clave: string }

// React 18 todavía no conoce `inert` en sus tipos; se pasa como atributo suelto.
const INERTE = { inert: '' } as unknown as HTMLAttributes<HTMLDivElement>

const idSeguro = (clave: string) => clave.replace(/\s+/g, '_')

export function CartDrawer({ open, onClose }: Readonly<CartDrawerProps>) {
  const { cart, totalItems, removeFromCart, updateQty, clearCart, restaurar, maxQty } = useCart()
  const navigate = useNavigate()
  const base = useId()
  const cajaRef = useRef<HTMLDivElement>(null)
  const [quitado, setQuitado] = useState<Quitado | null>(null)
  const [anuncio, setAnuncio] = useState('')
  const destinoFoco = useRef<DestinoFoco | null>(null)

  useFocusTrap(cajaRef, open, { alEscapar: onClose })

  // Al cerrar el carrito, el "Deshacer" pendiente ya no tiene a qué volver.
  useEffect(() => {
    if (!open) {
      setQuitado(null)
      setAnuncio('')
    }
  }, [open])

  // Después de quitar o devolver algo, el botón que tenía el foco desapareció:
  // se lleva el foco a un lugar útil en vez de dejarlo perdido en la página.
  useEffect(() => {
    const destino = destinoFoco.current
    const caja = cajaRef.current
    if (!destino || !caja) return
    destinoFoco.current = null

    const quitar = [...caja.querySelectorAll<HTMLElement>('[data-quitar]')]
    let objetivo: HTMLElement | undefined
    if (destino.tipo === 'linea') {
      objetivo = quitar.find((b) => b.dataset.quitar === destino.clave)
    } else {
      objetivo = quitar[Math.min(destino.indice, quitar.length - 1)]
    }
    objetivo ??= caja.querySelector<HTMLElement>('[data-deshacer]') ?? caja.querySelector<HTMLElement>('[data-vacio]') ?? undefined
    objetivo?.focus()
  }, [cart])

  const { subtotal, shipping, total } = calcularTotales(cart)
  const faltan = Math.max(0, UMBRAL_ENVIO_GRATIS + 1 - subtotal)
  const avance = Math.min(100, Math.round((subtotal / (UMBRAL_ENVIO_GRATIS + 1)) * 100))

  function goToCheckout() {
    onClose()
    navigate('/checkout')
  }

  function irAlCatalogo() {
    onClose()
    navigate('/catalog')
  }

  function quitar(item: CartItem) {
    const indice = cart.findIndex((i) => i.key === item.key)
    setQuitado({ items: [item], indice, mensaje: `Quitaste ${item.name} del carrito.` })
    destinoFoco.current = { tipo: 'vecino', indice }
    removeFromCart(item.key)
  }

  function vaciar() {
    setQuitado({ items: cart, indice: 0, mensaje: 'Vaciaste el carrito.' })
    destinoFoco.current = { tipo: 'vecino', indice: 0 }
    clearCart()
  }

  function deshacer() {
    if (!quitado) return
    restaurar(quitado.items, quitado.indice)
    destinoFoco.current = { tipo: 'linea', clave: quitado.items[0].key }
    setQuitado(null)
  }

  function cambiarCantidad(item: CartItem, nueva: number) {
    const max = maxQty(item.key)
    if (nueva < 1 || (max !== null && nueva > max)) return
    updateQty(item.key, nueva)
    setAnuncio(`${item.name}: ${nueva} ${nueva === 1 ? 'unidad' : 'unidades'}.`)
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="cp-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer: cerrado queda fuera del orden de tabulación y de los lectores */}
      <div
        ref={cajaRef}
        className={`cp-drawer ${open ? 'open' : ''}`}
        role="dialog"
        aria-label="Carrito"
        aria-modal={open ? 'true' : undefined}
        tabIndex={-1}
        {...(open ? {} : INERTE)}
      >
        <div className="cp-drawer-header">
          <h2 className="cp-drawer-title">
            Carrito <span className="cp-drawer-count">({totalItems})</span>
          </h2>
          <button className="cp-icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Siempre presentes para que el lector de pantalla anuncie los cambios */}
        <div className="cp-undo" role="status" aria-live="polite">
          {quitado && (
            <>
              <span>{quitado.mensaje}</span>
              <button type="button" className="cp-undo-btn" data-deshacer onClick={deshacer}>
                <Undo2 size={14} aria-hidden="true" /> Deshacer
              </button>
            </>
          )}
        </div>
        <div className="cp-sr-only" role="status" aria-live="polite">
          {anuncio}
        </div>

        {cart.length === 0 ? (
          <div className="cp-drawer-empty">
            <div className="cp-drawer-empty-icon" aria-hidden="true">📱</div>
            <p>Tu carrito está vacío</p>
            <button
              className="cp-btn cp-btn-primary"
              data-vacio
              onClick={irAlCatalogo}
            >
              Ver celulares
            </button>
          </div>
        ) : (
          <>
            <div className="cp-drawer-items">
              {cart.map((item) => {
                const idNombre = `${base}-n-${idSeguro(item.key)}`
                const idNota = `${base}-t-${idSeguro(item.key)}`
                const max = maxQty(item.key)
                const enTope = max !== null && item.qty >= max
                return (
                  <div key={item.key} className="cp-drawer-item">
                    {item.heroImage && (
                      // El nombre ya está escrito al lado: la imagen es decorativa.
                      <img src={item.heroImage} alt="" className="cp-drawer-item-img" />
                    )}
                    <div className="cp-drawer-item-info">
                      <div className="cp-drawer-item-name" id={idNombre}>{item.name}</div>
                      {item.colorName && (
                        <div className="cp-drawer-item-color">
                          {item.colorName}
                        </div>
                      )}
                      <div className="cp-drawer-item-price">
                        {formatCOP(item.price)}
                      </div>
                      <div className="cp-drawer-item-controls">
                        <button
                          type="button"
                          className="cp-qty-btn"
                          title="Quitar una unidad"
                          aria-describedby={idNombre}
                          aria-disabled={item.qty <= 1}
                          onClick={() => cambiarCantidad(item, item.qty - 1)}
                        >
                          −
                        </button>
                        <span className="cp-qty-value">{item.qty}</span>
                        <button
                          type="button"
                          className="cp-qty-btn"
                          title={enTope ? `Solo hay ${max} disponibles` : 'Sumar una unidad'}
                          aria-describedby={enTope ? `${idNombre} ${idNota}` : idNombre}
                          aria-disabled={enTope}
                          onClick={() => cambiarCantidad(item, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      {enTope && (
                        <div className="cp-qty-note" id={idNota}>
                          Solo hay {max} {max === 1 ? 'disponible' : 'disponibles'}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="cp-icon-btn cp-drawer-remove"
                      data-quitar={item.key}
                      onClick={() => quitar(item)}
                      aria-label="Eliminar"
                      aria-describedby={idNombre}
                      title="Quitar del carrito"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="cp-drawer-footer">
              <div className="cp-shipbar">
                <p className="cp-shipbar-text">
                  {shipping === 0 ? (
                    <>
                      <strong>¡Listo!</strong> Tu envío es gratis.
                    </>
                  ) : (
                    <>
                      Te faltan <strong>{formatCOP(faltan)}</strong> para el envío gratis.
                    </>
                  )}
                </p>
                <div className="cp-shipbar-track" aria-hidden="true">
                  <div className="cp-shipbar-fill" style={{ width: `${avance}%` }} />
                </div>
              </div>

              <div className="cp-drawer-totals">
                <div className="cp-drawer-row">
                  <span>Subtotal</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                <div className="cp-drawer-row">
                  <span>Envío</span>
                  <span>
                    {shipping === 0 ? '¡Gratis!' : formatCOP(shipping)}
                  </span>
                </div>
                <div className="cp-drawer-row cp-drawer-total">
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>
              <button
                className="cp-btn cp-btn-primary cp-btn-block"
                onClick={goToCheckout}
              >
                Proceder al pago →
              </button>
              <button
                className="cp-btn cp-btn-ghost cp-btn-block"
                onClick={vaciar}
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
