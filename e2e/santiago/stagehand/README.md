# Pruebas E2E con Stagehand — CelularPro

Tercera herramienta de IA del curso de pruebas (las otras dos: Katalon Studio con IA y Argos). Cubre mis funcionalidades: **ESC-13** (recomendación de productos) y **ESC-26 a ESC-30** (banear, desbanear, consultar usuarios, estadísticas y gestión del catálogo).

Está armado sobre el ejemplo del profesor ([Stagehand-E2E-AI](https://github.com/mauricioramirezv/Stagehand-E2E-AI)): Stagehand 4.3.0 con `localBrowser`, los mismos tres proveedores de modelo (**OpenAI, Google Gemini y Ollama local**, con su adaptador `ollama-client.ts`), las mismas variables del `.env`, `act` con variables, `observe` y `extract` con esquema zod. La IA se usa para encontrar y manipular controles; **el resultado lo decide una aserción determinista**, nunca el modelo.

## Qué es Stagehand y por qué se usó

[Stagehand](https://github.com/browserbase/stagehand) (Browserbase) maneja un navegador real con instrucciones en lenguaje natural. En vez de escribir `cy.get('#motivo-baneo').type(...)`, se le dice qué hacer y un modelo de lenguaje decide qué elemento tocar. Tiene tres operaciones, y las pruebas usan las tres:

| Operación | Qué hace | Ejemplo en este proyecto |
|---|---|---|
| `act` | Hace una acción en la página | `pulsa el botón Confirmar baneo` |
| `observe` | Busca elementos y dice qué se podría hacer con ellos, sin tocar nada | `el botón Banear de la fila del usuario carlos.sh.…@gmail.com` |
| `extract` | Lee datos de la pantalla y los devuelve con la forma de un esquema (zod) | el estado y el motivo de baneo de una fila |

Lo que se gana frente a Cypress/Serenity: las pruebas no dependen de selectores CSS (si cambia una clase o un `id`, la instrucción sigue valiendo mientras el texto visible se mantenga) y `extract` permite comparar lo que **ve una persona** con lo que dice la API. Lo que se pierde: velocidad, costo por llamada y que el resultado no es 100 % determinista (ver Análisis).

## Cómo está armado

```
stagehand/
├── src/
│   ├── entorno.ts         # proveedor de IA, direcciones y credenciales (desde .env)
│   ├── ollama-client.ts   # adaptador de Ollama (del ejemplo del profesor)
│   ├── api.ts             # llamadas directas a la API: preparan datos y sirven de "verdad"
│   └── sesion.ts          # navegador + Stagehand; anota cada llamada (tiempo, tokens, captura)
├── tests/                 # 00-humo + un archivo por escenario
├── scripts/
│   ├── correr.ts          # corre las pruebas con el proveedor elegido y guarda el junit
│   └── resumen.ts         # junta todo en resultados/RESUMEN.md
├── resultados/<proveedor>/    # un JSON por sesión + junit
└── evidencias/<proveedor>/    # capturas de pantalla por paso
```

Decisiones que ayudan a que las pruebas sean confiables:

- **La API es el oráculo.** Los datos se preparan por API (crear un usuario, banearlo) y el resultado se verifica contra la API. El modelo puede leer mal una pantalla; la base de datos no. Si `extract` y la API no coinciden, la prueba falla.
- **La IA no decide lo que el navegador sabe.** Antes de que el modelo lea o toque algo se espera (por DOM) a que la pantalla termine de cargar —la búsqueda de usuarios espera 0,4 s y luego consulta—, y datos como «el botón está deshabilitado» o «cuántas filas hay» se leen del navegador. El modelo se usa para encontrar controles y copiar textos.
- **Una acción por `act`.** Stagehand falla más cuando se le piden varias cosas en una sola instrucción.
- **`observe` y luego `act(acción)`.** Se localiza el botón de la fila con `observe` y se ejecuta la acción que devolvió: así se pulsa justo el botón de *esa* persona y no el de otra fila.
- **Credenciales como variables.** `act('escribe %clave% …', { clave })` escribe el valor en la página pero el modelo solo ve el nombre `%clave%`. La contraseña del admin no sale del computador.
- **Sin caché** (`cache: false`) y **datos únicos por corrida** (`unico()`): los correos y slugs nunca chocan con los de una ejecución anterior.
- **El diálogo nativo `¿Eliminar…?`** de la tabla de celulares se acepta solo, porque bloquea la página.
- **El login usa solo `act`**, no `observe`: así una prueba puede arrancar incluso con un modelo local limitado (mismo criterio del ejemplo del profesor).

## Pruebas

| Archivo | Escenario | Casos | Qué verifica |
|---|---|---:|---|
| `00-humo` | — | 2 | El navegador, el modelo y la app responden (`extract` del nombre de la tienda, `observe` del enlace al catálogo) |
| `esc-13-recomendacion` | ESC-13 | 3 | Las tarjetas de «También te puede interesar» salen de la API; abrir una lleva a su ficha; un celular nuevo y parecido aparece |
| `esc-26-banear` | ESC-26 | 2 | Banear con motivo desde la tabla y que la persona ya no pueda entrar; con un motivo de 3 letras no se puede confirmar |
| `esc-27-desbanear` | ESC-27 | 2 | Desbanear devuelve «Activo» y permite volver a entrar; una cuenta activa no ofrece Desbanear |
| `esc-28-consultar-usuarios` | ESC-28 | 3 | La búsqueda por texto compartido, por correo completo y sin coincidencias («Ningún usuario coincide con tu búsqueda») |
| `esc-29-estadisticas` | ESC-29 | 3 | Las tarjetas Usuarios, Inventario y Órdenes coinciden con `GET /admin/stats`; baneados y total de usuarios suben en uno |
| `esc-30-catalogo` | ESC-30 | 4 | Crear (llenando el formulario), formulario vacío, editar el precio y eliminar |

Cada caso sigue Arrange – Act – Assert y deja capturas en `evidencias/<proveedor>/<escenario>/`. El objetivo de cada escenario está en el encabezado de su archivo.

## Requisitos y configuración

Node 22.18 o superior, Chrome instalado y **uno** de estos accesos:

| Proveedor | Qué se necesita | Variables del `.env` |
|---|---|---|
| `openai` | Clave de OpenAI | `OPENAI_API_KEY`, `OPENAI_MODEL` (por defecto `openai/gpt-4.1-mini`) |
| `gemini` | Clave de Google AI Studio | `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_MODEL` (por defecto `google/gemini-2.5-flash`) |
| `ollama` | Ollama instalado y un modelo (`ollama pull qwen2.5:7b`) | `OLLAMA_BASE_URL`, `OLLAMA_API_KEY`, `OLLAMA_MODEL` |

El proveedor se elige con `AI_PROVIDER` en el `.env`. El `.env` no se sube a git (está en `.gitignore`); una clave nunca debe ir al repositorio.

## Cómo correrlo

```bash
# 1. Levantar CelularPro (desde la carpeta del front)
docker compose -p celularpro up -d        # front :8081, API :3001

# 2. Configurar
cd e2e/santiago/stagehand
cp .env.example .env                      # elegir AI_PROVIDER y poner su clave
npm install

# 3. Probar
npm run test:humo                         # primero esta: si falla, las demás tampoco irán
npm test                                  # los seis escenarios con el proveedor del .env
npm run resumen                           # genera resultados/RESUMEN.md
```

- Un escenario suelto: `npm run test:esc26`, `test:esc30`, etc.
- Otro proveedor solo para esa corrida: `npm run test:gemini`, `npm run test:openai` o `npm run test:ollama` (corren todos los escenarios).
- Correr el mismo conjunto con dos proveedores y luego `npm run resumen` deja una **tabla comparativa** (casos aprobados, llamadas, tokens y tiempo por proveedor).
- Con `HEADLESS=false` en el `.env` se ve el navegador trabajando, útil para grabar la evidencia; con `STAGEHAND_LOG_LEVEL=debug` sale más detalle.

Una corrida completa hace unas 60 llamadas al modelo (con la clave gratuita de Gemini tarda unos 8 a 12 minutos; con una clave de pago, menos de 6); `RESUMEN.md` muestra los tokens exactos para calcular el costo con la tarifa del proveedor.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `Falta OPENAI_API_KEY` (o la de Gemini) | No se copió `.env.example` como `.env`, la clave está vacía o `AI_PROVIDER` apunta a otro proveedor |
| `Failed to fetch` en la primera llamada de Stagehand | La clave no sirve para el modelo elegido, o no hay internet |
| `Ollama respondió …` / `fetch failed` | Ollama no está corriendo (`ollama list`) o el modelo no está descargado |
| `elementId no cumple el patrón` con Ollama | El modelo local no respetó el esquema de `observe`: usar un modelo más capaz u OpenAI/Gemini |
| `act falló` / timeout con Ollama | Un modelo local tarda mucho por llamada: subir `LLAMADA_TIMEOUT_MS` en el `.env` (por defecto son 120000 con OpenAI/Gemini y 240000 con Ollama) |
| Error 429 o `Quota exceeded … per minute` | Límite de la clave gratuita (Gemini: ~5 llamadas por minuto). Las pruebas no esperan de más: cuando pasa, leen el «retry in Ns» que manda Google, esperan justo eso y reintentan. Si ocurre seguido, poner `LLAMADA_PAUSA_MS=6000` en el `.env`, usar `google/gemini-3.5-flash-lite` o una clave con facturación |
| No encuentra Chrome | Poner la ruta en `CHROME_PATH` (en Mac: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) |
| `No se pudo iniciar sesión como admin` | El docker compose no está arriba o las credenciales del `.env` no son las del admin |
| `act falló: …` en una prueba | El modelo no encontró el elemento: correr con `HEADLESS=false`, ver la captura de `evidencias/` y ajustar la instrucción al texto visible |

## Resultados

Se completa con la corrida real (`npm run resumen` genera la comparación y el detalle por caso en `resultados/RESUMEN.md`):

| Proveedor / modelo | Casos | Aprobados | Fallidos | Llamadas act / observe / extract | Tokens entrada / salida | Segundos |
|---|---:|---:|---:|---|---|---:|
| OpenAI `gpt-4.1-mini` | 19 | | | | | |
| Gemini `gemini-2.5-flash` | 19 | | | | | |
| Ollama `qwen2.5:7b` | 19 | | | | | |

## Análisis

**Dónde aporta.** `extract` con esquema zod es lo más útil: un solo caso lee toda la tarjeta de estadísticas y la compara campo por campo con la API, algo que en Cypress son catorce `cy.get` frágiles. `observe` evita seleccionar la fila equivocada en tablas largas.

**Limitaciones que hay que tener presentes.**

- **El proveedor se satura.** Con claves gratuitas es común `This model is currently experiencing high demand` o `Quota exceeded`. Las pruebas esperan lo que indique el proveedor (30 s si no dice nada) y reintentan hasta 3 veces antes de dar la llamada por perdida; si sigue fallando, cambiar `GEMINI_MODEL` a otro modelo (p. ej. `google/gemini-3.5-flash-lite`).
- **No es determinista.** El mismo texto puede resolverse distinto entre dos corridas o entre dos modelos. Por eso cada resultado importante se confirma contra la API y no solo contra lo que dijo el modelo.
- **Depende del modelo.** Los modelos locales pequeños (Ollama) suelen fallar en `observe` y en los esquemas estructurados; el ejemplo del profesor lo advierte y la comparación de proveedores sirve para medirlo.
- **Es lento y cuesta.** Cada llamada es una consulta al modelo con la página completa; una corrida tarda minutos y no tiene sentido ponerla en cada commit del pipeline.
- **Necesita textos visibles estables.** Si se renombra «Confirmar baneo», hay que actualizar la instrucción (aunque no haya que tocar ningún selector).
- **ESC-30 (eliminar)** busca el celular en la primera página de la tabla (50 por página). Con más de 50 celulares recién creados no lo encontraría.
- **Datos que quedan.** Los celulares de prueba se borran al terminar; los usuarios `*.sh.*@gmail.com` no, porque la API no ofrece borrarlos.

**Lugar en la estrategia.** Stagehand complementa a Serenity/Cypress (pruebas deterministas y rápidas, las que corren en el pipeline) con una revisión basada en lo que se ve en pantalla. Para las pruebas posteriores al último despliegue (Jenkins + SonarQube) se usan las suites deterministas, no esta.
