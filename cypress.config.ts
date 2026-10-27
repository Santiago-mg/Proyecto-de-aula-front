import { defineConfig } from 'cypress'
import rp from './reportportal/config.cjs'
import { conectarCypress } from './reportportal/cypress.cjs'

// ReportPortal (ver reportportal/config.cjs): con RP_API_KEY el reporter pasa a ser el agente
// de ReportPortal; sin ella se mantiene el JUnit de siempre en cypress/resultados.
const suite = process.env.CY_SUITE ?? 'cypress'
const opcionesRP = {
  ...rp.opciones(suite, 'Cypress: componentes, contrato/seguridad de la API y recorridos E2E'),
  autoMerge: false,         // un solo launch se logra con launchId (ver reportportal/cypress.cjs)
  uploadScreenshots: true,  // capturas de los fallos como adjuntos del paso que falló
}
const reporte = rp.activo()
  ? { reporter: '@reportportal/agent-js-cypress', reporterOptions: opcionesRP }
  : { reporter: 'junit', reporterOptions: { mochaFile: 'cypress/resultados/[hash].xml', toConsole: false } }

/**
 * Cypress para CelularPro: tres tipos de prueba con un solo marco.
 *
 *   npm run cy:component   componentes aislados (sin backend)
 *   npm run cy:api         contrato y seguridad de la API con cy.request (necesita el backend)
 *   npm run cy:e2e         recorridos completos en el navegador (necesita frontend y backend)
 *
 * Variables (CYPRESS_*): CYPRESS_BASE_URL, CYPRESS_API_URL, CYPRESS_ADMIN_EMAIL, CYPRESS_ADMIN_PASSWORD
 * Evidencia: capturas de los fallos en cypress/screenshots y reporte JUnit en cypress/resultados.
 * ReportPortal: con RP_API_KEY los resultados van a ReportPortal (CY_SUITE nombra el launch).
 */
export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return conectarCypress(on, config, opcionesRP)
    },
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173',
    specPattern: ['cypress/e2e/**/*.cy.ts', 'cypress/api/**/*.cy.ts'],
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    retries: { runMode: 1, openMode: 0 },   // un reintento solo en ejecución automática: absorbe parpadeos sin ocultar fallos reales
    env: {
      apiUrl: process.env.CYPRESS_API_URL ?? 'http://localhost:3001/api/v1',
      adminEmail: process.env.CYPRESS_ADMIN_EMAIL ?? 'admin@celularpro.co',
      adminPassword: process.env.CYPRESS_ADMIN_PASSWORD ?? 'admin1234',
    },
  },
  component: {
    setupNodeEvents(on, config) {
      return conectarCypress(on, config, opcionesRP)
    },
    devServer: { framework: 'react', bundler: 'vite' },
    specPattern: 'cypress/component/**/*.cy.tsx',
    supportFile: 'cypress/support/component.ts',
    video: false,
  },
  ...reporte,
})
