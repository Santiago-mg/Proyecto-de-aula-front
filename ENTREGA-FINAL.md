# Entrega final — dónde está cada criterio en el código

Funcionalidades: **registro de usuario, inicio de sesión, gestión de perfil, validación de credenciales,
control de roles y alertas de stock bajo**. Los documentos (plan de pruebas, matriz de trazabilidad e informe
final) se entregan aparte; aquí está lo que vive en el código y cómo ejecutarlo.

Preparación común: backend (Proyecto-de-aula-mario) con `npm run db:seed` y `npm run dev`; este frontend
con `npm run dev`. Administrador del seed: `admin@celularpro.co` / `admin1234`.

| Criterio | Dónde | Cómo se ejecuta | Verificado en este entorno |
|---|---|---|---|
| 4. Cypress sobre las 6 funcionalidades (E2E, API, seguridad, regresión, accesibilidad, UI) | `cypress/` — matriz en `cypress/COBERTURA-6-FUNCIONALIDADES.md` (100 pruebas) | `npm run cy:e2e`, `cy:api`, `cy:accesibilidad`, `cy:component`, `cy:gherkin` | Compilación TypeScript; ejecución pendiente (no hay navegador aquí) |
| 5. Screenplay + Gherkin con E2E | `cypress/gherkin/` (Cypress, 6 características, 20 escenarios) y `e2e/serenityjs/` (Serenity/JS, 35 escenarios) | `npm run cy:gherkin` · `cd e2e/serenityjs && npm test` | Cada paso con una sola definición (`npm run gherkin:verificar`); dry-run de Serenity |
| 6. Tres herramientas de IA | Autify Nexus `e2e/autify-nexus/`, Momentic `e2e/momentic/` (+ `api-momentic/` en el backend), ReportPortal `reportportal/` | Ver `HERRAMIENTAS-IA.md` | Listado de Playwright, `momentic lint`, agentes de ReportPortal contra un servidor simulado |
| 7. Stagehand (act, observe, extract) con Gemini vía Ollama | `e2e/stagehand/` (12 pruebas) | `ollama signin && ollama pull gemini-3-flash-preview:cloud`; `cd e2e/stagehand && npm test` | Typecheck contra Stagehand 3.7.3; detección de Ollama y del modelo |
| 8. Refactorización y antes/después | `CAMBIOS-INTEGRACION.md`, `REFACTORIZACION-HEURISTICAS.md`; backend: `docs/pruebas/02-seguridad-rendimiento.md` (hallazgos 1.2 y 1.3) | — | 415 pruebas del frontend y 426 del backend en verde |
| 9. Despliegue y pruebas posteriores | `Jenkinsfile`, `Jenkinsfile.orquestador` (etapas 3b y 5); backend: `Jenkinsfile`, `Dockerfile` | Job `celularpro-orquestador` en Jenkins | Sintaxis de los Jenkinsfile (llaves balanceadas); ejecución pendiente |

## Cadena de Jenkins (criterio 9)

```
celularpro-backend   typecheck → 426 pruebas → SonarQube (Quality Gate) → build → imagen celularpro-api
celularpro-front     typecheck → Gherkin verificado → 415 pruebas → SonarQube (Quality Gate) → build → imagen
orquestador          backend → front → Docker (db + migraciones + seed + API + front)
                     → 3b. Cypress API + E2E (func. 13, 26 a 30) CONTRA LO DESPLEGADO
                     → Vercel → 5. Cypress contra Vercel (si se dan URL_FRONT_VERCEL y URL_API_VERCEL)
```

Stagehand no forma parte de las pruebas posteriores al despliegue, como pide la rúbrica.
Antes de correr el orquestador, revisa el parámetro `REPO_BACKEND`: debe apuntar al repositorio de este backend.
