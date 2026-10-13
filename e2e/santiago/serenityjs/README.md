# Pruebas E2E con Serenity/JS, Playwright y Cucumber

Pruebas de extremo a extremo de las funcionalidades 13, 26, 27, 28, 29 y 30
de CelularPro con el patrón Screenplay. Tiene la misma estructura del
repositorio del curso
([serenityjs-e2e-testing](https://github.com/mauricioramirezv/serenityjs-e2e-testing)),
las mismas versiones y los mismos comandos. La diferencia es el sistema que se
prueba: aquí no hay una app de demostración, sino CelularPro real (front, API
y base de datos).

Antes de correrlas, la app tiene que estar encendida: ver
[`../README.md`](../README.md#1-levantar-celularpro).

## Arquitectura

| Componente | Responsabilidad | Ubicación |
|---|---|---|
| Actor y abilities | Navegar, llamar a la API y tomar notas | `features/support/serenity.config.ts` |
| Features | Los casos, en Gherkin, uno por funcionalidad | `features/esc-*.feature` |
| Step definitions | Conectan cada frase del Gherkin con Screenplay | `features/step-definitions/` |
| Hooks | Datos nuevos por escenario y limpieza al final | `features/support/hooks.ts` |
| Tasks | Lo que hace un actor, en lenguaje del negocio | `test/tasks/` (interfaz) y `test/tasks/api/` |
| Questions | Lo que el actor consulta para verificar | `test/questions/` |
| Lean Page Objects | Dónde está cada cosa en la pantalla | `test/ui/` |
| Configuración y datos | Direcciones de la app y datos de prueba | `test/support/` |

Los steps no tienen selectores ni llamadas directas a Playwright: toda la
automatización está en tareas, interacciones y preguntas.

### Los actores

| Actor | Quién es | Qué puede hacer |
|---|---|---|
| Ana | Administradora (la cuenta del seed) | Navegador y API |
| Carlos, Bruno | Clientes. Su cuenta se crea por la API en cada escenario | Navegador y API |
| Valeria | Visitante de la tienda, sin sesión | Navegador |
| Api | Un consumidor de la API sin sesión | API |

Cada actor tiene su propio navegador (su propia sesión). En "Ana banea a
Carlos y Carlos ya no puede entrar" son dos personas en dos computadores.

### De la frase al clic: un ejemplo

```gherkin
When ella banea a Carlos con el motivo "Fraude en pagos"
```

1. `features/step-definitions/esc-26-27-28-usuarios.steps.ts` recibe a la
   actora (Ana) y al cliente (Carlos) y le pide a Ana la tarea
   `BanUser.called(carlos).because('Fraude en pagos')`.
2. `test/tasks/ManageUsers.ts` dice qué es "banear": abrir la gestión de
   usuarios, buscar el correo de Carlos, pulsar "Banear" en su fila, escribir
   el motivo y confirmar.
3. `test/ui/UsersPage.ts` dice dónde está cada cosa: la fila es la que tiene
   el correo de Carlos y el botón es el que dice "Banear" en esa fila.

## Requisitos

- Node.js 22.22.2 o 24.15.0 en adelante dentro de esas ramas.
- npm.
- CelularPro encendido (ver `../README.md`).

## Instalación

Desde esta carpeta:

```bash
npm install
npx playwright install chromium
```

Si Playwright pide componentes del sistema en Linux:

```bash
npx playwright install --with-deps chromium
```

## Ejecutar las pruebas

Todas (web y API):

```bash
npm test
```

Una funcionalidad, por su etiqueta:

```bash
npm test -- --tags @esc-26
```

Solo el flujo esencial de cada funcionalidad:

```bash
npm run test:smoke
```

Solo las de la interfaz, o solo las de la API:

```bash
npm run test:web
npm run test:api
```

Un escenario por nombre:

```bash
npm test -- --name "Un cliente baneado ya no puede iniciar sesión"
```

Ver el navegador mientras corre:

```bash
HEADLESS=false npm run test:web
```

En PowerShell:

```powershell
$env:HEADLESS = "false"
npm run test:web
Remove-Item Env:HEADLESS
```

Revisar TypeScript sin ejecutar nada:

```bash
npm run typecheck
```

## Reporte

Cada ejecución deja el reporte en:

```text
reports/serenity-js/index.html
```

Para verlo en el navegador:

```bash
npm run test:report
```

Y luego <http://localhost:8080>. El reporte muestra cada escenario paso a
paso, con las peticiones a la API y una captura del navegador cuando un paso
falla.

## Escenarios incluidos

| Archivo | Web | API |
|---|---:|---:|
| `esc-13-recomendacion-productos.feature` | 4 | 3 |
| `esc-26-banear-usuario.feature` | 3 | 2 |
| `esc-27-desbanear-usuario.feature` | 2 | 2 |
| `esc-28-consultar-usuarios.feature` | 4 | 2 |
| `esc-29-panel-estadisticas.feature` | 3 | 1 |
| `esc-30-administracion-catalogo.feature` | 4 | 2 |
| **Total** | **20** | **12** |

El ESC-13 usa un `Scenario Outline` (el equivalente de
`@pytest.mark.parametrize`): el mismo caso con stock 3, donde el celular
aparece, y con stock 0, donde no aparece.

## Detalles que vale la pena saber

Son cosas que aparecieron al automatizar CelularPro y que no estaban en el
ejemplo del curso:

- **`isPresent()` en vez de `isVisible()` para esperar.** Para Serenity/JS,
  "visible" quiere decir que se ve sin hacer scroll. La sección "También te
  puede interesar" está al final de la ficha, así que nunca sería "visible"
  aunque esté cargada.
- **Texto en mayúsculas.** El CSS muestra en mayúsculas los nombres de los
  celulares y las insignias ("IPHONE 14", "BANEADO"). `Text.of` lee el texto
  tal como se ve; para comparar con el nombre real se usa
  `test/questions/TextAsWritten.ts`, que lee el texto del HTML.
- **Rutas de la API sin `/` al principio.** `CallAnApi` resuelve
  `/phones` desde la raíz del servidor y se pierde el `/api/v1`. Por eso las
  tareas usan `phones`, `auth/login`...
- **El token se guarda en las notas del actor.** `StartApiSession` inicia
  sesión por la API y anota el token con `notes()`; las peticiones siguientes
  lo leen de ahí (`withTheToken()`).
- **Diálogo de confirmación.** Para borrar un celular la página usa
  `confirm()`. Playwright lo rechaza por defecto, así que `DeletePhone`
  avisa antes con `ModalDialog.acceptNext()`.

## Buenas prácticas aplicadas

- steps sin selectores ni lógica de automatización;
- tareas pequeñas y con nombres del negocio (`BanUser`, `PublishPhone`);
- datos únicos por escenario y limpieza al final, pase o falle;
- preparación de datos por la API y verificación por la interfaz;
- contraseñas enmascaradas en el reporte (`Masked.valueOf`);
- pruebas web y API con los mismos actores;
- TypeScript estricto;
- `node_modules`, navegadores y reportes fuera de Git.
