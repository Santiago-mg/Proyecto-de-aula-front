import { defineConfig } from '@playwright/test'
import type { SerenityFixtures, SerenityWorkerFixtures } from '@serenity-js/playwright-test'
import { environment } from './support/environment'

export default defineConfig<SerenityFixtures, SerenityWorkerFixtures>({
  testDir: '.',
  testMatch: '*.spec.ts',
  // Lo que espera código que este front no tiene corre aparte (npm run test:pendiente).
  testIgnore: '**/pendiente-codigo-del-companero/**',
  // Las pruebas de banear/desbanear cambian datos compartidos: una a la vez.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  globalSetup: './support/preparar-datos.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: environment.frontUrl,
    headless: process.env.HEADLESS !== 'false',
    // Opcional: usar un Chromium ya instalado en vez del de Playwright.
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
    crew: [['@serenity-js/console-reporter', { theme: 'auto' }]],
    defaultActorName: 'Cliente',
  },
})
