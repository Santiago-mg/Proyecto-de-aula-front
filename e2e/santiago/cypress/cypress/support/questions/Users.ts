import { rowsInTable, textOf, textsOf } from '../screenplay/question'
import type { Customer } from '../screenplay/testData'
import { BanModalPage, UsersPage } from '../ui/pages'

const toNumber = (text: string): number => Number.parseInt(text, 10)

/** ESC-26, 27 y 28: lo que muestra la tabla de /admin/users */
export const UsersTable = {
  emails: () => textsOf('correos de la tabla', UsersPage.emails),
  statusOf: (customer: Customer) => textOf(`estado de ${customer.email}`, () => UsersPage.status(customer.email)),
  banReasonOf: (customer: Customer) =>
    textOf(`motivo del baneo de ${customer.email}`, () => UsersPage.banReason(customer.email)),
  roleOf: (customer: Customer) => textOf(`rol de ${customer.email}`, () => UsersPage.role(customer.email)),
  // La tabla tiene que existir: mientras la página busca, la cambia por
  // "Cargando usuarios...", y eso no se debe confundir con "sin resultados".
  numberOfRows: () => rowsInTable('cantidad de filas de la tabla', UsersPage.table),
  // "12 usuarios registrados" → 12
  totalShown: () => textOf('total de usuarios en pantalla', UsersPage.total, toNumber),
  // Partes de la fila de un usuario, para comprobar que están o no están.
  ownAccountMarkOf: (email: string) => textOf(`marca "(tú)" de ${email}`, () => UsersPage.ownAccountMark(email)),
  banButtonOf: (email: string) => textOf(`botón Banear de ${email}`, () => UsersPage.banButton(email)),
}

export const BanModal = {
  confirmButton: () => textOf('botón Confirmar baneo', BanModalPage.confirmButton),
}
