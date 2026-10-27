# Integración de `pruebas-qa-mario` en este front

Qué se trajo de la rama `pruebas-qa-mario` (commit `3883827`, MarioFer299) a la rama `integracion-qa`, qué se dejó por fuera y por qué.

## Qué se incorporó

| Carpeta o archivo | Qué es |
|---|---|
| `cypress/`, `cypress.config.ts`, `cypress.gherkin.config.ts`, `.cypress-cucumber-preprocessorrc.json` | Cypress: API, E2E, componentes, accesibilidad (axe) y Gherkin + Screenplay |
| `e2e/stagehand/` | Stagehand (act, observe, extract) de las 6 funcionalidades de Mario |
| `e2e/serenityjs/` | Serenity/JS + Cucumber (Screenplay) |
| `e2e/katalon/` | Suites Selenese de Katalon (TC01 a TC29, humo y falla controlada) |
| `e2e/momentic/`, `e2e/autify-nexus/` | Momentic y Autify Nexus |
| `e2e/evidencia/`, `docs/matriz-de-trazabilidad/` | Resultados y matriz de trazabilidad |
| `reportportal/` | Integración con ReportPortal (reporters de Vitest y Cypress, simulador) |
| `scripts/verificar-gherkin.mjs` | Verifica que cada paso Gherkin tenga una definición |
| `Jenkinsfile`, `Jenkinsfile.orquestador` | Etapa «Verificar Gherkin» y pruebas posteriores al despliegue (Docker y Vercel), sin Stagehand |
| `COBERTURA-DE-PRUEBAS.md`, `ENTREGA-FINAL.md`, `HERRAMIENTAS-IA.md`, `REFACTORIZACION-HEURISTICAS.md`, `CAMBIOS-INTEGRACION.md` | Documentos de Mario |

Mi Stagehand sigue en `e2e/santiago/stagehand/` (ESC-13 y ESC-26 a ESC-30); el de Mario es otro, en `e2e/stagehand/`.

## Qué se ajustó

- `package.json`: se sumaron los scripts (`cy:*`, `rp:*`, `nexus:*`, `momentic:*`, `stagehand:*`, `gherkin:verificar`) y las dependencias de Cypress, axe y ReportPortal. Se conservaron los scripts de regresión de Santiago y Mario.
- `vitest.config.ts`: reporter de ReportPortal (solo si hay `RP_API_KEY`). Se conservó la suite `test/regresion`.
- `.gitignore`: carpetas generadas por las nuevas herramientas.
- `package-lock.json`: regenerado.

## Qué NO se trajo: el código de `src/`

La rama de Mario modifica unos 130 archivos de `src/` (Mi cuenta, heurísticas de usabilidad, alertas, reglas de contraseña). Esas versiones **no incluyen** mejoras que ya estaban aquí, por ejemplo el aviso «Ningún usuario coincide con tu búsqueda» y «Actualizando la lista» de `AdminUsers`, que usan las pruebas de ESC-28. Por eso `src/` quedó como estaba.

Consecuencia: las pruebas que verifican el código de Mario no pueden pasar todavía.

- **Pruebas unitarias** (13 archivos, listados en `test/pendiente-qa-mario.json`): están excluidas de `npm test` y del chequeo de tipos. Se corren aparte con `npm run test:pendiente-qa` (hoy: 22 pasan y 96 fallan, a propósito).
- **Cypress E2E, componentes y Gherkin, Serenity, Katalon y Stagehand de Mario**: apuntan a los textos y pantallas de su versión («Cerrar sesión», «Panel», página de perfil, atajos). Algunos casos fallarán contra este código hasta que se integre su `src/`.

Para activarlas, hay que decidir con Mario qué cambios de `src/` se integran (y rescatar los de `AdminUsers`).

## Cómo correr cada herramienta

```bash
npm ci
npm test                         # tus 583 pruebas (Vitest)
npm run cy:api                   # Cypress contra la app levantada (docker compose -p celularpro up -d)
npm run cy:e2e
npm run cy:gherkin
npm run gherkin:verificar        # sin navegador
npm run stagehand:test           # Stagehand de Mario (ver e2e/stagehand/LEEME.md)
cd e2e/santiago/stagehand && npm test   # Stagehand de Santiago
cd e2e/santiago/playwright-agents && npm test   # Playwright Test Agents de Santiago
```

Cada subcarpeta de `e2e/` tiene su propio `LEEME.md` o `README.md`.
