import { defineConfig } from 'cypress'

/**
 * Dónde está corriendo CelularPro.
 *
 * Por defecto son las direcciones del docker-compose del front
 * (`docker compose -p celularpro up -d`): el front en el puerto 8081 y la API
 * en el 3001, con la base recién cargada desde el seed. Si la app corre en
 * otro lado, se cambian con variables de entorno (ver README).
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.E2E_FRONT_URL ?? 'http://localhost:8081',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1440,
    viewportHeight: 900,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 30000,
    retries: 0,
  },
  env: {
    apiUrl: process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1',
    adminEmail: process.env.E2E_ADMIN_EMAIL ?? 'admin@celularpro.co',
    adminPassword: process.env.E2E_ADMIN_PASSWORD ?? 'admin1234',
  },
})
