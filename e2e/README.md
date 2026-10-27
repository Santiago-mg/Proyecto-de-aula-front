> **Heurísticas de usabilidad.** "Salir" pasó a "Cerrar sesión" y "Dashboard" a "Panel" en todos los casos.
> Nuevos: `features/heuristicas.feature` (5 escenarios Screenplay), `cypress/e2e/heuristicas.cy.ts` (13 casos)
> y Katalon TC27–TC29. Detalle en `../REFACTORIZACION-HEURISTICAS.md`.

> **Integración con Proyecto-de-aula-mario (octubre 2026).** Los casos se ajustaron
> al backend de Proyecto-de-aula-mario: correos `@gmail.com`, contraseña con
> mayúscula, minúscula y número, y sus mensajes de error. Se agregaron el escenario
> Serenity "Correo con un dominio no permitido", una fila más en el esquema de
> contraseñas y los casos Katalon **TC25** (dominio no permitido) y **TC26**
> (contraseña sin mayúscula). La evidencia de `evidencia/` es de la ejecución
> anterior contra otro backend: **hay que volver a generarla**.
>
> Verificación sin navegador contra este backend:
> `python3 verificar-localizadores.py ../src ../../Proyecto-de-aula-mario/src`

# CelularPro — pruebas E2E (Serenity/JS y Katalon)

Pruebas de extremo a extremo de las **6 funcionalidades**: registro de usuario, inicio de sesión, gestión de perfil, validación de credenciales, control de roles y alertas de stock bajo. Viven dentro del repositorio del frontend porque dependen de sus ids y textos.

| # | Funcionalidad | Serenity/JS (escenarios) | Katalon (casos) |
|---|---|---|---|
| 1 | Registro de usuario | `registro.feature` (6) | TC01 a TC04 |
| 2 | Inicio de sesión | `login.feature` (5) | TC05 a TC08 |
| 3 | Gestión de perfil | `perfil.feature` (4) | TC09 a TC12 |
| 4 | Validación de credenciales | `credenciales.feature` (3) | TC13 a TC15 |
| 5 | Control de roles | `roles.feature` (3) | TC16 a TC18 |
| 14 | Alertas de stock bajo | `alertas.feature` (7) | TC19 a TC24 |

Técnicas de los materiales del curso: patrón **Screenplay** (actores, tareas, interacciones, preguntas), Gherkin en español, **Selenese** para Katalon Recorder y **una sola entrada incorrecta a la vez** en los casos negativos de login.

## Cómo ejecutarlas

Necesitas el backend, el frontend y un navegador Chromium.

**Sin instalar Postgres** (recomendado para empezar), usando la base en memoria del backend:

```bash
# Terminal 1 — backend con base en memoria (admin@celularpro.co / admin1234)
cd <backend> && npm run dev:memoria            # http://localhost:3001

# Terminal 2 — frontend apuntando a ese backend
cd <frontend> && VITE_API_URL=http://localhost:3001/api/v1 npm run dev -- --port 5173
```

**Serenity/JS:**

```bash
cd e2e/serenityjs
npm ci
npx playwright install chromium         # una vez
npm test                                # los 35 escenarios + reporte en reports/serenity-js
npm run test:smoke                      # solo los @smoke
npm run test:alertas                    # una funcionalidad (también registro, login, perfil, credenciales, roles)
```

> **No pases `--format` a cucumber-js.** Reemplaza el formato configurado y desactiva el adaptador de Serenity: los escenarios dejan de aislarse (comparten navegador y sesión) y fallan en cascada.

Variables: `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `HEADLESS=false`, y para un Chromium propio `CHROMIUM_PATH` y `CHROMIUM_ARGS` (en contenedores: `--no-sandbox --disable-gpu --disable-dev-shm-usage`; **sin** `--single-process`, que es inestable).

**Katalon Recorder:** instala la extensión, *Test Suite → Open Test Suite* y elige `katalon/Suite_CelularPro_Completa.html` (o la de humo). La dirección base está en la primera fila de cada caso.

**Sin la extensión** (CI, equipos sin interfaz): `katalon/ejecutar-selenese.cjs` interpreta los mismos archivos con Playwright y deja evidencia en `katalon/evidencia/`:

```bash
cd e2e/katalon && npm i playwright-core        # una vez
node ejecutar-selenese.cjs                      # suite completa + caso fallido a propósito
```

## Evidencia incluida

| Qué | Dónde | Resultado |
|---|---|---|
| Serenity/JS, 35 escenarios | `evidencia/serenity-js/` (reporte HTML) y `evidencia/serenity-resumen.txt` | ver `evidencia/RESULTADOS.md` |
| Katalon (ejecutor Selenese), 25 casos | `katalon/evidencia/` (capturas, `resultados.md/json`) | ver `evidencia/RESULTADOS.md` |

**Dónde se ejecutó:** Chromium 153 en un equipo de 1 núcleo, frontend con Vite, **código real del backend con base de datos en memoria** (no Postgres). Conviene repetir en tu entorno con Postgres antes de entregar.

### Actividad de la Clase 18: un caso aprobado y uno fallido

`katalon/Suite_Falla_Controlada.html` contiene `TC99_FALLA_CONTROLADA_login_clave_incorrecta`: es el TC06 con el texto esperado cambiado a propósito, así que **debe salir en rojo**. Con el ejecutor, esa es la línea `Failed (debía fallar)`.

## Verificación sin navegador

`python3 verificar-localizadores.py ../src <backend>/src` comprueba que cada id, clase, texto de botón y mensaje que usan las pruebas **existe** en el código, incluidos los títulos que el CSS muestra en mayúsculas. Se corre también en CI (`.github/workflows/e2e-estatico.yml`).

## Lecciones que ya costaron tiempo

- **Texto en mayúsculas:** `Dashboard` y `Alertas de inventario` se *muestran* como `DASHBOARD`. Selenium/Katalon y Serenity leen el texto mostrado y distinguen mayúsculas; por eso se usa XPath (DOM) o `regexpi:`/minúsculas.
- **`isVisible()` de Serenity exige estar dentro de la ventana:** los campos de formularios largos quedan debajo del borde. Las tareas esperan que el campo *exista* y se desplazan hasta él.
- **El aviso de confirmación dura unos 3 s:** se verifica de inmediato, no tras otras acciones.

## Pendiente

- Un caso E2E para el cambio de rol de otra persona (hoy cubierto por pruebas de integración y `AdminUsers`).
- Ejecutar contra Postgres real y en el navegador de tu equipo.
