import type { Task } from '../../screenplay/actor'
import type { Customer } from '../../screenplay/testData'
import { lastResponseOf } from '../../questions/Api'
import { send } from './ApiSession'

const idOf = (customer: Customer): string => {
  if (!customer.id) throw new Error(`${customer.firstName} todavía no tiene cuenta`)
  return customer.id
}

/** Preparar datos por la API (blended testing): crear la cuenta de un cliente. */
export const RegisterAccount = {
  of:
    (customer: Customer): Task =>
    (actor) => {
      send(actor, 'POST', 'auth/register', {
        body: { name: customer.name, email: customer.email, password: customer.password },
      }).then(() => {
        expect(lastResponseOf(actor).status, 'estado HTTP del registro').to.equal(201)
        customer.id = lastResponseOf(actor).body.data.user.id as string
      })
    },
}

/** ESC-26 por la API. Necesita una sesión de API iniciada (StartApiSession). */
export const BanViaApi = {
  user: (customer: Customer) => ({
    because:
      (reason: string): Task =>
      (actor) => {
        cy.wrap(null, { log: false }).then(() =>
          send(actor, 'PUT', `admin/users/${idOf(customer)}/ban`, { body: { reason }, authenticated: true }),
        )
      },
  }),
}

/** ESC-27 por la API. */
export const UnbanViaApi = {
  user:
    (customer: Customer): Task =>
    (actor) => {
      cy.wrap(null, { log: false }).then(() =>
        send(actor, 'PUT', `admin/users/${idOf(customer)}/unban`, { authenticated: true }),
      )
    },
  userWithId:
    (id: string): Task =>
    (actor) => {
      send(actor, 'PUT', `admin/users/${id}/unban`, { authenticated: true })
    },
}

/** ESC-28 por la API. */
export const ListUsersViaApi = {
  page:
    (page: number, limit: number): Task =>
    (actor) => {
      send(actor, 'GET', `admin/users?page=${page}&limit=${limit}`, { authenticated: true })
    },
  withoutLoggingIn:
    (): Task =>
    (actor) => {
      send(actor, 'GET', 'admin/users')
    },
}
