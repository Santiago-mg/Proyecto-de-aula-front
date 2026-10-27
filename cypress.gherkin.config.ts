import { defineConfig } from 'cypress'
import createBundler from '@bahmutov/cypress-esbuild-preprocessor'
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor'
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild'

/**
 * Pruebas E2E en Gherkin (español) ejecutadas por Cypress, con el patrón Screenplay
 * (cypress/gherkin/screenplay). Una característica por funcionalidad:
 * registro, inicio de sesión, perfil, credenciales, roles y alertas de stock.
 *
 *   npm run cy:gherkin        (frontend y backend levantados, seed cargado)
 *
 * Evidencia: reporte HTML de Cucumber en cypress/gherkin/reportes/cucumber.html,
 * mensajes en cypress/gherkin/reportes/cucumber-messages.ndjson y capturas de los fallos.
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173',
    specPattern: 'cypress/gherkin/features/**/*.feature',
    supportFile: 'cypress/support/e2e.ts',
    env: {
      apiUrl: process.env.CYPRESS_API_URL ?? 'http://localhost:3001/api/v1',
      adminEmail: process.env.CYPRESS_ADMIN_EMAIL ?? 'admin@celularpro.co',
      adminPassword: process.env.CYPRESS_ADMIN_PASSWORD ?? 'admin1234',
    },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config)
      on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }))
      return config
    },
    video: false,
    screenshotsFolder: 'cypress/gherkin/reportes/capturas',
  },
})
