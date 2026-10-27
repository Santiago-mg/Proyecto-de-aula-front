import { Link } from 'react-router-dom'
import { AlertBadge } from '../../components/admin/AlertBadge'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { Loading } from '../../components/ui/Loading'
import { useAlertas } from '../../hooks/useAlertas'

const FECHA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

// Alertas de inventario: qué celulares llegaron a su mínimo y cuáles se agotaron.
export function AdminAlerts() {
  const { alertas, cargando, error, recargar } = useAlertas()
  const sinStock = alertas.filter((a) => a.type === 'OUT_OF_STOCK').length
  const pocoStock = alertas.length - sinStock

  return (
    <div className="cp-admin-page">
      <div className="cp-admin-page-header">
        <div>
          <div className="cp-admin-page-eyebrow">— Inventario</div>
          <h1 className="cp-admin-page-title">Alertas de inventario</h1>
          <p className="cp-field-hint" style={{ marginTop: 8 }}>
            Se abre una alerta cuando el stock de un celular llega a su mínimo y se cierra sola
            cuando lo repones.
          </p>
        </div>
      </div>

      {cargando && <Loading />}

      {!cargando && error && (
        <div>
          <ErrorMessage error={error} />
          <button className="cp-btn cp-btn-secondary" style={{ marginTop: 16 }} onClick={recargar}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && alertas.length === 0 && (
        <p role="status" id="alertas-vacio" className="cp-alert-empty">
          No hay alertas abiertas: el inventario está por encima de los mínimos.
        </p>
      )}

      {!cargando && !error && alertas.length > 0 && (
        <>
          <p role="status" id="alertas-resumen" className="cp-alert-summary">
            {sinStock} sin stock · {pocoStock} con poco stock
          </p>
          <ul id="alertas-lista" className="cp-alert-list">
            {alertas.map((a) => (
              <li
                key={a.id}
                className="cp-alert-item"
                data-testid="alerta"
                data-alert-type={a.type}
              >
                <div className="cp-alert-main">
                  <AlertBadge type={a.type} />
                  <strong className="cp-alert-name">{a.phone.name}</strong>
                  <span className="cp-alert-message">{a.message}</span>
                  <span className="cp-alert-meta">
                    Stock {a.phone.stock} · Mínimo {a.phone.minStock} ·{' '}
                    <time dateTime={a.createdAt}>{FECHA.format(new Date(a.createdAt))}</time>
                  </span>
                </div>
                <Link
                  to={`/admin/phones/${a.phone.id}/edit`}
                  className="cp-btn cp-btn-secondary"
                  aria-label={`Reponer ${a.phone.name}`}
                >
                  Reponer
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
