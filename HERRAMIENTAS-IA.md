# Herramientas de pruebas con IA: Autify Nexus, Momentic y ReportPortal

| Herramienta | Categoría | Uso en CelularPro | Licencia / acceso | Carpeta |
|---|---|---|---|---|
| [Autify Nexus](https://autify.com/products/autify-nexus) | E2E web con bajo código | 18 escenarios importables, generación con lenguaje natural, *Fix with AI* y exportación a Playwright | Local gratuito; IA y nube según plan o prueba ampliada | `e2e/autify-nexus/` |
| [Momentic](https://momentic.ai/) | Pruebas funcionales y E2E | 9 pruebas YAML con pasos exactos y pasos de IA (`assert`, `act`), recuperación de fallos y memoria | Prueba comercial; límites exactos no confirmados | `e2e/momentic/` |
| [ReportPortal](https://reportportal.io/) | Reportes y análisis | Recibe las 6 suites; clasifica fallos, agrupa errores similares y sugiere causas con ML | Edición abierta (Apache 2.0) | `reportportal/` |

Cada carpeta tiene un `LEEME.md` con los pasos completos.

**Stagehand** (criterio 7, aparte de las tres herramientas) está en `e2e/stagehand/`: 12 pruebas con `act`,
`observe` y `extract` que usan **Gemini a través de Ollama** (`ollama/gemini-3-flash-preview:cloud`).

## Backend

El backend (Proyecto-de-aula-mario) reporta sus 426 pruebas y la carga al mismo ReportPortal (`app: celularpro-api`)
y tiene 5 contratos de la API en Momentic. Ver su `HERRAMIENTAS-IA.md`.

## Cómo encajan

```
 Vitest ──agente──────────┐
 Cypress ─agente──────────┤
 Autify Nexus (Playwright)─agente─┤
 Serenity/JS ──JUnit──────┼──► ReportPortal ──► Auto-Analysis · Pattern Analysis · Unique Errors · ML suggestions
 Momentic ─────JUnit──────┤
 Katalon ──────JUnit──────┘
```

Las seis cubren las mismas 6 funcionalidades (registro, inicio de sesión, gestión de perfil, validación de
credenciales, control de roles y alertas de stock bajo). En ReportPortal se pueden comparar lado a lado y filtrar
por el atributo de cada funcionalidad.

## Qué está verificado y qué no

| Verificación | Resultado |
|---|---|
| Vitest → ReportPortal | Contra `servidor-simulado.mjs`: 22 pruebas como pasos, 11 suites, launch cerrado. Un fallo provocado llegó con su mensaje y su traza. |
| Cypress → ReportPortal | Un solo launch abierto antes de la corrida, `launchId` entregado al reporter y launch cerrado en `after:run`. |
| Playwright (Nexus) → ReportPortal | Launch "CelularPro · autify-nexus" con un paso aprobado, uno fallido y el error enviado. |
| Importación JUnit | Petición correcta a `/api/v1/plugin/celularpro/junit/import` con nombre y atributos. Sin clave no hace nada. |
| Escenarios de Nexus | `playwright test --list`: 18 escenarios en 6 archivos. Cada texto y localizador existe en el código o en las respuestas del backend. |
| Pruebas de Momentic | `momentic lint` y `momentic check` sin errores. |
| Sin ReportPortal | Con el servidor caído, las pruebas pasan igual; el agente solo avisa. Sin `RP_API_KEY`, nada cambia. |

**No verificado aquí**, porque necesita cuentas, aplicaciones o Docker:

- Ejecutar los escenarios en un navegador: el entorno no tiene Chromium.
- Importarlos en la aplicación de Nexus, la generación con IA y *Fix with AI*.
- Ejecutar Momentic, que necesita `MOMENTIC_API_KEY`.
- El análisis real de ReportPortal, que necesita el servidor con el perfil `analyzer`.

Cada `LEEME.md` dice qué capturar como evidencia.

## Aporte a la rúbrica

- **Criterio 1 (regresión):** ReportPortal agrupa los fallos repetidos y compara launches, de modo que una regresión aparece como errores nuevos frente a la ejecución anterior.
- **Criterio 3 (análisis con IA):** la comparación entre los escenarios generados por la IA de Nexus y Momentic y los escritos por el equipo, y la clasificación de fallos con ML en ReportPortal, son análisis apoyados por IA que se pueden contrastar con la revisión del equipo.
- **Criterios 4 y 5 (E2E):** amplían la cobertura E2E con dos herramientas de bajo código, sin reemplazar Screenplay (Serenity) ni Katalon, que siguen siendo las que pide la rúbrica.

## Orden sugerido para la entrega

1. Levantar backend (con seed) y frontend.
2. `npm run rp:servidor`, crear el proyecto `celularpro` y la API key.
3. Ejecutar Vitest, Cypress, Serenity, Katalon, Nexus y Momentic con `RP_API_KEY` definida, e importar los JUnit (`npm run rp:serenity`, `rp:katalon`, `rp:momentic`).
4. Configurar los tipos de defecto y las reglas de Pattern Analysis (`reportportal/LEEME.md`), clasificar a mano los primeros fallos y volver a ejecutar para ver el Auto-Analysis.
5. Hacer el ejercicio de *Fix with AI* en Nexus y la creación con IA en Momentic, con capturas.
