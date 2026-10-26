import {
  AdminPanel,
  BanModal,
  CatalogAdmin,
  Common,
  Login,
  PhoneDetail,
  PhoneForm,
  Statistics,
  Users,
  hasText,
  isLeaf,
  startsWithText,
} from './targets'

/**
 * Los elementos de cada pantalla, listos para usar con Cypress. Cada función
 * devuelve una búsqueda (`cy.get(...)`) que Cypress repite sola hasta
 * encontrar el elemento, así que no hace falta escribir esperas.
 */

export const LoginPage = {
  email: () => cy.get(Login.email),
  password: () => cy.get(Login.password),
  submit: () => cy.get(Login.submit),
  errorMessage: () => cy.get(Login.error),
}

export const CommonPage = {
  // "Hola, Carlos": la página "Mi cuenta" a la que se llega al iniciar sesión.
  greeting: () => cy.get(Common.heading).filter(startsWithText('Hola,')),
  mainHeading: () => cy.get(Common.heading),
}

/** /admin/users — ESC-26, ESC-27 y ESC-28 */
export const UsersPage = {
  searchBox: () => cy.get(Users.searchBox),
  total: () => cy.get(Users.total).filter(isLeaf),
  table: () => cy.get(Users.table),
  rows: () => cy.get(Users.rows),
  emails: () => cy.get(Users.emails),
  row: (email: string) => cy.get(Users.rows).filter(Users.rowOf(email)),
  role: (email: string) => UsersPage.row(email).find(Users.inRow.role),
  status: (email: string) => UsersPage.row(email).find(Users.inRow.status),
  banReason: (email: string) => UsersPage.row(email).find(Users.inRow.banReason),
  ownAccountMark: (email: string) => UsersPage.row(email).find('span').filter(hasText('(tú)')),
  banButton: (email: string) => UsersPage.row(email).find('button').filter(hasText('Banear')),
  unbanButton: (email: string) => UsersPage.row(email).find('button').filter(hasText('Desbanear')),
}

export const BanModalPage = {
  reason: () => cy.get(BanModal.reason),
  confirmButton: () => cy.get(BanModal.modal).find('button').filter(hasText('Confirmar baneo')),
}

/** /admin y /admin/stats — ESC-29 */
export const AdminPanelPage = {
  // Tarjeta del panel principal, por su etiqueta: "Usuarios", "Celulares en catálogo"...
  indicator: (label: string) =>
    cy.get(AdminPanel.card).filter(AdminPanel.cardIsLabeled(label)).find(AdminPanel.cardValue),
}

export const StatisticsPage = {
  // Fila de la página de estadísticas, por su etiqueta: "Baneados", "Sin stock"...
  value: (label: string) =>
    cy.get(Statistics.row).filter(Statistics.rowIsLabeled(label)).find(Statistics.rowValue),
}

/** /admin/phones — ESC-30 */
export const CatalogAdminPage = {
  title: () => cy.get(CatalogAdmin.title).filter(hasText('Gestión de celulares')),
  table: () => cy.get(CatalogAdmin.table),
  row: (name: string) => cy.get(CatalogAdmin.rows).filter(CatalogAdmin.rowOf(name)),
  editButton: (name: string) => CatalogAdminPage.row(name).find(CatalogAdmin.editButton),
  deleteButton: (name: string) => CatalogAdminPage.row(name).find(CatalogAdmin.deleteButton),
}

export const PhoneFormPage = {
  name: () => cy.get(PhoneForm.name),
  slug: () => cy.get(PhoneForm.slug),
  brand: () => cy.get(PhoneForm.brand),
  category: () => cy.get(PhoneForm.category),
  price: () => cy.get(PhoneForm.price),
  stock: () => cy.get(PhoneForm.stock),
  submit: () => cy.get(PhoneForm.submit),
  errorMessage: () => cy.get(PhoneForm.error),
}

/** La ficha de un celular — ESC-13 y ESC-30 */
export const PhoneDetailPage = {
  name: () => cy.get(PhoneDetail.name),
  price: () => cy.get(PhoneDetail.price),
  notice: (text: string) => cy.get(PhoneDetail.notice).filter(hasText(text)),
  recommendations: () => cy.get(PhoneDetail.recommendations),
  recommendedNames: () => cy.get(PhoneDetail.recommendedNames),
  recommendationCalled: (name: string) =>
    cy.get(PhoneDetail.recommendationLinks).filter(PhoneDetail.recommendationIsCalled(name)),
}
