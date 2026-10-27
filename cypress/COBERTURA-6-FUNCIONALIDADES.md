# Cypress — cobertura de las 6 funcionalidades

Funcionalidades: **registro de usuario, inicio de sesión, gestión de perfil, validación de credenciales,
control de roles y alertas de stock bajo**.

| Suite | Archivo(s) | Pruebas | Comando |
|---|---|---|---|
| E2E | `e2e/acceso.cy.ts`, `e2e/perfil-y-roles.cy.ts`, `e2e/alertas-de-stock.cy.ts` | 27 | `npm run cy:e2e` |
| UI / usabilidad | `e2e/heuristicas.cy.ts` | 12 | `npm run cy:e2e` |
| Accesibilidad (WCAG 2.1 AA, axe-core en navegador real) | `e2e/accesibilidad.cy.ts` | 8 | `npm run cy:accesibilidad` |
| API, seguridad y regresión | `api/contrato-y-seguridad.cy.ts` | 22 | `npm run cy:api` |
| Componentes | `component/*.cy.tsx` | 11 | `npm run cy:component` |
| **Gherkin + Screenplay** | `gherkin/features/*.feature` (6 características) | **20 escenarios** | `npm run cy:gherkin` |
| **Total** | | **100** | |

## Por funcionalidad y tipo de prueba

✔ = hay pruebas de ese tipo. Entre paréntesis, ejemplos de casos exitosos (E), alternativos (A) y de error (X).

| Funcionalidad | E2E | API | Seguridad | Regresión | Accesibilidad | UI / componentes | Gherkin |
|---|---|---|---|---|---|---|---|
| Registro de usuario | ✔ (E: datos válidos · X: confirmación distinta, correo repetido, dominio no permitido) | ✔ 201, campos públicos | ✔ no se asigna ADMIN al registrarse; JSON malformado → 400; 300 KB → 413 | ✔ correo en minúsculas; dominio no permitido → 400 | ✔ vacío y con errores | ✔ PasswordInput; requisitos en vivo | ✔ 01-registro (E + 3 X) |
| Inicio de sesión | ✔ (E: correcto · A: correo en mayúsculas · X: clave incorrecta, correo inexistente) | ✔ 401 con el mismo mensaje | ✔ no revela si la cuenta existe; 429 con `Retry-After` | ✔ mismo mensaje en ambos casos | ✔ formulario y error | ✔ ayuda desde Ingresar | ✔ 02-inicio-sesion (E, A, X) |
| Gestión de perfil | ✔ (E: cambiar nombre y contraseña · X: nombre vacío, actual incorrecta, nueva débil) | ✔ `PATCH /auth/me`, `PUT /auth/me/password` → 204 | ✔ rol y correo se ignoran (asignación masiva) | ✔ actual incorrecta → 400 (no 401) | ✔ Mi cuenta y Mi perfil | ✔ Descartar cambios | ✔ 03-perfil (E, A, X) |
| Validación de credenciales | ✔ (X: sesión corrupta, sin sesión; E: cerrar sesión) | ✔ token mal formado → 401 | ✔ `Cache-Control: no-store`, cabeceras de helmet | ✔ reglas iguales al backend | ✔ registro con requisitos a medias | ✔ requisitos y dominios antes de enviar | ✔ 04-credenciales (4 ejemplos + X) |
| Control de roles | ✔ (E: admin entra · X: cliente → no autorizado, sin sesión → login) | ✔ alertas solo para admin | ✔ banear a otro admin → 403 | ✔ regla H7.1 en el backend | ✔ Acceso no autorizado | — | ✔ 05-roles (2 X + API 403) |
| Alertas de stock bajo | ✔ (E: reponer cierra la alerta; aviso en el panel · A: stock 6 > mínimo 5 sin alerta · X: umbral negativo) | ✔ campos que consume el panel | ✔ cliente sin acceso | ✔ umbral inclusivo | ✔ panel de alertas | ✔ AdminAlerts, AlertBadge (y HTML no interpretado) | ✔ 06-alertas (pantalla = API; X cliente) |

## Gherkin con Cypress y Screenplay

`cypress/gherkin/` ejecuta escenarios en **español** (`# language: es`, Dado–Cuando–Entonces) con
`@badeball/cypress-cucumber-preprocessor` 23.2.1, y los pasos solo delegan en el patrón Screenplay:

```
screenplay/actor.ts          Actor: puede(habilidades), intentaQue(tareas), pregunta(preguntas), recuerda/recordado
screenplay/habilidades.ts    NavegarLaWeb, LlamarALaApi
screenplay/interacciones.ts  Visitar, Escribir, Pulsar, PedirALaApi
screenplay/tareas.ts         CrearCuenta, IniciarSesion, CambiarSuNombre, CambiarSuContrasena, TenerUnaCuentaDeCliente…
screenplay/preguntas.ts      LaRutaActual, ElTitulo, ElErrorDelCampo, ElRequisito, LasAlertasEnPantalla, LaRespuestaDeLaApi…
pasos/                       definiciones de pasos (Given/When/Then) que solo usan lo anterior
```

`node scripts/verificar-gherkin.mjs` comprueba sin navegador que cada paso tenga exactamente una definición
(resultado actual: 6 características, 20 escenarios ejecutables, 81 pasos, 29 definiciones, ninguna sin usar).

Evidencia al ejecutar: `cypress/gherkin/reportes/cucumber.html` (reporte de Cucumber) y capturas de los fallos.

> El patrón Screenplay también está en `e2e/serenityjs/` (Serenity/JS + Playwright, 35 escenarios). Las dos
> implementaciones cubren las mismas funcionalidades con herramientas distintas.
