# E2E de un compañero (archivo `test.zip`)

Especificaciones de Serenity/JS con **Playwright Test** que llegaron en
`test.zip`. El archivo no dice quién las escribió. Cubren el login, el catálogo,
banear, desbanear y cancelar un pedido desde el panel de administración.

## Resultado contra esta aplicación

| Especificación | Qué comprueba | Resultado |
|---|---|---|
| `login.spec.ts` (2) | El esquema muestra "Email inválido"; con credenciales correctas llega a `/dashboard` | Pasan |
| `catalogo.spec.ts` | El catálogo muestra título, contador y al menos una tarjeta | Pasa |
| `banear-usuario.spec.ts` | El admin banea al primer usuario con un motivo y la tabla muestra "Baneado" | Pasa |
| `desbanear-usuario.spec.ts` | El admin banea y luego desbanea; vuelve a mostrar "Activo" | Pasa |
| `cancelar-pedido.spec.ts` | El admin cambia un pedido a CANCELLED y el badge dice "CANCELADO" | Pasa |
| `pendiente-codigo-del-companero/favoritos.spec.ts` | Página de favoritos vacía en `/favoritos` | **Falla a propósito** |

6 de 6 activas pasan (se corrieron dos veces seguidas). La de favoritos espera
una página `/favoritos` que este front no tiene (el back sí tiene
`/favorites`, pero no hay pantalla).

## Cómo correrlo

Requiere la aplicación encendida (front en `:8081`, API en `:3001`).

```bash
cd e2e/companero-test
npm install
npx playwright install chromium      # o CHROMIUM_PATH=/ruta/a/chrome
npm test                             # las 6 activas
npm run test:pendiente               # favoritos (falla a propósito)
```

Variables: `E2E_FRONT_URL`, `E2E_API_URL`, `E2E_ADMIN_EMAIL`,
`E2E_ADMIN_PASSWORD`, `E2E_CLIENT_EMAIL`, `E2E_CLIENT_PASSWORD`.

## Qué se cambió respecto al original

| Cambio | Por qué |
|---|---|
| `support/environment.ts` y `tasks/Navegar.ts` | Las direcciones estaban escritas como `http://localhost:5173` (servidor de desarrollo de Vite); ahora se leen de variables y apuntan a `:8081` |
| `playwright.config.ts` (nuevo) | El zip traía las especificaciones pero no la configuración de Playwright |
| `support/preparar-datos.ts` (nuevo) | Las pruebas suponían datos hechos a mano: el cliente `test@test.com`, un pedido para cancelar y ningún baneado. Ahora se crean por la API antes de correr |
| Ganchos `beforeEach`/`afterEach` en banear y desbanear | Las dos toman "el primer usuario de la tabla"; si una dejaba a alguien baneado, la siguiente fallaba. Antes de este cambio, `desbanear` fallaba cuando corría después de `banear` |

La lógica de cada prueba es la original.

## Cómo se comprobó que verifican lo correcto

Con la aplicación encendida se rompió a propósito una regla y se corrió la
suite. **6 de 6 daños fueron detectados**:

| Daño | Dónde | Especificaciones que fallaron |
|---|---|---|
| Banear no banea | back | banear, desbanear |
| Desbanear no desbanea | back | desbanear, login |
| Cambiar el estado de un pedido no cambia nada | back | cancelar pedido |
| El login lleva a `/` y no a `/dashboard` | front | banear, cancelar, desbanear, login |
| El mensaje de correo inválido cambia | front | login |
| El catálogo no pinta la cuadrícula | front | catálogo |

## Límites

`catalogo.spec.ts` es la más débil: comprueba que hay título, contador y alguna
tarjeta, pero no cuáles ni cuántas. Detecta un catálogo vacío o roto, no uno con
celulares equivocados.
