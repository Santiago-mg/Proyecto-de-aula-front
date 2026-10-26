import type { Task } from '../screenplay/actor'
import type { Customer } from '../screenplay/testData'
import { BanModalPage, UsersPage } from '../ui/pages'
import { OpenPage } from './OpenPage'

/** ESC-28: el buscador espera 400 ms a que se deje de escribir y filtra. */
export const SearchUsers = {
  for:
    (term: string): Task =>
    () => {
      UsersPage.searchBox().clear().type(term)
    },
}

/**
 * Busca al cliente por su correo y espera a que la tabla termine de filtrar
 * (una sola fila). Si se hace clic mientras el buscador vuelve a pintar las
 * filas, el clic puede caer en una fila que ya no existe.
 */
const searchOnly = (customer: Customer): Task => (actor) => {
  OpenPage.userManagement()(actor)
  SearchUsers.for(customer.email)(actor)
  UsersPage.rows().should('have.length', 1)
}

/** Busca al cliente por su correo y abre el modal de baneo de su fila. */
const openBanModalFor = (customer: Customer): Task => (actor) => {
  searchOnly(customer)(actor)
  UsersPage.banButton(customer.email).click()
}

/** ESC-26 */
export const BanUser = {
  called: (customer: Customer) => ({
    because:
      (reason: string): Task =>
      (actor) => {
        openBanModalFor(customer)(actor)
        BanModalPage.reason().clear().type(reason)
        BanModalPage.confirmButton().click()
        // Al quedar baneado, el botón de su fila pasa a decir "Desbanear".
        UsersPage.unbanButton(customer.email).should('exist')
      },
  }),
}

/** ESC-26: abre el modal y escribe el motivo, pero no confirma. */
export const StartBanning = {
  user: (customer: Customer) => ({
    withReason:
      (reason: string): Task =>
      (actor) => {
        openBanModalFor(customer)(actor)
        BanModalPage.reason().clear().type(reason)
      },
  }),
}

/** ESC-27 */
export const UnbanUser = {
  called:
    (customer: Customer): Task =>
    (actor) => {
      searchOnly(customer)(actor)
      UsersPage.unbanButton(customer.email).click()
      // Al quedar activo, el botón de su fila vuelve a decir "Banear".
      UsersPage.banButton(customer.email).should('exist')
    },
}
