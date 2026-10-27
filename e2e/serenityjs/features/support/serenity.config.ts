import { AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, configure } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { Browser, chromium } from 'playwright';

import { contexto } from '../../test/support/contexto';

let browser: Browser;

setDefaultTimeout(30_000);

BeforeAll(async () => {
  // CHROMIUM_PATH / CHROMIUM_ARGS permiten usar un Chromium ya instalado (CI, contenedores
  // o equipos sin acceso a la descarga de Playwright). Sin ellos, se usa el de Playwright.
  browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: (process.env.CHROMIUM_ARGS ?? '').split(' ').filter(Boolean).map(a => a.replace(/'/g, '')),
  });

  configure({
    actors: Cast.where(actor => actor.whoCan(BrowseTheWebWithPlaywright.using(browser))),
    crew: [
      '@serenity-js/console-reporter',
      ['@serenity-js/html-reporter', { specDirectory: './features' }],
    ],
  });
});

Before(() => contexto.reiniciar());

AfterAll(async () => {
  await browser?.close();
});
