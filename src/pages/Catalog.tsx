import { SearchX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { PhoneCard } from '../components/phones/PhoneCard'
import { PhoneFilters } from '../components/phones/PhoneFilters'
import { RecentlyViewed } from '../components/phones/RecentlyViewed'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { OnboardingTip } from '../components/ui/OnboardingTip'
import { Pagination } from '../components/ui/Pagination'
import { RevealOnScroll } from '../components/ui/RevealOnScroll'
import { SkeletonGrid } from '../components/ui/SkeletonCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { phonesService } from '../services/phones.service'
import type { PhoneListItem, PhonesQuery } from '../types/phone'
import { aprenderVocabulario, sugerir, vocabularioCompleto } from '../utils/busqueda'
import { comoError, describirError } from '../utils/errores'
import { SIN_FILTROS, filtrosActivos } from '../utils/filtros'

// Escribir en el buscador o en el precio dispara una consulta por tecla; se
// espera un instante a que la persona termine antes de preguntarle al servidor.
const ESPERA_AL_ESCRIBIR_MS = 350
const CAMPOS_DE_TEXTO = ['search', 'maxPrice']

/** ¿Lo único que cambió entre las dos URL es lo que se escribe en un campo? */
function soloCambiaTexto(antes: string, ahora: string): boolean {
  const a = new URLSearchParams(antes)
  const b = new URLSearchParams(ahora)
  const claves = new Set([...a.keys(), ...b.keys()])
  const distintas = [...claves].filter((k) => a.get(k) !== b.get(k))
  return esEscritura(distintas)
}

/** Escribir cambia un campo de texto y, a lo sumo, regresa a la página 1. */
function esEscritura(clavesCambiadas: string[]): boolean {
  return (
    clavesCambiadas.some((k) => CAMPOS_DE_TEXTO.includes(k)) &&
    clavesCambiadas.every((k) => CAMPOS_DE_TEXTO.includes(k) || k === 'page')
  )
}

export function Catalog() {
  useDocumentTitle('Catálogo')
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const [phones, setPhones] = useState<PhoneListItem[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [intento, setIntento] = useState(0)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const urlAnterior = useRef<string | null>(null)

  const query: PhonesQuery = {
    page: Number(searchParams.get('page')) || 1,
    category: searchParams.get('category') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    condition: (searchParams.get('condition') as PhonesQuery['condition']) ?? undefined,
    verified: searchParams.get('verified') === 'true' ? true : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    search: searchParams.get('search') ?? undefined,
  }

  const claveUrl = searchParams.toString()

  useEffect(() => {
    // Si llega otra respuesta mientras esta viaja, esta se descarta: antes una
    // respuesta lenta podía pisar a una más nueva y mostrar resultados viejos.
    let vigente = true
    const previa = urlAnterior.current
    urlAnterior.current = claveUrl
    const escribiendo = previa !== null && soloCambiaTexto(previa, claveUrl)

    setLoading(true)
    setError(null)

    const pedir = () => {
      phonesService
        .getAll(query)
        .then((r) => {
          if (!vigente) return
          setPhones(r.data)
          setMeta(r.meta)
          // Lo que sí existe en la tienda sirve para corregir búsquedas mal escritas.
          aprenderVocabulario(r.data.flatMap((p) => [p.name, p.brand, p.category]))
        })
        .catch((e: unknown) => {
          if (vigente) setError(comoError(e))
        })
        .finally(() => {
          if (vigente) setLoading(false)
        })
    }

    if (!escribiendo) {
      pedir()
      return () => {
        vigente = false
      }
    }
    const espera = setTimeout(pedir, ESPERA_AL_ESCRIBIR_MS)
    return () => {
      vigente = false
      clearTimeout(espera)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveUrl, intento])

  // Venir desde el atajo "/" lleva el cursor directo al buscador.
  useEffect(() => {
    const estado = location.state as { enfocarBusqueda?: boolean } | null
    if (estado?.enfocarBusqueda) document.getElementById('filtro-buscar')?.focus()
  }, [location.state])

  function updateQuery(changes: Partial<PhonesQuery>) {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(changes)) {
      // undefined o '' borran el filtro de la URL
      const valor = String(v ?? '')
      if (valor === '') {
        next.delete(k)
      } else {
        next.set(k, valor)
      }
    }
    // Cada letra escrita no debe ser una entrada del historial: con "Atrás"
    // se saldría de la página, no se iría borrando letra por letra.
    setSearchParams(next, { replace: esEscritura(Object.keys(changes)) })
  }

  function quitarFiltro(cambio: Partial<PhonesQuery>) {
    updateQuery({ ...cambio, page: 1 })
    // El botón que se pulsó desaparece: el foco pasa al título para no perderse.
    tituloRef.current?.focus({ preventScroll: true })
  }

  function irAPagina(pagina: number) {
    updateQuery({ page: pagina })
    // Al cambiar de página se vuelve al principio de los resultados y el foco
    // va al título, no se queda en un botón "Siguiente" que ya no está ahí.
    setTimeout(() => {
      tituloRef.current?.focus({ preventScroll: true })
      tituloRef.current?.scrollIntoView?.({ block: 'start' })
    }, 0)
  }

  const activos = filtrosActivos(query)
  const hayDatos = phones.length > 0
  const sinResultados = !loading && !error && !hayDatos
  const primeraCarga = loading && !hayDatos && !error

  // Solo se calcula cuando hace falta: sin resultados y con una búsqueda escrita.
  const sugerencia = useMemo(
    () => (sinResultados && query.search ? sugerir(query.search, vocabularioCompleto()) : null),
    [sinResultados, query.search],
  )

  const descripcionError = describirError(error)

  return (
    <div className="cp-container cp-catalog-page">
      <Breadcrumbs migas={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Catálogo' }]} />

      <div className="cp-catalog-layout">
        <PhoneFilters query={query} onChange={updateQuery} />

        <div className="cp-catalog-main">
          <div className="cp-catalog-header">
            <h1 className="cp-catalog-title" ref={tituloRef} tabIndex={-1}>Catálogo</h1>
            {/* La región existe siempre; el texto aparece al terminar de cargar y se anuncia */}
            <span className="cp-catalog-count" aria-live="polite">
              {!loading && !error && `${meta.total} equipo${meta.total === 1 ? '' : 's'}`}
            </span>
          </div>

          <OnboardingTip />

          {activos.length > 0 && (
            <ul className="cp-chips" aria-label="Filtros activos">
              {activos.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="cp-chip"
                    aria-label={`Quitar filtro: ${f.etiqueta}`}
                    onClick={() => quitarFiltro(f.quitar)}
                  >
                    {f.etiqueta}
                    <X size={12} aria-hidden="true" />
                  </button>
                </li>
              ))}
              {activos.length > 1 && (
                <li>
                  <button type="button" className="cp-link-btn" onClick={() => quitarFiltro(SIN_FILTROS)}>
                    Quitar todos
                  </button>
                </li>
              )}
            </ul>
          )}

          {primeraCarga && <SkeletonGrid count={6} texto="Cargando catálogo…" />}

          {error && (
            <ErrorState
              titulo="No se pudo cargar el catálogo"
              error={error}
              detalle={
                descripcionError?.reintentable
                  ? undefined
                  : 'Algo en los filtros no es válido. Prueba viendo todo el catálogo.'
              }
              onReintentar={() => setIntento((n) => n + 1)}
              acciones={
                activos.length > 0 || query.page! > 1 ? (
                  <button type="button" className="cp-btn cp-btn-secondary" onClick={() => updateQuery(SIN_FILTROS)}>
                    Ver todo el catálogo
                  </button>
                ) : undefined
              }
            />
          )}

          {sinResultados && (
            <EmptyState
              icono={<SearchX size={44} />}
              titulo="Sin resultados para estos filtros."
              nivel={2}
              acciones={
                activos.length > 0 ? (
                  <button type="button" className="cp-btn cp-btn-secondary" onClick={() => updateQuery(SIN_FILTROS)}>
                    Ver todo el catálogo
                  </button>
                ) : undefined
              }
            >
              {sugerencia ? (
                <p>
                  ¿Quisiste decir{' '}
                  <button
                    type="button"
                    className="cp-link-btn cp-suggestion"
                    onClick={() => updateQuery({ search: sugerencia, page: 1 })}
                  >
                    {sugerencia}
                  </button>
                  ?
                </p>
              ) : (
                <p>
                  {activos.length > 1
                    ? 'Prueba quitando algún filtro: con tantos a la vez es difícil que un equipo cumpla todo.'
                    : 'Prueba con otra marca o con menos palabras.'}
                </p>
              )}
            </EmptyState>
          )}

          {!error && hayDatos && (
            <div className={loading ? 'cp-recargando' : undefined} aria-busy={loading}>
              {/* Para quien navega por títulos: sin él las fichas saltaban de h1 a h3 */}
              <h2 className="cp-sr-only">Equipos del catálogo</h2>
              <div className="cp-phones-grid">
                {phones.map((p, i) => (
                  <RevealOnScroll key={p.id} delay={(i % 3) * 0.07}>
                    <PhoneCard phone={p} />
                  </RevealOnScroll>
                ))}
              </div>
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onPage={irAPagina}
                etiqueta="Páginas del catálogo"
              />
            </div>
          )}

          <RecentlyViewed excluir={phones.map((p) => p.slug)} />
        </div>
      </div>
    </div>
  )
}
