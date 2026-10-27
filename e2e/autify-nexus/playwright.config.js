// @ts-check
// Playwright para los escenarios de Autify Nexus.
//
//   escenarios/  → escritos aquí, en el estilo que Nexus IMPORTA (JavaScript, un test() por escenario)
//   exportados/  → lo que el equipo EXPORTA desde Nexus ("Export to Playwright Code"), para correrlo en CI
//
// Variables: BASE_URL (frontend), ADMIN_EMAIL, ADMIN_PASSWORD. ReportPortal: RP_API_KEY y demás RP_*.
const { defineConfig, devices } = require('@playwright/test')
const rp = require('../../reportportal/config.cjs')

const reportePortal = rp.activo()
  ? [['@reportportal/agent-js-playwright', {
      ...rp.opciones('autify-nexus', 'Escenarios de Autify Nexus ejecutados con Playwright'),
      uploadTrace: true,   // el trace de Playwright queda adjunto al fallo en ReportPortal
      uploadVideo: false,
    }]]
  : []

module.exports = defineConfig({
  testDir: '.',
  testMatch: ['escenarios/**/*.spec.js', 'exportados/**/*.js'],
  fullyParallel: false,          // comparten backend y datos del seed: se corren en orden
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
    locale: 'es-CO',
    // CHROMIUM_PATH (opcional): usar un Chromium ya instalado en vez del que descarga Playwright
    ...(process.env.CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'] } }
      : {}),
  },
  // Nexus ejecuta localmente en Chrome y Edge
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'] } } : {}) } }],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit-nexus.xml' }],
    ...reportePortal,
  ],
})
