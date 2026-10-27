import { defineConfig, devices } from '@playwright/test';

/**
 * Dónde corre CelularPro. Las direcciones por defecto son las del docker-compose
 * del front (`docker compose -p celularpro up -d`): front en el 8081, API en el 3001.
 * Se cambian con E2E_FRONT_URL / E2E_API_URL (ver support/api.ts para el admin).
 */
const front = process.env.E2E_FRONT_URL ?? 'http://localhost:8081';

export default defineConfig({
  // seed.spec.ts está en la raíz (así lo espera el Planner); los escenarios, en tests/
  testDir: '.',
  testIgnore: ['node_modules/**'],

  // Los escenarios crean y borran datos en el mismo servidor y algunos cuentan
  // filas (estadísticas): se corren uno tras otro para que no se pisen.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,

  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reporte', open: 'never' }],
    ['junit', { outputFile: 'resultados/junit.xml' }],
  ],
  outputDir: 'resultados/artefactos',

  use: {
    baseURL: front,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
