import { SlidersHorizontal } from 'lucide-react'
import { useId, useState } from 'react'
import type { PhonesQuery } from '../../types/phone'
import { CATEGORIAS, CONDICIONES, MARCAS, SIN_FILTROS, filtrosActivos } from '../../utils/filtros'
import { formatCOP } from '../../utils/formato'
import { HelpTip } from '../ui/HelpTip'

interface PhoneFiltersProps {
  query: PhonesQuery
  onChange(q: Partial<PhonesQuery>): void
}

export function PhoneFilters({ query, onChange }: Readonly<PhoneFiltersProps>) {
  // En pantallas angostas el panel ocupa toda la primera pantalla; ahí se
  // pliega detrás de un botón. En pantallas anchas el botón no se ve.
  const [abierto, setAbierto] = useState(false)
  const idCuerpo = useId()
  const idAyudaBusqueda = useId()
  const cantidad = filtrosActivos(query).length

  return (
    <section className={`cp-filters ${abierto ? 'abierto' : ''}`} aria-label="Filtros del catálogo">
      <div className="cp-filters-head">
        <h2 className="cp-filters-title">Filtros</h2>
        <button
          type="button"
          className="cp-filters-toggle"
          aria-expanded={abierto}
          aria-controls={idCuerpo}
          onClick={() => setAbierto((v) => !v)}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          {abierto ? 'Ocultar filtros' : cantidad > 0 ? `Mostrar filtros (${cantidad})` : 'Mostrar filtros'}
        </button>
      </div>

      <div className="cp-filters-body" id={idCuerpo}>
        {/* Búsqueda */}
        <div className="cp-filter-group">
          <label className="cp-filter-label" htmlFor="filtro-buscar">Buscar</label>
          <input
            id="filtro-buscar"
            className="cp-input"
            type="text"
            placeholder="iPhone 15, Samsung S24..."
            autoComplete="off"
            inputMode="search"
            enterKeyHint="search"
            aria-describedby={idAyudaBusqueda}
            value={query.search ?? ''}
            onChange={(e) => onChange({ search: e.target.value || undefined, page: 1 })}
          />
          <p className="cp-field-hint" id={idAyudaBusqueda}>
            Marca o modelo. Tip: pulsa <kbd>/</kbd> desde cualquier página.
          </p>
        </div>

        {/* Condición */}
        <div className="cp-filter-group">
          <div className="cp-filter-label-row">
            <span className="cp-filter-label" id="filtro-condicion-etiqueta">Condición</span>
            <HelpTip nombre="¿Qué significa cada condición?">
              <strong>Nuevos:</strong> equipos sin uso. <strong>Certificados:</strong> reacondicionados, con garantía
              de 6 meses. <strong>Usados:</strong> con IMEI verificado y garantía de 30 días.
            </HelpTip>
          </div>
          <div className="cp-filter-pills" role="group" aria-labelledby="filtro-condicion-etiqueta">
            {CONDICIONES.map((c) => {
              const activo = (query.condition ?? '') === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  className={`cp-pill ${activo ? 'active' : ''}`}
                  aria-pressed={activo}
                  onClick={() =>
                    onChange({
                      condition: (c.value || undefined) as PhonesQuery['condition'],
                      page: 1,
                    })
                  }
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Categoría */}
        <div className="cp-filter-group">
          <label className="cp-filter-label" htmlFor="filtro-categoria">Categoría</label>
          <select
            id="filtro-categoria"
            className="cp-select"
            value={query.category ?? ''}
            onChange={(e) =>
              onChange({ category: e.target.value || undefined, page: 1 })
            }
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Marca */}
        <div className="cp-filter-group">
          <label className="cp-filter-label" htmlFor="filtro-marca">Marca</label>
          <select
            id="filtro-marca"
            className="cp-select"
            value={query.brand ?? ''}
            onChange={(e) =>
              onChange({ brand: e.target.value || undefined, page: 1 })
            }
          >
            {MARCAS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Solo verificados */}
        <div className="cp-filter-group">
          <label className="cp-filter-checkbox">
            <input
              type="checkbox"
              checked={query.verified === true}
              onChange={(e) =>
                onChange({ verified: e.target.checked || undefined, page: 1 })
              }
            />
            Solo verificados ✓
          </label>
        </div>

        {/* Precio */}
        <div className="cp-filter-group">
          <label className="cp-filter-label" htmlFor="filtro-precio-max">Precio máximo (COP)</label>
          <input
            id="filtro-precio-max"
            className="cp-input"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Ej: 3000000"
            aria-describedby="filtro-precio-lectura"
            value={query.maxPrice ?? ''}
            onChange={(e) =>
              onChange({
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
          />
          {/* Con tantos ceros es fácil equivocarse: se muestra el valor con puntos. */}
          <p className="cp-field-hint" id="filtro-precio-lectura">
            {query.maxPrice ? `Hasta ${formatCOP(query.maxPrice)}` : 'Escribe solo números, sin puntos.'}
          </p>
        </div>

        {/* Limpiar */}
        <button
          type="button"
          className="cp-btn cp-btn-ghost cp-btn-block"
          onClick={() => onChange(SIN_FILTROS)}
        >
          Limpiar filtros
        </button>
      </div>
    </section>
  )
}
