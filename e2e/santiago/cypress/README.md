# Pruebas E2E con Cypress — funcionalidades 13, 26, 27, 28, 29 y 30

Los mismos 32 casos de [`../serenityjs/`](../serenityjs/README.md), escritos
con **Cypress** y organizados con la misma idea de **Screenplay**: actores que
hacen tareas y preguntan por lo que ven. Cypress no trae Screenplay (es de
Serenity/JS), así que la estructura está armada a mano, con nombres iguales a
los de Serenity para que se pueda comparar archivo por archivo.

Corren contra la aplicación real encendida (front, API y base de datos). Cómo
levantarla: [`../README.md`](../README.md#1-levantar-celularpro).

## Cómo correrlas

```bash
cd e2e/santiago/cypress
npm install            # instala Cypress y descarga su navegador de pruebas
npm test               # las 32, sin abrir ventana (Electron)
npm run cy:open        # la ventana interactiva de Cypress, para ver cada paso
```

Por parte:

```bash
npm run test:web       # las 20 de la interfaz
npm run test:api       # las 12 de la API
npm run test:esc-13    # una sola funcionalidad (13, 26, 27, 28, 29 o 30)
npm run typecheck      # revisa los tipos de TypeScript sin correr nada
```

Las direcciones por defecto son las del `docker-compose.yml` del front. Si la
app corre en otro lado, se cambian con las mismas variables de Serenity:
`E2E_FRONT_URL` (<http://localhost:8081>), `E2E_API_URL`
(<http://localhost:3001/api/v1>), `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD`.

Requiere Node.js 22.22.2 o 24.15.0 en adelante dentro de esas ramas.

## Qué se prueba

| Archivo | Casos |
|---|---|
| `esc-13-recomendacion-productos.web.cy.ts` / `.api.cy.ts` | 4 de interfaz + 3 de API |
| `esc-26-banear-usuario.web.cy.ts` / `.api.cy.ts` | 3 + 2 |
| `esc-27-desbanear-usuario.web.cy.ts` / `.api.cy.ts` | 2 + 2 |
| `esc-28-consultar-usuarios.web.cy.ts` / `.api.cy.ts` | 4 + 2 |
| `esc-29-panel-estadisticas.web.cy.ts` / `.api.cy.ts` | 3 + 1 |
| `esc-30-administracion-catalogo.web.cy.ts` / `.api.cy.ts` | 4 + 2 |

El detalle de cada caso (qué hace Ana, qué ve Carlos) está en la tabla de
[`../README.md`](../README.md#qué-se-prueba) y en los archivos `.feature` de
Serenity: aquí es exactamente lo mismo.

## Estructura

```
cypress/
  e2e/                    → los casos: un archivo por funcionalidad y tipo
  support/
    e2e.ts                → antes de cada prueba: reparto y datos nuevos;
                            después: borra los celulares que se publicaron
    screenplay/           → actor.ts (Actor, libreta de notas), question.ts
                            (Questions y verificaciones), testData.ts, environment.ts
    tasks/                → lo que hace un actor (LogIn, BanUser, PublishPhone...)
    tasks/api/            → lo mismo, por la API (StartApiSession, BanViaApi...)
    questions/            → lo que el actor mira (UsersTable, Statistics...)
    ui/targets.ts         → los selectores, solo aquí
    ui/pages.ts           → cada pantalla, lista para usar con cy.get
```

| Pieza de Screenplay | En Serenity/JS | Aquí |
|---|---|---|
| Actor | `actorCalled('Ana')` | `actorCalled('Ana')` (`screenplay/actor.ts`) |
| Tarea | `Task.where(...)` | función `(actor) => { ... }` (`tasks/`) |
| Pregunta | `Text.of(...)`, `Question.about(...)` | `textOf(...)`, `textsOf(...)` (`screenplay/question.ts`) |
| Verificación | `Ensure.eventually(pregunta, equals(x))` | `actor.sees(pregunta).toEqual(x)` |
| Page object | `Target`, `PageElement` | `ui/pages.ts` |

Un caso se lee igual que en Gherkin:

```ts
ana.attemptsTo(LogIn.asAdministrator())
ana.attemptsTo(BanUser.called(carlos).because('Fraude en pagos'))
ana.sees(UsersTable.statusOf(carlos)).toEqual('Baneado')

carlos.attemptsTo(TryToLogIn.as(carlos))
carlos.sees(Messages.loginError()).toEqual('Tu cuenta ha sido suspendida. Motivo: Fraude en pagos')
```

## Detalles que conviene saber

- **Un solo navegador por prueba.** Serenity le da un navegador a cada actor;
  Cypress solo tiene uno. Cuando el navegador pasa de Ana a Carlos, el actor
  borra lo guardado (sesión, almacenamiento, cookies), como si fueran dos
  personas en dos computadores. Está en `Actor.takesTheBrowser()`.
- **Las esperas son automáticas.** `cy.get` y `.should` repiten la búsqueda
  hasta que se cumple o pasan 8 segundos; no hay `cy.wait(n)`. Por eso
  `actor.sees(...)` equivale al `Ensure.eventually` de Serenity.
- **Datos únicos por prueba**, igual que en Serenity: correos y slugs con un
  sufijo, cuentas y celulares preparados por la API, y los celulares
  publicados se borran al terminar (pase o falle la prueba).
- **Contraseñas fuera del reporte:** al iniciar sesión se escriben con
  `log: false`.
- Los diálogos `confirm()` del navegador (al eliminar un celular) los acepta
  Cypress automáticamente.
- Si una prueba falla, Cypress guarda una captura en `cypress/screenshots/`.

## Cómo se comprobó

- `npm run typecheck` sin errores.
- Las 32 pruebas se ejecutaron contra la app real (la misma que usan las de
  Serenity) tres veces seguidas, 32 de 32 cada vez, sin dejar celulares de
  prueba en el catálogo.
- **Mutación:** se cambió a propósito una expectativa o un selector (el
  saludo, el orden de las recomendaciones, el precio, la columna del estado,
  el clic de "eliminar") y la prueba correspondiente falló en cada caso.

> Esa comprobación se hizo en un entorno donde no se pudo instalar el binario
> de Cypress (su descarga estaba bloqueada), así que se ejecutó con un
> emulador de los comandos de Cypress (`cy.get`, `.should`, `.then`,
> `cy.request`...) sobre un Chromium real. La lógica y los selectores quedaron
> verificados contra la app; lo que solo se confirma con Cypress de verdad es
> el detalle del navegador (por ejemplo, cómo hace scroll antes de un clic).
> Por eso la primera corrida con `npm test` en tu máquina es la prueba final.
