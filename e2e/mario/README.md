# E2E de Mario (Serenity/JS + Cucumber + Katalon)

Suite traída del proyecto de Mario y adaptada a este. Serenity/JS + Cucumber
(Gherkin en español) + Playwright con el patrón Screenplay. Es un proyecto
aparte del front para que sus dependencias no entren al build de producción.

## Resultado contra esta aplicación

26 escenarios en seis funcionalidades. **13 aplican a este proyecto y pasan;
13 están pendientes** porque verifican funciones que esta aplicación no tiene.

| Funcionalidad | Activos | Pendientes |
|---|:-:|:-:|
| Registro de usuario | 2 | 0 |
| Inicio de sesión | 2 | 1 (correo con mayúsculas) |
| Validación de credenciales | 5 | 3 (reglas de composición de la contraseña) |
| Control de roles | 4 | 0 |
| Gestión de perfil | 0 | 4 (no existe la página `/profile`) |
| Alerta de stock bajo | 0 | 5 (el panel no muestra alertas de stock) |
| **Total** | **13** | **13** |

Casos de Katalon Recorder (`katalon/`): **3 de 6 activos** (TC01 registro, TC02
inicio de sesión, TC05 roles) y 3 pendientes (TC03, TC04, TC06).

## Cómo correrlo

Requiere la aplicación encendida (front en `:8081`, API en `:3001`) y Node 22
o 24.

```bash
cd e2e/mario
npm ci
npx playwright install chromium     # o CHROMIUM_PATH=/ruta/a/chrome
npm test                            # los 13 escenarios activos
npm run test:registro               # una funcionalidad
npm run test:inicio-sesion
npm run test:validacion-credenciales
npm run test:control-roles
npm run test:smoke                  # un escenario por funcionalidad
npm run test:katalon                # los 3 casos Katalon activos
npm run test:pendiente              # los 13 escenarios pendientes (fallan a propósito)
npm run test:katalon:pendiente      # los 3 casos Katalon pendientes (fallan a propósito)
npm run test:report                 # reporte HTML de Serenity
```

Con el navegador visible: `HEADLESS=false npm test`.

Variables: `E2E_FRONT_URL` y `E2E_API_URL` cambian las direcciones;
`E2E_SIMULADO=true` usa la API en memoria de Mario (ver abajo).

## Qué se cambió respecto al original

Solo código de prueba; no se tocó la lógica del front ni del back.

| Cambio | Por qué |
|---|---|
| El modo **real** es el predeterminado (`support/config.ts`, `scripts/build-front.js`) | El original usaba por defecto una API simulada con las reglas del back de Mario. Aquí interesa probar la API de este proyecto. |
| `screenplay/ui/Paginas.ts`: el error del servidor se busca con `form [role="alert"]` y el buscador de usuarios por su placeholder | El front de Mario tiene `data-testid="error-servidor"` y `aria-label="Buscar usuarios"`; este no. Para tener algo estable a lo que apuntar se agregó `role="alert"` a `ErrorMessage.tsx` (los lectores de pantalla anuncian así el error) |
| `screenplay/tasks/Tareas.ts`: al cambiar un rol espera a que el filtro deje **una** fila | Aquí la tabla se vuelve a pintar 0,4 s después de escribir en el buscador y el botón desaparecía justo al hacerle clic |
| `perfil-roles-stock.steps.ts`: el título del panel es "Dashboard", no "Panel" | Texto distinto de la pantalla |
| `support/credenciales-de-mario.ts` | Copia de las reglas de contraseña y dominios que la API simulada importaba del front de Mario |
| Rutas (`../../..`) y carpeta `evidencias/` dentro de `e2e/mario` | La suite pasó de `frontend/e2e` a `e2e/mario` |
| Etiqueta `@pendiente-codigo-de-mario` y el perfil `pendiente` de `cucumber.yaml` | Separa lo que no aplica de la corrida normal |
| `katalon/*.html`: mismos dos localizadores que arriba, y TC05 espera el título del panel en lugar de `[data-alertas-cargadas]` | Marcas que solo existen en el front de Mario |

## Cómo se comprobó que verifican lo correcto

Con la aplicación encendida se rompió a propósito una regla y se corrió la
funcionalidad correspondiente. **7 de 7 daños fueron detectados**, y después se
restauró el código y se reconstruyó la app:

| Daño | Dónde | ¿Falló alguna prueba? |
|---|---|:-:|
| El registro acepta cualquier dominio de correo | front | Sí |
| Un cliente puede entrar al panel de administración | front | Sí |
| "Cerrar sesión" no cierra la sesión | front | Sí |
| El registro permite repetir un correo | back | Sí |
| El login acepta cualquier contraseña | back | Sí |
| Una cuenta suspendida puede ingresar | back | Sí |
| Cambiar el rol no cambia nada | back | Sí |

## Qué falta para activar los pendientes

| Pendiente | Qué haría falta en este proyecto |
|---|---|
| Correo con mayúsculas | Que el back pase el correo a minúsculas al iniciar sesión. Hoy una cuenta creada como `ana@gmail.com` no entra escribiendo `ANA@gmail.com` |
| Reglas de contraseña (mayúscula, minúscula, número) | Hoy solo se exigen 8 caracteres, tanto en el front como en el back |
| Gestión de perfil | La página `/profile` y los endpoints `PATCH /auth/me` y `PUT /auth/me/password` |
| Alerta de stock bajo | Un panel de alertas en el dashboard (el back ya tiene `GET /admin/alerts`) y el campo de stock mínimo en el formulario del celular |

Cada una cambia lo que hace la aplicación, por eso no se hizo sin decidirlo
antes.

## Modo simulado (opcional)

`E2E_SIMULADO=true npm test` compila el front contra `support/api-simulada.ts`,
una API en memoria con las reglas del back de Mario, y la sirve en el puerto
4174. No necesita base de datos, pero prueba este front contra el back de Mario
y no contra el de este proyecto, así que **no se usó para verificar**.

## Lo que no se revisó

La carpeta `calidad/` (barridos de accesibilidad y de interfaz de Mario) y
`scripts/evidencias.js` vienen del original sin adaptar ni verificar: quedan
fuera de lo pedido (regresión y E2E).
