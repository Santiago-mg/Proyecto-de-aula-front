import type { Task } from '../screenplay/actor'
import { environment } from '../screenplay/environment'
import type { Customer } from '../screenplay/testData'
import { CommonPage, LoginPage } from '../ui/pages'

const submitCredentials = (email: string, password: string): Task => (actor) => {
  actor.takesTheBrowser()
  cy.visit('/login', { failOnStatusCode: false })
  LoginPage.email().clear().type(email)
  // log: false, para que la contraseña no quede escrita en el reporte.
  LoginPage.password().type(password, { log: false })
  LoginPage.submit().click()
}

/** Inicia sesión y espera a llegar a "Mi cuenta". */
export const LogIn = {
  asAdministrator: (): Task => (actor) => {
    submitCredentials(environment.admin.email, environment.admin.password)(actor)
    CommonPage.greeting().should('be.visible')
  },
  as: (customer: Customer): Task => (actor) => {
    submitCredentials(customer.email, customer.password)(actor)
    CommonPage.greeting().should('be.visible')
  },
}

/** Solo envía el formulario: sirve cuando se espera que el ingreso falle. */
export const TryToLogIn = {
  as: (customer: Customer): Task => submitCredentials(customer.email, customer.password),
}
