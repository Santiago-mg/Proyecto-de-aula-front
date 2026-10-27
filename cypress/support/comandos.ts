/// <reference types="cypress" />

// Comandos propios: cada uno hace UNA cosa y tiene nombre de negocio.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Registra una cuenta nueva por la API y devuelve { email, token }. */
      registrarPorApi(opciones?: { clave?: string; nombre?: string }): Chainable<{ email: string; token: string }>
      /** Entra como administrador por la API y devuelve el token. */
      tokenDeAdmin(): Chainable<string>
      /** Deja una sesión iniciada en el navegador sin pasar por la pantalla de login. */
      iniciarSesionEnNavegador(sesion: { email: string; token: string; nombre?: string }): Chainable<void>
    }
  }
}

const api = () => Cypress.env('apiUrl') as string
export const CLAVE = 'Segura2026x'

Cypress.Commands.add('registrarPorApi', (opciones = {}) => {
  // Un correo distinto por llamada: el registro no admite repetidos.
  const email = `cy+${Date.now()}${Math.floor(Math.random() * 1e6)}@gmail.com`
  return cy
    .request('POST', `${api()}/auth/register`, { email, name: opciones.nombre ?? 'Ana Pérez', password: opciones.clave ?? CLAVE })
    .then((r) => ({ email, token: r.body.data.token as string }))
})

Cypress.Commands.add('tokenDeAdmin', () =>
  cy
    .request('POST', `${api()}/auth/login`, { email: Cypress.env('adminEmail'), password: Cypress.env('adminPassword') })
    .then((r) => r.body.data.token as string),
)

Cypress.Commands.add('iniciarSesionEnNavegador', ({ email, token, nombre = 'Ana Pérez' }) => {
  cy.window().then((w) => {
    w.localStorage.setItem('cp_token', token)
    w.localStorage.setItem('cp_user', JSON.stringify({ id: 'cy', email, name: nombre, role: 'USER', createdAt: '' }))
  })
})
