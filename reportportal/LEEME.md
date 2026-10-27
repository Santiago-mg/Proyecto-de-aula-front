# ReportPortal en CelularPro

ReportPortal reúne en un solo lugar los resultados de **todas** las suites del proyecto y los analiza:
clasifica los fallos por tipo de defecto, agrupa los errores repetidos y sugiere, con aprendizaje
automático, a qué fallo anterior se parece cada uno. Se usa la **edición abierta** (Apache 2.0).

## 1. Levantar el servidor

Requiere Docker con unos 8 GB de RAM libres (OpenSearch y el analizador consumen bastante).

```bash
cd reportportal
docker compose -p reportportal --profile core --profile analyzer up -d
docker compose -p reportportal ps        # todos en "running"/"healthy", incluidos opensearch y analyzer
```

- Interfaz: <http://localhost:8080> · usuario `superadmin`, contraseña `erebus` (cámbiala con `RP_INITIAL_ADMIN_PASSWORD` antes del primer arranque).
- `docker-compose.yml` es la copia **sin modificar** del archivo oficial (ver su cabecera). El perfil `analyzer` es el que
  habilita el auto-análisis y las sugerencias por ML; sin él, ReportPortal guarda resultados pero no los analiza.

Después, en la interfaz:

1. **Administrate → Projects → Add project**: crea `celularpro`.
2. **Perfil → API Keys → Generate API Key**: cópiala en `RP_API_KEY` (ver `.env.example`).

## 2. Enviar resultados

Todo se configura en `reportportal/config.cjs` con variables `RP_*`. **Sin `RP_API_KEY` no se envía nada** y cada suite
funciona como siempre. Si el servidor no responde, las pruebas pasan igual y el agente solo avisa en consola.

| Suite | Cómo llega | Comando |
|---|---|---|
| Vitest (unitarias y escenarios) | Agente `@reportportal/agent-js-vitest` 5.1.1 | `npm test` |
| Cypress (componentes, API, E2E) | Agente `@reportportal/agent-js-cypress`, **un solo launch** por corrida (`reportportal/cypress.cjs`) | `CY_SUITE=cypress-e2e npm run cy:e2e` |
| Autify Nexus (Playwright) | Agente `@reportportal/agent-js-playwright`, con el *trace* adjunto al fallo | `cd e2e/autify-nexus && npm test` |
| Serenity/JS (Cucumber) | JUnit de Cucumber + importación | `npm run rp:serenity` |
| Momentic | JUnit de Momentic + importación | `cd e2e/momentic && npm test && npm run rp:importar` |
| Katalon (Selenese) | `e2e/katalon/a-junit.cjs` + importación | `npm run rp:katalon` |

Cada launch lleva los atributos `suite`, `app`, `rama` y las 6 funcionalidades, para filtrar y comparar ejecuciones.

**Decisiones tomadas al verificar** (con `servidor-simulado.mjs`):

- Vitest usa el agente **5.1.1**: la 5.2+ está hecha para la API de reporters de Vitest 3/4 y con Vitest 1.6 abría el launch sin enviar ninguna prueba.
- Serenity no usa el agente de Cucumber: soporta Cucumber 7–12 y aquí se usa la 13. Se importa el JUnit que Cucumber genera.
- Cypress no usa `autoMerge` (el agente lo marca inestable con `--spec`); abre el launch antes y pasa su `launchId` a cada spec.

## 3. Análisis de fallos

### Tipos de defecto (Project settings → Defect types)

Crea estos subtipos, para que la clasificación diga algo útil en este proyecto:

| Tipo base | Subtipo sugerido | Cuándo |
|---|---|---|
| Product Bug | Regla de credenciales | El frontend y el backend no coinciden en dominios o contraseña |
| Product Bug | Permisos / roles | Un cliente llega a algo de administrador, o al revés |
| Automation Bug | Localizador cambió | La prueba no encuentra un elemento que sigue existiendo con otro texto |
| System Issue | Backend no disponible | Conexión rechazada, tiempo agotado, seed sin cargar |
| No Defect | Falla controlada | TC99 de Katalon, que falla a propósito |

### Auto-Analysis (Project settings → Auto-Analysis)

Actívalo. Al terminar cada launch, el analizador compara los mensajes de error con los ya clasificados y asigna el tipo
de defecto (etiqueta **AA**). Funciona mejor después de clasificar a mano los primeros fallos: aprende de esas decisiones.

### Pattern Analysis (Project settings → Pattern-Analysis)

Reglas para los fallos que ya conocemos; corren antes del auto-análisis (etiqueta **PA**). Prefiere `STRING` sobre `REGEX`:

| Nombre | Tipo | Patrón |
|---|---|---|
| Backend caído | STRING | `ECONNREFUSED` |
| Sin conexión (mensaje de la app) | STRING | `No hay conexión con el servidor` |
| Localizador no encontrado (Testing Library) | STRING | `Unable to find` |
| Localizador no encontrado (Playwright) | STRING | `waiting for locator` |
| Credenciales del seed | STRING | `Credenciales inválidas` |
| Texto viejo de la interfaz | REGEX | `Salir\|Dashboard\|Error de conexión con el servidor` |

### Unique Error Analysis y ML suggestions

- **Unique errors** (pestaña dentro de cualquier launch): agrupa las pruebas que fallaron por el mismo error y cuenta
  cuántas son. Es la "búsqueda de errores similares": un cambio en un texto de la interfaz suele tumbar decenas de
  pruebas a la vez, y aquí aparecen como un solo grupo.
- **ML suggestions** (al abrir *Make decision* sobre un fallo): muestra los fallos pasados más parecidos y cómo se
  clasificaron.

Para que estas funciones sirvan, el mensaje de error tiene que llegar completo. Se verificó que llegan el mensaje y la
traza desde Vitest y desde Playwright.

## 4. Verificar sin Docker

```bash
node reportportal/servidor-simulado.mjs 8089 &
RP_API_KEY=prueba RP_ENDPOINT=http://localhost:8089/api/v1 npx vitest run test/unit/validacion-credenciales
curl http://localhost:8089/__registro     # launch, suites, pruebas, estados y logs recibidos
```

El simulador **no analiza**: solo demuestra que cada suite envía lo que debe. El análisis exige el servidor real.

## 5. Límites de la edición abierta

Se usa solo lo incluido en la edición abierta: agentes, importación JUnit, Auto-Analysis, Pattern Analysis,
Unique Errors y ML suggestions. Funciones como *Quality Gates* son comerciales y no forman parte de esta integración.
