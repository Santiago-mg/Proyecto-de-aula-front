import { useCallback, useEffect, useState } from 'react'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loading } from '../../components/ui/Loading'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { adminService } from '../../services/admin.service'
import type { AdminStats as StatsType } from '../../types/admin'
import { comoError } from '../../utils/errores'
import { formatCOP, formatDiaCorto } from '../../utils/formato'

// "—" si no hubo ventas ese día, "1 venta" o "N ventas" si las hubo
function etiquetaVentas(count: number) {
  if (count <= 0) return '—'
  return count === 1 ? '1 venta' : `${count} ventas`
}

// Lo mismo para quien escucha la gráfica: "—" no se lee como "sin ventas".
function ventasHabladas(count: number) {
  if (count <= 0) return 'sin ventas'
  return count === 1 ? '1 venta' : `${count} ventas`
}

type Tono = 'accent' | 'ok' | 'violet' | 'bad' | 'warn' | 'ink'

interface Fila {
  etiqueta: string
  valor: string | number
  tono: Tono
  /** Montos en pesos: se ven en la fuente de números. */
  monto?: boolean
}

// Una tarjeta con pares "etiqueta → valor". Es una lista de definiciones, así
// el lector de pantalla une cada número con su nombre.
function TarjetaDetalle({ titulo, filas }: Readonly<{ titulo: string; filas: Fila[] }>) {
  return (
    <section className="cp-admin-card" aria-label={titulo}>
      <div className="cp-admin-card-header">
        <h2 className="cp-admin-card-title">{titulo}</h2>
      </div>
      <dl className="cp-stats-detail-list">
        {filas.map((fila) => (
          <div key={fila.etiqueta} className="cp-stats-detail-row">
            <dt className="cp-stats-detail-label">{fila.etiqueta}</dt>
            <dd className={`cp-stats-detail-value cp-tone-${fila.tono} ${fila.monto ? 'cp-stats-money' : ''}`}>
              {fila.valor}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function AdminStats() {
  useDocumentTitle('Administración · Estadísticas')
  const [stats, setStats] = useState<StatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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
        if (vigente) {
          setStats(null)
          setError(comoError(err))
        }
      })
      .finally(() => {
        if (vigente) setLoading(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => cargar(), [cargar])

  if (loading) return <Loading text="Calculando estadísticas..." />
  if (!stats) {
    return (
      <ErrorState
        titulo="No se pudieron cargar las estadísticas"
        error={error}
        detalle="Inténtalo de nuevo en un momento."
        onReintentar={cargar}
      />
    )
  }

  const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.amount), 1)

  return (
    <div className="cp-admin-page">
      <div className="cp-admin-page-header">
        <div>
          <div className="cp-admin-page-eyebrow">— Análisis</div>
          <h1 className="cp-admin-page-title">Estadísticas</h1>
        </div>
      </div>

      {/* Revenue 7 días - gráfico grande */}
      <section className="cp-admin-card cp-admin-card-gap" aria-labelledby="titulo-revenue-semana">
        <div className="cp-admin-card-header">
          <h2 className="cp-admin-card-title" id="titulo-revenue-semana">Revenue últimos 7 días</h2>
          <div className="cp-stats-total">
            {formatCOP(stats.revenueByDay.reduce((a, d) => a + d.amount, 0))}
          </div>
        </div>
        <div className="cp-revenue-chart cp-revenue-chart-lg">
          {stats.revenueByDay.map((day) => (
            <div
              key={day.date}
              className="cp-revenue-bar-wrap"
              role="img"
              aria-label={`${day.date}: ${ventasHabladas(day.count)}`}
            >
              <div className="cp-revenue-bar-track">
                <div
                  className="cp-revenue-bar-fill"
                  style={{ height: `${(day.amount / maxRevenue) * 100}%` }}
                />
              </div>
              <div className="cp-revenue-bar-label">{formatDiaCorto(day.date)}</div>
              <div className="cp-revenue-bar-value">
                {etiquetaVentas(day.count)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="cp-admin-grid-2">
        <TarjetaDetalle
          titulo="Usuarios"
          filas={[
            { etiqueta: 'Total registrados', valor: stats.users.total, tono: 'accent' },
            { etiqueta: 'Nuevos esta semana', valor: stats.users.newThisWeek, tono: 'ok' },
            { etiqueta: 'Administradores', valor: stats.users.admins, tono: 'violet' },
            { etiqueta: 'Baneados', valor: stats.users.banned, tono: 'bad' },
          ]}
        />

        <TarjetaDetalle
          titulo="Inventario"
          filas={[
            { etiqueta: 'Total en catálogo', valor: stats.phones.total, tono: 'accent' },
            { etiqueta: 'Con stock disponible', valor: stats.phones.inStock, tono: 'ok' },
            { etiqueta: 'Verificados ✓', valor: stats.phones.verified, tono: 'accent' },
            { etiqueta: 'Sin stock', valor: stats.phones.outOfStock, tono: 'bad' },
          ]}
        />

        <TarjetaDetalle
          titulo="Órdenes"
          filas={[
            { etiqueta: 'Total órdenes', valor: stats.orders.total, tono: 'ink' },
            { etiqueta: 'Pendientes', valor: stats.orders.pending, tono: 'warn' },
            { etiqueta: 'Confirmadas', valor: stats.orders.confirmed, tono: 'accent' },
            { etiqueta: 'En camino', valor: stats.orders.shipped, tono: 'violet' },
            { etiqueta: 'Entregadas', valor: stats.orders.delivered, tono: 'ok' },
            { etiqueta: 'Canceladas', valor: stats.orders.cancelled, tono: 'bad' },
          ]}
        />

        <TarjetaDetalle
          titulo="Revenue"
          filas={[
            { etiqueta: 'Revenue total histórico', valor: formatCOP(stats.orders.revenue), tono: 'accent', monto: true },
            { etiqueta: 'Revenue este mes', valor: formatCOP(stats.orders.revenueThisMonth), tono: 'ok', monto: true },
          ]}
        />
      </div>
    </div>
  )
}
