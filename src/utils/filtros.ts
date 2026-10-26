import type { PhonesQuery } from '../types/phone'
import { formatCOP } from './formato'

// Opciones de los filtros del catálogo. Viven aquí (y no dentro del componente)
// para que el panel de filtros y las etiquetas de "filtros activos" hablen
// exactamente igual: si cambia un nombre, cambia en los dos sitios.

export const CONDICIONES = [
  { value: '', label: 'Todos' },
  { value: 'NEW', label: 'Nuevos' },
  { value: 'CERTIFIED', label: 'Certificados' },
  { value: 'USED', label: 'Usados' },
]

export const MARCAS = [
  { value: '', label: 'Todas las marcas' },
  { value: 'Apple', label: 'Apple (iPhone)' },
  { value: 'Samsung', label: 'Samsung' },
  { value: 'Xiaomi', label: 'Xiaomi' },
  { value: 'Motorola', label: 'Motorola' },
]

export const CATEGORIAS = [
  { value: '', label: 'Todas las categorías' },
  { value: 'apple', label: 'iPhone' },
  { value: 'samsung', label: 'Samsung' },
  { value: 'xiaomi', label: 'Xiaomi' },
  { value: 'motorola', label: 'Motorola' },
]

/** Cambio que deja el catálogo sin ningún filtro (vuelve a la página 1). */
export const SIN_FILTROS: Partial<PhonesQuery> = {
  search: undefined,
  condition: undefined,
  category: undefined,
  brand: undefined,
  verified: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  page: 1,
}

export interface FiltroActivo {
  id: string
  /** Lo que se lee en la etiqueta: "Condición: Usados". */
  etiqueta: string
  /** Cambio que quita solo este filtro. */
  quitar: Partial<PhonesQuery>
}

function etiquetaDe(opciones: { value: string; label: string }[], valor: string): string {
  return opciones.find((o) => o.value === valor)?.label ?? valor
}

/** Los filtros que están puestos ahora mismo, en el orden en que se muestran. */
export function filtrosActivos(query: PhonesQuery): FiltroActivo[] {
  const lista: FiltroActivo[] = []
  if (query.search) {
    lista.push({ id: 'search', etiqueta: `Búsqueda: "${query.search}"`, quitar: { search: undefined } })
  }
  if (query.condition) {
    lista.push({
      id: 'condition',
      etiqueta: `Condición: ${etiquetaDe(CONDICIONES, query.condition)}`,
      quitar: { condition: undefined },
    })
  }
  if (query.category) {
    lista.push({
      id: 'category',
      etiqueta: `Categoría: ${etiquetaDe(CATEGORIAS, query.category)}`,
      quitar: { category: undefined },
    })
  }
  if (query.brand) {
    lista.push({ id: 'brand', etiqueta: `Marca: ${etiquetaDe(MARCAS, query.brand)}`, quitar: { brand: undefined } })
  }
  if (query.verified) {
    lista.push({ id: 'verified', etiqueta: 'Solo verificados', quitar: { verified: undefined } })
  }
  if (query.maxPrice) {
    lista.push({
      id: 'maxPrice',
      etiqueta: `Hasta ${formatCOP(query.maxPrice)}`,
      quitar: { maxPrice: undefined },
    })
  }
  return lista
}
