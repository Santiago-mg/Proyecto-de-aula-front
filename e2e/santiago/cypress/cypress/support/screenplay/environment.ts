/**
 * Dónde está corriendo CelularPro. Los valores salen de `cypress.config.ts`
 * (que lee las variables E2E_FRONT_URL, E2E_API_URL, E2E_ADMIN_EMAIL y
 * E2E_ADMIN_PASSWORD). El front se abre con rutas relativas porque Cypress ya
 * conoce `baseUrl`.
 */
export const environment = {
  get apiUrl(): string {
    return Cypress.env('apiUrl') as string
  },
  admin: {
    get email(): string {
      return Cypress.env('adminEmail') as string
    },
    get password(): string {
      return Cypress.env('adminPassword') as string
    },
  },
}
