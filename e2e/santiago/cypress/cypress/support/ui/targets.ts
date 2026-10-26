/**
 * Dónde está cada cosa en la pantalla (la capa "UI" del patrón Screenplay).
 *
 * Los selectores (`#email`, la fila de la tabla que tiene tal correo...) solo
 * aparecen aquí. Si mañana cambia la pantalla, se arregla en este archivo y
 * las pruebas siguen igual.
 */

export const norm = (text: string | null | undefined): string => (text ?? '').replace(/\s+/g, ' ').trim()

type ElementFilter = (index: number, element: HTMLElement) => boolean

/** Filtro de jQuery: elementos cuyo texto, tal como está escrito, es exactamente `text`. */
export const hasText = (text: string): ElementFilter => (_i, element) => norm(element.textContent) === text

/** Filtro: elementos cuyo texto empieza por `prefix`. */
export const startsWithText = (prefix: string): ElementFilter => (_i, element) =>
  norm(element.textContent).startsWith(prefix)

/** Filtro: elementos que tienen adentro algún `selector` cuyo texto es exactamente `text`. */
export const hasDescendantText = (selector: string, text: string): ElementFilter => (_i, element) =>
  Array.from(element.querySelectorAll(selector)).some((inner) => norm(inner.textContent) === text)

/** Filtro: elementos que no contienen otros elementos (solo texto). */
export const isLeaf: ElementFilter = (_i, element) => element.children.length === 0

export const Login = {
  email: '#email',
  password: '#password',
  submit: 'form button[type="submit"]',
  // El error del servidor es el párrafo suelto del formulario; los errores de
  // cada campo llevan la clase cp-field-error.
  error: 'form > p:not(.cp-field-error)',
}

export const Common = {
  heading: 'h1',
}

/** /admin/users — ESC-26, ESC-27 y ESC-28 */
export const Users = {
  searchBox: 'input[placeholder="Buscar por nombre o email..."]',
  total: 'div:contains("usuarios registrados")',
  table: 'table.cp-admin-table',
  rows: 'table.cp-admin-table tbody tr',
  // Cada fila: avatar | (nombre, correo)
  emails: 'table.cp-admin-table tbody tr td:first-child > div > div:nth-child(2) > div:nth-child(2)',
  // La fila de un usuario se reconoce por su correo, que es único.
  rowOf: (email: string): ElementFilter => hasDescendantText('td:first-child div', email),
  inRow: {
    role: 'td:nth-child(2) > span',
    status: 'td:nth-child(5) span.cp-badge',
    banReason: 'td:nth-child(5) > div > div',
  },
}

/** El modal que se abre al pulsar "Banear" */
export const BanModal = {
  modal: '.cp-modal',
  reason: '#motivo-baneo',
}

/** /admin (panel principal) y /admin/stats — ESC-29 */
export const AdminPanel = {
  card: 'div.cp-kpi-card',
  cardIsLabeled: (label: string): ElementFilter => hasDescendantText('.cp-kpi-label', label),
  cardValue: '.cp-kpi-value',
}

export const Statistics = {
  row: 'div.cp-stats-detail-row',
  rowIsLabeled: (label: string): ElementFilter => hasDescendantText('span', label),
  rowValue: 'span.cp-stats-detail-value',
}

/** /admin/phones — ESC-30 */
export const CatalogAdmin = {
  title: 'h1',
  table: 'table.cp-admin-table',
  rows: 'table.cp-admin-table tbody tr',
  rowOf: (name: string): ElementFilter => hasDescendantText('td:first-child span', name),
  editButton: 'a[title="Editar"]',
  deleteButton: 'button[title="Eliminar"]',
}

/** /admin/phones/new y /admin/phones/:id/edit */
export const PhoneForm = {
  name: '#name',
  slug: '#slug',
  brand: '#brand',
  category: '#categoryId',
  price: '#price',
  stock: '#stock',
  submit: 'form button[type="submit"]',
  error: 'form > p:not(.cp-field-error)',
}

/** La ficha de un celular y su sección "También te puede interesar" — ESC-13 */
const RECOMMENDATIONS = 'section[aria-labelledby="titulo-similares"]'
export const PhoneDetail = {
  name: 'h1.cp-detail-name',
  price: '.cp-detail-price',
  notice: 'h2',
  recommendations: RECOMMENDATIONS,
  recommendedNames: `${RECOMMENDATIONS} h3.cp-phone-card-name`,
  recommendationLinks: `${RECOMMENDATIONS} a`,
  recommendationIsCalled: (name: string): ElementFilter => hasDescendantText('h3', name),
}
