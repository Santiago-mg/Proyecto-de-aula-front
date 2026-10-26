import { useState } from 'react'
import { Link } from 'react-router-dom'
import { borrarVistos, leerVistos } from '../../utils/vistos'
import { formatCOP } from '../../utils/formato'

interface RecentlyViewedProps {
  /** Slugs que ya están a la vista en la página (no tiene sentido repetirlos). */
  excluir?: string[]
  maximo?: number
}

/**
 * Los últimos equipos que la persona abrió. Si no hay ninguno que mostrar, no
 * ocupa espacio. El botón "Borrar historial" deja la decisión en sus manos.
 */
export function RecentlyViewed({ excluir = [], maximo = 4 }: Readonly<RecentlyViewedProps>) {
  const [vistos, setVistos] = useState(leerVistos)
  const visibles = vistos.filter((v) => !excluir.includes(v.slug)).slice(0, maximo)

  if (visibles.length === 0) return null

  return (
    <section className="cp-recent" aria-labelledby="vistos-titulo">
      <div className="cp-recent-head">
        <h2 id="vistos-titulo" className="cp-recent-title">
          Vistos recientemente
        </h2>
        <button
          type="button"
          className="cp-link-btn"
          onClick={() => {
            borrarVistos()
            setVistos([])
          }}
        >
          Borrar historial
        </button>
      </div>
      <ul className="cp-recent-list">
        {visibles.map((v) => (
          <li key={v.slug}>
            <Link to={`/phones/${v.slug}`} className="cp-recent-item">
              {v.heroImage ? (
                <img src={v.heroImage} alt="" loading="lazy" />
              ) : (
                <span className="cp-recent-ph" aria-hidden="true">📱</span>
              )}
              <span className="cp-recent-name">{v.name}</span>
              <span className="cp-recent-price">{formatCOP(v.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
