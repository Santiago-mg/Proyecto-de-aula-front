import {
  Package,
  ShieldOff,
  ShoppingCart,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loading } from '../../components/ui/Loading'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { adminService } from '../../services/admin.service'
import type { AdminStats } from '../../types/admin'
import { ESTADOS_PEDIDO, infoEstado } from '../../utils/estados'
import { formatCOPCorto, formatDiaCorto } from '../../utils/formato'

/** El mensaje que verá el administrador según lo que falló. */
function mensajeDeFallo(err: unknown): string {
  const e = err as {
    code?: string
    message?: string
    response?: { status?: number; data?: { detail?: string; error?: string } }
  } | null
  const status = e?.response?.status
  if (status === 401 || status === 403) {
    return 'Sin permisos. Verifica que estés logueado como admin.'
  }
  if (!navigator.onLine || e?.code === 'ERR_NETWORK') {
    return 'No se puede conectar al backend. ¿Está corriendo en localhost:3001?'
  }
  return e?.response?.data?.detail ?? e?.response?.data?.error ?? e?.message ?? 'Error desconocido'
}

export function AdminDashboard() {
  useDocumentTitle('Administración · Resumen')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    let vigente = true
    setLoading(true)
    setError(null)
    adminService
      .getStats()
      .then((r) => {
        if (vigente) setStats(r)
      })
      .catch((err) => {
        if (vigente) setError(mensajeDeFallo(err))
      })
      .finally(() => {
        if (vigente) setLoading(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => cargar(), [cargar])

  if (loading) return <Loading text="Cargando estadísticas..." />

  if (error || !stats) {
    return (
      <ErrorState
        titulo="No se pudieron cargar las estadísticas"
        detalle={error ?? 'Respuesta vacía del servidor'}
        onReintentar={cargar}
      />
    )
  }

  const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.amount), 1)

  const repartoDeOrdenes: [keyof typeof ESTADOS_PEDIDO, number][] = [
    ['PENDING', stats.orders.pending],
    ['CONFIRMED', stats.orders.confirmed],
    ['SHIPPED', stats.orders.shipped],
    ['DELIVERED', stats.orders.delivered],
    ['CANCELLED', stats.orders.cancelled],
  ]

  return (
    <div className="cp-admin-page">
      {/* Header */}
      <div className="cp-admin-page-header">
        <div>
          <div className="cp-admin-page-eyebrow">— Panel principal</div>
          <h1 className="cp-admin-page-title">Dashboard</h1>
        </div>
        <div className="cp-admin-actions">
          <Link to="/admin/phones/new" className="cp-btn cp-btn-primary">
            <Zap size={14} aria-hidden="true" /> Nuevo celular
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="cp-admin-kpi-grid">
        <div className="cp-kpi-card cp-kpi-cyan">
          <div className="cp-kpi-icon" aria-hidden="true"><TrendingUp size={22} /></div>
          <div className="cp-kpi-value">{formatCOPCorto(stats.orders.revenue)}</div>
          <div className="cp-kpi-label">Revenue total</div>
          <div className="cp-kpi-sub">
            {formatCOPCorto(stats.orders.revenueThisMonth)} este mes
          </div>
        </div>
        <div className="cp-kpi-card cp-kpi-violet">
          <div className="cp-kpi-icon" aria-hidden="true"><ShoppingCart size={22} /></div>
          <div className="cp-kpi-value">{stats.orders.total}</div>
          <div className="cp-kpi-label">Órdenes totales</div>
          <div className="cp-kpi-sub">
            {stats.orders.delivered} entregadas · {stats.orders.shipped} en camino
          </div>
        </div>
        <div className="cp-kpi-card cp-kpi-green">
          <div className="cp-kpi-icon" aria-hidden="true"><Users size={22} /></div>
          <div className="cp-kpi-value">{stats.users.total}</div>
          <div className="cp-kpi-label">Usuarios</div>
          <div className="cp-kpi-sub">
            +{stats.users.newThisWeek} esta semana · {stats.users.banned} baneados
          </div>
        </div>
        <div className="cp-kpi-card cp-kpi-orange">
          <div className="cp-kpi-icon" aria-hidden="true"><Package size={22} /></div>
          <div className="cp-kpi-value">{stats.phones.total}</div>
          <div className="cp-kpi-label">Celulares en catálogo</div>
          <div className="cp-kpi-sub">
            {stats.phones.inStock} en stock · {stats.phones.verified} verificados
          </div>
        </div>
      </div>

      <div className="cp-admin-grid-2">
        {/* Revenue chart */}
        <section className="cp-admin-card" aria-labelledby="titulo-revenue">
          <div className="cp-admin-card-header">
            <h2 className="cp-admin-card-title" id="titulo-revenue">Revenue — últimos 7 días</h2>
          </div>
          <div className="cp-revenue-chart">
            {stats.revenueByDay.map((day) => (
              <div
                key={day.date}
                className="cp-revenue-bar-wrap"
                role="img"
                aria-label={`${day.date}: ${day.amount > 0 ? formatCOPCorto(day.amount) : 'sin ventas'}`}
              >
                <div className="cp-revenue-bar-track">
                  <div
                    className="cp-revenue-bar-fill"
                    style={{ height: `${(day.amount / maxRevenue) * 100}%` }}
                  />
                </div>
                <div className="cp-revenue-bar-label">{formatDiaCorto(day.date)}</div>
                {day.amount > 0 && (
                  <div className="cp-revenue-bar-value">
                    {formatCOPCorto(day.amount)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Reparto de las órdenes por estado */}
        <section className="cp-admin-card" aria-labelledby="titulo-estados">
          <div className="cp-admin-card-header">
            <h2 className="cp-admin-card-title" id="titulo-estados">Estado de órdenes</h2>
          </div>
          <div className="cp-order-status-list">
            {repartoDeOrdenes.map(([status, count]) => {
              const pct =
                stats.orders.total > 0
                  ? Math.round((count / stats.orders.total) * 100)
                  : 0
              const { etiqueta, color } = ESTADOS_PEDIDO[status]
              return (
                <div key={status} className="cp-order-status-row">
                  <div className="cp-order-status-info">
                    <span
                      className="cp-order-status-dot"
                      style={{ background: color }}
                      aria-hidden="true"
                    />
                    <span>{etiqueta}</span>
                  </div>
                  <div className="cp-order-status-bar-wrap">
                    <div className="cp-order-status-bar" aria-hidden="true">
                      <div
                        className="cp-order-status-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span className="cp-order-status-count">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Órdenes recientes */}
      <section className="cp-admin-card cp-admin-card-spaced" aria-labelledby="titulo-recientes">
        <div className="cp-admin-card-header">
          <h2 className="cp-admin-card-title" id="titulo-recientes">Órdenes recientes</h2>
          <Link to="/admin/orders" className="cp-btn cp-btn-ghost cp-btn-sm">
            Ver todas →
          </Link>
        </div>
        <div className="cp-admin-table-wrap cp-admin-table-flush">
          <table className="cp-admin-table">
            <caption className="cp-sr-only">Últimas órdenes recibidas</caption>
            <thead>
              <tr>
                <th scope="col">Referencia</th>
                <th scope="col">Cliente</th>
                <th scope="col">Productos</th>
                <th scope="col">Total</th>
                <th scope="col">Estado</th>
                <th scope="col">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => {
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
                      </div>
                    </td>
                    <td className="cp-admin-mono" data-label="Productos">
                      {order.itemCount} ítem{order.itemCount === 1 ? '' : 's'}
                    </td>
                    <td className="cp-admin-money" data-label="Total">{formatCOPCorto(order.total)}</td>
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
                        {new Date(order.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </time>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Resumen del inventario y de los usuarios */}
      <div className="cp-admin-grid-3 cp-admin-card-spaced">
        <div className="cp-admin-mini-stat">
          <div className="cp-admin-mini-stat-num cp-tone-accent">
            {stats.phones.verified}
          </div>
          <div className="cp-admin-mini-stat-label">Celulares verificados ✓</div>
        </div>
        <div className="cp-admin-mini-stat">
          <div className="cp-admin-mini-stat-num cp-tone-bad">
            {stats.phones.outOfStock}
          </div>
          <div className="cp-admin-mini-stat-label">Sin stock</div>
        </div>
        <div className="cp-admin-mini-stat">
          <div className="cp-admin-mini-stat-num cp-tone-violet">
            {stats.users.banned > 0 ? (
              <span className="cp-admin-mini-stat-icon">
                <ShieldOff size={20} aria-hidden="true" /> {stats.users.banned}
              </span>
            ) : (
              '0'
            )}
          </div>
          <div className="cp-admin-mini-stat-label">Usuarios baneados</div>
        </div>
      </div>
    </div>
  )
}
