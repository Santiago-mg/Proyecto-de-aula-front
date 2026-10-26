import { defineConfig } from '@playwright/test'
import { createArgosReporterOptions } from '@argos-ci/playwright/reporter'

// Regresión visual de CelularPro con Argos CI.
//  - En local: guarda las capturas en ./screenshots y no sube nada.
//  - En CI (variable CI=true): las sube a Argos y compara con la rama principal.
// El front se levanta solo; la API se simula en el navegador (support/api-simulada.mjs),
// así que no hace falta tener el back corriendo.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [
    process.env.CI ? ['dot'] : ['list'],
    ['@argos-ci/playwright/reporter', createArgosReporterOptions({ uploadToArgos: !!process.env.CI })],
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    cwd: '../../..',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_URL: 'http://api.test/api/v1' },
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
    colorScheme: 'light',
    launchOptions: { args: ['--disable-lcd-text', '--font-render-hinting=none'] },
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'celular', use: { viewport: { width: 390, height: 800 } }, grep: /@celular/ },
  ],
})
