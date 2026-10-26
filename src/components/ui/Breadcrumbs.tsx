import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface Miga {
  etiqueta: string
  /** Sin destino = es la página actual */
  to?: string
}

/**
 * "Inicio › Catálogo › iPhone 15": dice dónde está el usuario y permite subir
 * un nivel sin usar el botón Atrás del navegador (heurística 1 y 3).
 */
export function Breadcrumbs({ migas }: Readonly<{ migas: Miga[] }>) {
  return (
    <nav aria-label="Ruta de navegación" className="cp-breadcrumbs">
      <ol>
        {migas.map((m, i) => {
          const ultima = i === migas.length - 1
          return (
            <li key={`${m.etiqueta}-${i}`}>
              {m.to && !ultima ? (
                <Link to={m.to}>{m.etiqueta}</Link>
              ) : (
                <span aria-current={ultima ? 'page' : undefined}>{m.etiqueta}</span>
              )}
              {!ultima && <ChevronRight size={12} aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
