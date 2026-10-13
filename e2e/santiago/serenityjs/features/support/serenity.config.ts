import { AfterAll, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, configure, TakeNotes } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { Photographer, TakePhotosOfFailures } from '@serenity-js/web';
import { CallAnApi } from '@serenity-js/rest';
import { Browser, chromium } from 'playwright';

import { environment } from '../../test/support/environment';

let browser: Browser;

setDefaultTimeout(60_000);

BeforeAll(async () => {
  const apiOnly = process.env.SERENITY_API_ONLY === 'true';
  if (!apiOnly) {
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      // Opcional: usar un Chromium ya instalado en vez del de Playwright.
      executablePath: process.env.CHROMIUM_PATH || undefined,
    });
  }

  // Todos los actores pueden usar el navegador (cada uno con su propia
  // sesión), llamar a la API de CelularPro y tomar notas (el token de la API).
  configure({
    actors: Cast.where(actor => {
      actor.whoCan(
        // Con "/" al final, las rutas relativas ("phones", "auth/login") se
        // resuelven dentro de /api/v1 y no desde la raíz del servidor.
        CallAnApi.at(environment.apiUrl.replace(/\/?$/, '/')),
        TakeNotes.usingAnEmptyNotepad(),
      );
      if (browser) actor.whoCan(BrowseTheWebWithPlaywright.using(browser));
      return actor;
    }),
    crew: [
      '@serenity-js/console-reporter',
      ['@serenity-js/html-reporter', { specDirectory: './features' }],
      // Si un paso falla, el reporte guarda una captura del navegador.
      Photographer.whoWill(TakePhotosOfFailures),
    ],
  });
});

AfterAll(async () => {
  await browser?.close();
});
