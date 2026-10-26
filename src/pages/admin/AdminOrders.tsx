import { useEffect, useState, type CSSProperties } from 'react'
import { useConfirmacion } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { Loading } from '../../components/ui/Loading'
import { Pagination } from '../../components/ui/Pagination'
import { useToastOpcional } from '../../context/ToastContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { adminService } from '../../services/admin.service'
import type { Order } from '../../types/order'
import { comoError } from '../../utils/errores'
import { ESTADOS_PEDIDO, infoEstado, ORDEN_ESTADOS } from '../../utils/estados'
import { formatPrecio } from '../../utils/formato'

/** Estados de los que un pedido ya no sale: hay que preguntar antes de dejarlo ahí. */
const ESTADOS_FINALES = new Set(['DELIVERED', 'CANCELLED'])

function textoTotal(total: number) {
  return total === 1 ? '1 orden en total' : `${total} órdenes totales`
}

export function AdminOrders() {
  useDocumentTitle('Administración · Órdenes')
  const avisar = useToastOpcional()
  const { pedir, dialogo } = useConfirmacion()
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [intento, setIntento] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [yaCargo, setYaCargo] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [errorCarga, setErrorCarga] = useState<Error | null>(null)
  const [errorAccion, setErrorAccion] = useState<Error | null>(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setErrorCarga(null)
    adminService
      .getAllOrders(page)
      .then((r) => {
        if (!vigente) return
        setOrders(r.data)
        setMeta(r.meta)
        setYaCargo(true)
      })
      .catch((err) => {
        if (vigente) setErrorCarga(comoError(err))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [page, intento])

  async function handleStatus(order: Order, status: string) {
    if (status === order.status) return

    // Entregado y cancelado no tienen vuelta atrás: el servidor ya no deja
    // cambiar el pedido, así que antes de dejarlo ahí se pregunta.
    if (ESTADOS_FINALES.has(status)) {
      const destino = ESTADOS_PEDIDO[status as keyof typeof ESTADOS_PEDIDO].etiqueta.toLowerCase()
      const sigue = await pedir({
        titulo: `Marcar como ${destino}`,
        mensaje: (
          <>
            El pedido <strong>{order.orderRef}</strong> quedará {destino} y ya no se podrá cambiar su estado.
          </>
        ),
        confirmar: `Sí, marcar como ${destino}`,
        cancelar: 'Volver',
        peligro: true,
      })
      if (!sigue) return
    }

    setUpdating(order.id)
    setErrorAccion(null)
    try {
      const updated = await adminService.updateOrderStatus(order.id, status)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      avisar.showToast(`Actualizamos el pedido ${updated.orderRef}: ${infoEstado(updated.status).etiqueta.toLowerCase()}.`)
    } catch (err) {
      // El select vuelve solo al estado anterior porque la orden no cambió
      setErrorAccion(comoError(err))
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="cp-admin-page">
      {dialogo}

      <div className="cp-admin-page-header">
        <div>
          <div className="cp-admin-page-eyebrow">— Gestión</div>
          <h1 className="cp-admin-page-title">Órdenes</h1>
        </div>
        {yaCargo && !errorCarga && <div className="cp-admin-count">{textoTotal(meta.total)}</div>}
      </div>

      {errorAccion && <ErrorMessage error={errorAccion} />}
      {errorCarga && <ErrorMessage error={errorCarga} onReintentar={() => setIntento((n) => n + 1)} />}

      {cargando && !yaCargo && <Loading text="Cargando órdenes..." />}

      {yaCargo && !errorCarga && (
        <>
          {cargando && (
            <p className="cp-actualizando" role="status">
              Actualizando la lista...
            </p>
          )}

          {orders.length === 0 ? (
            !cargando && (
              <EmptyState titulo="Todavía no hay órdenes">
                Cuando un cliente confirme una compra, el pedido aparecerá aquí.
              </EmptyState>
            )
          ) : (
            <div className="cp-admin-table-wrap" aria-busy={cargando}>
              <table className="cp-admin-table">
                <caption className="cp-sr-only">Órdenes de compra</caption>
                <thead>
                  <tr>
                    <th scope="col">Referencia</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Productos</th>
                    <th scope="col">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Cambiar estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const estado = infoEstado(order.status)
                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="cp-admin-ref">{order.orderRef}</span>
                        </td>
                        <td data-label="Cliente">
                          <div>
                            <div className="cp-admin-user-title">{order.name}</div>
                            <div className="cp-admin-email">{order.email}</div>
                            <div className="cp-admin-place">{order.city}, {order.dept}</div>
                          </div>
                        </td>
                        <td data-label="Productos">
                          <div className="cp-admin-items">
                            {order.items.map((item) => (
                              <div key={item.id} className="cp-admin-item">
                                {item.heroImage && (
                                  <img src={item.heroImage} alt="" className="cp-admin-thumb cp-admin-thumb-sm" />
                                )}
                                <span>{item.name} ×{item.qty}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="cp-admin-money" data-label="Total">{formatPrecio(order.total)}</td>
                        <td data-label="Estado">
                          <span
                            className="cp-badge cp-status"
                            style={{ '--estado': estado.color } as CSSProperties}
                          >
                            {estado.etiqueta}
                          </span>
                        </td>
                        <td className="cp-admin-mono cp-admin-soft" data-label="Fecha">
                          <time dateTime={order.createdAt}>
                            {new Date(order.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </time>
                        </td>
                        <td data-label="Cambiar estado">
                          <select
                            className="cp-select cp-select-sm"
                            aria-label={`Estado del pedido ${order.orderRef}`}
                            value={order.status}
                            disabled={updating === order.id}
                            onChange={(e) => handleStatus(order, e.target.value)}
                          >
                            {ORDEN_ESTADOS.map((s) => (
                              <option key={s} value={s}>{ESTADOS_PEDIDO[s].etiqueta}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} etiqueta="Páginas de órdenes" />
        </>
      )}
    </div>
  )
}
