# Pruebas de regresión — funcionalidades 13, 26, 27, 28, 29 y 30 (front)

Esta carpeta adapta el repositorio del curso
[RegressionTesting](https://github.com/mauricioramirezv/RegressionTesting) a la
interfaz de CelularPro, con las mismas cuatro categorías: regresión funcional,
API, rendimiento y seguridad. Es la contraparte de `tests/regresion` del back:
allá se prueba la API, aquí lo que ve y hace el administrador (o el cliente,
en el caso del ESC-13).

| ESC | Funcionalidad | Dónde vive en el front |
|---|---|---|
| 13 | Recomendación de productos | Sección "También te puede interesar" al final de `/phones/:slug` (`SimilarPhones.tsx`) |
| 26 | Banear usuario | `/admin/users` → botón "Banear" → modal |
| 27 | Desbanear usuario | `/admin/users` → botón "Desbanear" |
| 28 | Consultar usuarios | `/admin/users`: carga, buscador y paginación |
| 29 | Panel de estadísticas | `/admin` (panel principal) y `/admin/stats` |
| 30 | Administración del catálogo | `/admin/phones`, `/admin/phones/new`, `/admin/phones/:id/edit` |

No hace falta el back encendido: igual que el resto de la suite, solo se
reemplaza la red por el doble de `test/helpers/servidor.ts`. El router, los
contextos, los servicios, los interceptores de `api.ts` y las páginas corren
de verdad.

## La funcionalidad 13 se construyó con estas pruebas

Cuando se armó esta suite, el front todavía no tenía la funcionalidad 13 (el
back sí: `GET /phones/:slug/similares`). Se hizo como el ejercicio 4 del curso:
primero las pruebas de `api-testing/esc-13` y `regression-testing/esc-13`, se
comprobó que fallaban por la razón correcta (`getSimilar is not a function`,
no existe la sección) y después la implementación mínima:

- `phonesService.getSimilar(slug, limit = 4)` en `src/services/phones.service.ts`.
- `src/components/phones/SimilarPhones.tsx`: pide 4 recomendaciones y las
  muestra con la misma tarjeta del catálogo. Si no hay ninguna o la petición
  falla, la sección no aparece (nunca rompe la ficha). Si el cliente cambia de
  celular, descarta las recomendaciones anteriores y cualquier respuesta vieja
  que llegue tarde.
- Una línea en `src/pages/PhoneDetail.tsx` que la monta al final de la ficha.

## Defectos que encontró esta suite

Al probar el recorrido completo (ver un celular → abrir una recomendación)
aparecieron dos defectos. Igual que en el back, primero la prueba, después
comprobar que fallaba por la razón correcta y por último la corrección:

| Código | Qué pasaba | Corrección |
|---|---|---|
| DEF-13-01 | La ficha es la misma pantalla para todos los celulares, así que al abrir una recomendación conservaba el color, la cantidad y la foto del celular anterior. Con un iPhone 15 en Azul x3, un equipo sin colores y con 1 en stock se agregaba al carrito "en Azul" y con 3 unidades. | `PhoneDetail.tsx` monta una ficha nueva por cada slug (`key={slug}`) y vuelve al inicio de la página, porque las recomendaciones están al final. |
| DEF-13-02 | Si el back respondía 200 pero con una página HTML (un proxy o el hosting contestando en lugar de la API), la sección intentaba leer la lista y se caía la ficha completa. | `SimilarPhones.tsx` solo acepta un arreglo; cualquier otra cosa cuenta como "sin recomendaciones". |

## Cómo correrlas

Desde la raíz del front:

```bash
npm run test:regresion:santiago        # las 4 categorías, con resumen al final
npm run test:regresion:santiago -- esc-26   # solo la funcionalidad 26, en las 4 categorías

npm run test:regresion:funcional       # solo regression-testing
npm run test:regresion:api             # solo api-testing
npm run test:regresion:performance     # solo performance-testing
npm run test:regresion:seguridad       # solo security-testing
```

Una prueba puntual por nombre: `npx vitest run test/regresion/santiago -t "debounce"`.

El resumen final queda así:

```text
regression-testing:              53 passed
api-testing:                     37 passed
performance-testing:             27 passed
security-testing:                47 passed
Total:                          164 passed

Todas las suites finalizaron correctamente.
```

También están dentro de `npm test` (se agregaron al `include` de
`vitest.config.ts`), así que Jenkins las corre en cada cambio.

## Estructura

```text
test/regresion/santiago/
├── ejecutar.mjs              el equivalente de run_all_tests.py
├── helpers/
│   ├── medicion.ts           medir(), repetir(), mediana()
│   ├── promesas.ts           capturarError(), respuestaDiferida()
│   └── seguridad.ts          payloads XSS y quién no puede entrar al panel
├── regression-testing/       esc-13 … esc-30
├── api-testing/              esc-13 … esc-30
├── performance-testing/      esc-13 … esc-30
└── security-testing/         esc-13 … esc-30
```

## Cuántas pruebas hay

| ESC | Regresión | API | Performance | Seguridad | Total |
|---|---:|---:|---:|---:|---:|
| 13 | 8 | 8 | 5 | 5 | 26 |
| 26 | 6 | 6 | 4 | 12 | 28 |
| 27 | 4 | 4 | 4 | 5 | 17 |
| 28 | 7 | 7 | 4 | 6 | 24 |
| 29 | 16 | 4 | 6 | 8 | 34 |
| 30 | 12 | 8 | 4 | 11 | 35 |
| **Total** | **53** | **37** | **27** | **47** | **164** |

## Qué revisa cada categoría

**regression-testing** — los flujos completos en la interfaz con AAA: la
sección de recomendaciones al final de la ficha (y que al abrir una se limpie
lo elegido en la anterior), banear
(el modal identifica al usuario, se cierra, la fila queda "Baneado" con su
motivo), desbanear, el ciclo banear → desbanear en la misma pantalla, la
paginación y el buscador, los formatos de dinero del panel (`$50.000.000 COP`,
`$1.5M COP`), las etiquetas "—" / "1 venta" / "3 ventas", la altura de cada
barra y el formulario de celulares con sus validaciones y valores límite.

**api-testing** — el contrato del cliente HTTP del front con el back: qué
petición sale (método, URL, parámetros, cuerpo y cabecera `Authorization`),
cómo se desenvuelve la respuesta y qué llega a la pantalla cuando el back
responde 400, 403, 404, 409 o 500, o cuando no hay conexión.

**performance-testing** — que la pantalla no haga trabajo de más: escribir
"ana torres" en el buscador produce una sola búsqueda y no diez (debounce de
400 ms, y pasado otro intervalo completo sigue habiendo una sola), banear o
desbanear actualiza solo la fila sin recargar la lista, el panel pide las
estadísticas una sola vez, la ficha no espera a las recomendaciones. Además
hay presupuestos de tiempo (1 s, amplio porque jsdom es más lento que un
navegador) y una comparación por mediana: pintar 50 usuarios (el máximo que
devuelve el back) cuesta menos de 15 veces lo que cuestan 5. Si el pintado es
lineal no pasa de 10; uno cuadrático se iría hacia 100. Las mediciones se
intercalan (5, 50, 5, 50…) para que una pausa del equipo afecte a las dos
series por igual.

**security-testing** — el control de acceso del panel (sin sesión se va a
`/login`, un USER a `/unauthorized`, y en ninguno de los dos casos sale una
petición al back), que el admin no tenga botón para banearse a sí mismo, que
el modal aplique la misma regla del motivo que el back, que todo lo que
escriben los usuarios (nombres, correos, motivos, nombres de celulares) se
pinte como texto y nunca como HTML (es la prueba de `sanitizar_entrada` del
curso, pero sobre React), que un 500 no muestre el detalle interno del
servidor y que un 401 borre la sesión.

## Equivalencias con el repositorio del curso

| Curso (Python) | Aquí (TypeScript + React) |
|---|---|
| `pytest` | `vitest` (con jsdom) |
| `@pytest.mark.parametrize` | `it.each` / `describe.each` |
| `assert_that(...)` (PyHamcrest) | `expect(...)` (Chai) |
| `TestClient(app)` | la app completa con `abrirApp(ruta)` y la red simulada |
| `sanitizar_entrada()` | React escapa lo que se pinta con `{variable}`; se prueba con payloads XSS |
| `time.perf_counter()` / `timeit.repeat()` / `statistics.median()` | `medir()` / `repetir()` / `mediana()` |
| `run_all_tests.py` | `npm run test:regresion:santiago` |

## Actividad: defectos controlados (ejercicio 3 del curso)

Igual que en el back, introduje uno por uno estos defectos en el código del
front y corrí la suite. Los siete se detectaron; después de cada uno se
restauró el código original.

| ESC | Defecto introducido | Pruebas que fallan | Dónde |
|---|---|---:|---|
| 13 | Se acepta la respuesta tardía de un celular anterior | 1 | performance |
| 13 | El slug deja de codificarse en la URL | 3 | seguridad |
| 26 | El modal deja de recortar el motivo antes de validarlo | 1 | seguridad |
| 27 | Tras banear o desbanear se recarga toda la lista | 13 | performance y regresión de 26 y 27 |
| 28 | El buscador busca en cada tecla (sin debounce) | 2 | performance, seguridad |
| 29 | Una semana sin ventas divide por cero en las barras | 1 | regresión |
| 30 | Las líneas vacías de características se envían al back | 1 | regresión |

Uno de ellos sirvió para mejorar una prueba: con el slug sin codificar, la
prueba de seguridad del ESC-13 fallaba, pero el error de axios se escapaba y
Vitest solo mostraba un `DataCloneError` que no decía nada. Se ajustó para
que falle con la URL real en el mensaje
(`expected [ '/phones/../admin/stats/similares' ] to deeply equal [...]`).

## FIRST

- **Fast:** sin back ni navegador real; la red es un doble.
- **Independent:** `test/setup.ts` limpia el doble, el `localStorage` y la URL
  antes de cada prueba.
- **Repeatable:** las respuestas lentas se simulan con `respuestaDiferida()`,
  que el test entrega cuando quiere, en vez de esperar tiempos al azar.
- **Self-validating:** todas terminan en aserciones.
- **Timely:** la funcionalidad 13 se escribió después de sus pruebas, y sus
  dos defectos (DEF-13-01 y DEF-13-02) se corrigieron igual: prueba primero.

## Alcance

Los presupuestos de tiempo se miden en jsdom, no en un navegador real, y son
amplios a propósito para no fallar en Jenkins. Las pruebas de seguridad del
front no reemplazan las del back: el front esconde botones y escapa texto,
pero quien protege los datos es la API.
