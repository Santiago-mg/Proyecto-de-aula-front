# Regresión visual con Argos CI

**Propósito.** Argos compara capturas de pantalla de CelularPro entre una corrida y la anterior. Si un cambio de código mueve un botón, cambia un color o desborda una pantalla, Argos lo marca antes de que llegue a producción. Complementa las pruebas funcionales (Serenity, Cypress, Katalon): ellas dicen si algo *funciona*, esta dice si *se ve igual*.

**Qué cubre.** 9 pantallas × 3 temas (oscuro, claro y alto contraste) en escritorio, más 5 pantallas en celular (390 px): 32 capturas.
La API se simula en el navegador (`support/api-simulada.mjs`) con datos fijos, así que no hace falta levantar el back y las capturas son reproducibles.

## Correr en local (no sube nada)

```bash
cd e2e/santiago/argos
npm install
npx playwright install chromium     # solo la primera vez
npm test
```

Las capturas quedan en `test-results/**/argos/`. Úsalas como evidencia.

## Subir a Argos (comparación y revisión)

1. Entra a <https://argos-ci.com> con tu cuenta de GitHub y crea un proyecto enlazado al repo del front.
2. En **Settings ▸ Authentication** copia el *Project token*.
3. Sube las capturas:

```bash
ARGOS_TOKEN=<tu_token> npm run test:subir
```

4. La primera corrida en la rama principal fija la base (*baseline*). Desde la siguiente, cada corrida muestra en Argos las diferencias para aprobarlas o rechazarlas.

En Jenkins guarda el token como credencial (`ARGOS_TOKEN`) y ejecuta `npm run test:subir`; nunca lo escribas en el repo.

## Plan gratuito
Argos ofrece un plan Hobby gratuito (hasta 5.000 capturas, con condiciones; ver su página). Cada corrida usa 32.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `playwright.config.ts` | Levanta el front, activa el reporter de Argos y define escritorio y celular |
| `tests/visual.spec.ts` | Una captura por pantalla y por tema (`argosScreenshot`) |
| `support/api-simulada.mjs` | Respuestas fijas de la API |
