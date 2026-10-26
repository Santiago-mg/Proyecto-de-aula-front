import { Package, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Aviso } from '../components/ui/Aviso'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Loading } from '../components/ui/Loading'
import { RevealOnScroll } from '../components/ui/RevealOnScroll'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ordersService } from '../services/orders.service'
import type { Order } from '../types/order'
import { comoError } from '../utils/errores'
import { infoEstado, PASOS_PEDIDO } from '../utils/estados'
import { formatCOP, formatFecha } from '../utils/formato'

/** Barra de avance del pedido. Es un dibujo: el estado ya está escrito en la etiqueta. */
function Avance({ paso, etiqueta }: Readonly<{ paso: number; etiqueta: string }>) {
  if (paso === 0) return null
  return (
    <div
      className="cp-progress"
      role="img"
      aria-label={`Paso ${paso} de ${PASOS_PEDIDO}: ${etiqueta}`}
    >
      {Array.from({ length: PASOS_PEDIDO }, (_, i) => (
        <span key={i} className={`cp-progress-step ${i < paso ? 'hecho' : ''}`} />
      ))}
    </div>
  )
}

export function Dashboard() {
  useDocumentTitle('Mi cuenta')
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const cargar = useCallback(() => {
    let vigente = true
    setLoading(true)
    setError(null)
    ordersService
      .getMyOrders()
      .then((r) => {
        if (vigente) setOrders(r)
      })
      // Fallar no es lo mismo que no tener pedidos: antes un error del servidor
      // mostraba "Todavía no tienes pedidos" a gente que sí los tiene.
      .catch((e: unknown) => {
        if (vigente) setError(comoError(e))
      })
      .finally(() => {
        if (vigente) setLoading(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => cargar(), [cargar])

  // Al confirmar un pedido el checkout deja aquí su número (?order=CP-0042).
  // Solo se celebra si ese pedido existe en la lista del servidor: así un
  // enlace armado a mano no puede poner texto cualquiera en el aviso.
  const recien = searchParams.get('order')
  const pedidoNuevo = recien ? orders.find((o) => o.orderRef === recien) : undefined

  return (
    <div className="cp-container cp-dashboard">
      <Breadcrumbs migas={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Mi cuenta' }]} />

      {/* Cabecera */}
      <div className="cp-dashboard-head">
        <div className="cp-eyebrow">— Mi cuenta</div>
        <h1 className="cp-page-title">Hola, {user?.name.split(' ')[0]}</h1>
        <p className="cp-dashboard-email">{user?.email}</p>
      </div>

      {pedidoNuevo && (
        <Aviso tono="ok">
          {`¡Gracias por tu compra! Recibimos tu pedido ${pedidoNuevo.orderRef}. Aquí abajo puedes seguir su estado.`}
        </Aviso>
      )}

      {/* Mis pedidos */}
      <div className="cp-dashboard-orders-head">
        <h2 className="cp-dashboard-h2">Mis pedidos</h2>
        <Link to="/catalog" className="cp-btn cp-btn-secondary">
          Seguir comprando
        </Link>
      </div>

      {loading && <Loading text="Cargando pedidos..." />}

      {!loading && error && (
        <ErrorState
          titulo="No pudimos cargar tus pedidos"
          error={error}
          detalle="Tus pedidos están a salvo; solo no pudimos mostrarlos ahora. Vuelve a intentarlo."
          onReintentar={cargar}
        />
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icono={<Package size={48} />}
          titulo="Todavía no tienes pedidos"
          acciones={
            <Link to="/catalog" className="cp-btn cp-btn-primary">
              Ver catálogo →
            </Link>
          }
        >
          Cuando compres, aquí verás cada pedido con su estado.
        </EmptyState>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="cp-order-list">
          {orders.map((order, i) => {
            const estado = infoEstado(order.status)
            return (
              <RevealOnScroll key={order.id} delay={i * 0.06}>
                <article
                  className={`cp-order-card ${pedidoNuevo?.id === order.id ? 'nuevo' : ''}`}
                  aria-labelledby={`pedido-${order.id}`}
                >
                  <div className="cp-order-card-header">
                    <div>
                      <h3 className="cp-order-ref" id={`pedido-${order.id}`}>{order.orderRef}</h3>
                      <div className="cp-order-date">{formatFecha(order.createdAt)}</div>
                    </div>
                    <span
                      className="cp-badge cp-status"
                      style={{ '--estado': estado.color } as CSSProperties}
                    >
                      {estado.etiqueta}
                    </span>
                  </div>

                  <div className="cp-order-status-note">
                    <Avance paso={estado.paso} etiqueta={estado.etiqueta} />
                    {estado.ayuda && <p>{estado.ayuda}</p>}
                  </div>

                  <div className="cp-order-items">
                    {order.items.map((item) => (
                      <div key={item.id} className="cp-order-item">
                        {item.heroImage && (
                          <img src={item.heroImage} alt="" className="cp-order-item-img" />
                        )}
                        <div>
                          <div className="cp-order-item-name">{item.name}</div>
                          {item.colorName && (
                            <div className="cp-order-item-color">{item.colorName}</div>
                          )}
                          <div className="cp-order-item-qty">×{item.qty}</div>
                        </div>
                        <div className="cp-order-item-price">
                          {formatCOP(item.price * item.qty)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cp-order-delivery">
                    {`Entrega en ${order.address}, ${order.city}`}
                  </div>

                  <div className="cp-order-total">
                    <ShieldCheck size={14} aria-hidden="true" className="cp-accent-icon" />
                    <span className="cp-order-total-label">Total:</span>
                    <span className="cp-order-total-value">{formatCOP(order.total)}</span>
                  </div>
                </article>
              </RevealOnScroll>
            )
          })}
        </div>
      )}
    </div>
  )
}
