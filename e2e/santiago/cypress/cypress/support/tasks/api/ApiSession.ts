import { environment } from '../../screenplay/environment'
import type { Actor, Task } from '../../screenplay/actor'
import type { Customer } from '../../screenplay/testData'
import type { ApiResponse } from '../../questions/Api'

interface SendOptions {
  body?: Cypress.RequestBody
  /** Manda la cabecera Authorization con el token que el actor anotó al iniciar sesión. */
  authenticated?: boolean
}

/**
 * Hace una petición a la API y anota la respuesta en la libreta del actor.
 * El token se lee al momento de enviar (no al armar la prueba), porque se
 * anota cuando el actor inicia sesión, y eso pasa antes en la misma cola.
 */
export const send = (actor: Actor, method: string, path: string, options: SendOptions = {}) =>
  cy
    .wrap(null, { log: false })
    .then(() =>
      cy.request({
        method,
        url: `${environment.apiUrl}/${path}`,
        body: options.body,
        failOnStatusCode: false,
        headers: options.authenticated ? { Authorization: `Bearer ${actor.notes.get<string>('token')}` } : {},
      }),
    )
    .then((response) => {
      actor.notes.set('lastResponse', { status: response.status, body: response.body } satisfies ApiResponse)
    })

const logInViaApi = (email: string, password: string): Task => (actor) => {
  // Con log: false la contraseña no queda escrita en el reporte.
  cy.wrap(null, { log: false })
    .then(() =>
      cy.request({
        method: 'POST',
        url: `${environment.apiUrl}/auth/login`,
        body: { email, password },
        failOnStatusCode: false,
        log: false,
      }),
    )
    .then((response) => {
      expect(response.status, 'estado HTTP del inicio de sesión').to.equal(200)
      actor.notes.set('token', response.body.data.token)
    })
}

/** Inicia sesión en la API y anota el token para las siguientes peticiones. */
export const StartApiSession = {
  asAdministrator: (): Task => (actor) => {
    logInViaApi(environment.admin.email, environment.admin.password)(actor)
  },
  as:
    (customer: Customer): Task =>
    (actor) => {
      logInViaApi(customer.email, customer.password)(actor)
    },
}
