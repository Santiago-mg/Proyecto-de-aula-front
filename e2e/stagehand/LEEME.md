# Stagehand — pruebas E2E con IA (act, observe, extract)

Stagehand (Browserbase) controla el navegador con instrucciones en lenguaje natural. Aquí se usa la
**versión 3.7.3** (`v3-latest`), que pone `act`, `observe` y `extract` sobre la instancia y permite un
navegador local (`env: 'LOCAL'`). La v4 cambió la forma de crear el navegador y está recién publicada.

## Las tres capacidades

| Capacidad | Para qué | Ejemplo en las pruebas |
|---|---|---|
| `observe(instrucción)` | Descubrir elementos; devuelve acciones con selector | Encontrar los campos del registro; el menú lateral del panel |
| `act(instrucción \| acción)` | Ejecutar una acción descrita en lenguaje natural, o una acción ya observada sin volver a llamar al modelo | Llenar formularios, pulsar botones; patrón **observe → act** en el login |
| `extract(instrucción, esquema Zod)` | Leer datos tipados de la pantalla | Saludo y correo de la cuenta; requisitos de la contraseña; lista de alertas |

**Cada resultado de la IA se contrasta con una verificación determinista**: la URL, el DOM (`page.evaluate`)
o la API. Ejemplos: en credenciales, lo que `extract` lee de los requisitos se compara con `data-cumple`
del DOM; en alertas, lo que `extract` lee en pantalla se compara con `GET /admin/alerts`.

## Cobertura (12 pruebas, positivas y negativas)

| Archivo | Funcionalidad | Pruebas |
|---|---|---|
| `01-registro` | Registro | correcto (observe + act + extract) · dominio no permitido |
| `02-inicio-sesion` | Inicio de sesión | observe → act con acciones reutilizadas · contraseña incorrecta |
| `03-perfil` | Gestión de perfil | cambiar nombre · contraseña actual incorrecta |
| `04-credenciales` | Validación de credenciales | requisitos IA vs DOM · sin mayúscula |
| `05-roles` | Control de roles | cliente → no autorizado · admin ve el panel |
| `06-alertas-stock` | Alertas de stock | pantalla vs API · cliente sin acceso |

## Modelo: Gemini a través de Ollama

Por defecto las pruebas usan **`ollama/gemini-3-flash-preview:cloud`**: Gemini servido por la nube de Ollama,
llamado desde el servidor local de Ollama. Stagehand 3.7.3 trae el proveedor de Ollama integrado y no necesita
clave en el código: la sesión la guarda `ollama signin`.

```bash
# 1. Preparar Ollama (una sola vez)
ollama signin
ollama pull gemini-3-flash-preview:cloud      # registra el modelo en la nube; no descarga pesos
ollama serve                                  # si no está corriendo ya

# 2. Backend con seed y frontend levantados; Chrome o Chromium instalado
cd e2e/stagehand
npm install
npm run typecheck                             # valida contra los tipos de Stagehand 3.7.3
npm test
HEADLESS=false npm test                       # para ver el navegador
npm run rp:importar                           # JUnit a ReportPortal
```

| Variable | Por defecto | Para qué |
|---|---|---|
| `STAGEHAND_MODEL` | `ollama/gemini-3-flash-preview:cloud` | Otro modelo de Ollama (p. ej. `ollama/gemma3:4b` local) u otro proveedor |
| `OLLAMA_URL` | `http://127.0.0.1:11434/api` | Ollama en otra máquina |

Antes de correr, `soporte/entorno.ts` comprueba que Ollama responda y que el modelo aparezca en `/api/tags`.
Si no, las 12 pruebas se **omiten** y la consola dice qué falta (`ollama serve`, o `ollama signin && ollama pull …`).
Se verificó con un Ollama simulado en los tres casos: apagado, sin el modelo y con el modelo.

## Evidencia

Cada prueba deja en `reports/<prueba>/`: `pantalla.png`, `metricas.json` (tokens usados por act, observe y
extract) e `historial.json` (cada llamada con sus parámetros y resultado). El resumen queda en
`reports/junit-stagehand.xml`.

## Qué se verificó y qué no

- **Verificado:** typecheck contra los tipos reales de Stagehand 3.7.3 (detectó un `beforeEach` que Vitest
  habría tratado como función de limpieza) y la carga de las 6 suites, que sin clave se omiten correctamente.
- **No verificado aquí:** la ejecución con Ollama + Gemini y un navegador, porque este entorno no tiene ninguno de
  los dos. Las respuestas de un modelo varían entre ejecuciones; por eso cada aserción importante tiene su
  verificación determinista.
- Según la rúbrica, Stagehand **no** forma parte de las pruebas posteriores al despliegue (criterio 9).
