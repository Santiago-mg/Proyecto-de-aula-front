# Momentic — pruebas funcionales y E2E con IA

Momentic guarda las pruebas como **YAML dentro del repositorio** y las ejecuta con su CLI en Chromium. Cada paso
puede ser exacto (navegar, escribir, comprobar la URL o un texto) o resuelto por IA: los elementos se buscan por
descripción en lenguaje natural, `assert` evalúa una condición con IA y `act` cumple una meta completa.
La nube de Momentic está obsoleta: hoy todo vive en el repositorio y corre en local o en CI.

```
momentic.config.yaml   proyecto (base: `npx momentic init`), entorno "local" con variables del shell
modules/               pasos reutilizables: crear una cuenta de cliente, ingresar como administrador
tests/                 9 pruebas: las 6 funcionalidades (positivas y negativas) y la ayuda con una meta de IA
```

## Requisitos

- Node.js 22.12+ (22.x) o 24+.
- `MOMENTIC_API_KEY`: los pasos con IA (localizar por descripción, `assert`, `act`) se resuelven en el servicio de
  Momentic. Se crea en <https://app.momentic.ai/settings/api-keys>. Es una prueba comercial y sus límites exactos
  no están publicados; revísalos al crear la cuenta.

## Comandos

```bash
cd e2e/momentic
npm install
npm run lint          # valida esquema, módulos y referencias (no necesita clave)
npx momentic install-browsers chromium   # la primera vez: el navegador de Momentic
npm run check         # configuración, nombres duplicados y módulos sin usar
npm run editor        # editor visual local para grabar o ajustar pasos
MOMENTIC_API_KEY=... BASE_URL=http://localhost:5173 npm test
npm run rp:importar   # envía reports/junit.xml a ReportPortal
```

`npm run lint` y `npm run check` ya pasan sin errores.

## Qué cubre cada prueba

| Prueba | Funcionalidad | Tipo | Con IA |
|---|---|---|---|
| `01-registro-correcto` | Registro | positivo | `assert` sobre el saludo y el correo |
| `01-registro-dominio-no-permitido` | Registro / credenciales | negativo | `assert` sobre el campo inválido |
| `02-inicio-de-sesion-administrador` | Inicio de sesión / roles | positivo | `assert` sobre el menú |
| `02-inicio-de-sesion-clave-incorrecta` | Inicio de sesión | negativo | `assert` sobre el mensaje y el enlace de ayuda |
| `03-gestion-de-perfil-cambiar-nombre` | Gestión de perfil | positivo | `assert` sobre la confirmación |
| `04-validacion-de-credenciales-requisitos` | Validación de credenciales | negativo | `assert` sobre los requisitos en vivo |
| `05-control-de-roles-cliente-sin-panel` | Control de roles | negativo | — (todo exacto) |
| `06-alertas-de-stock-bajo-admin` | Alertas de stock bajo | positivo | `assert` (hay alertas o el aviso de que no hay) |
| `07-ayuda-con-meta-ia` | Heurística 10 | positivo | `act` con meta y postcondición |

Cada prueba combina una comprobación exacta (`checkPageContains`, `waitForUrl`) con la de IA. Si la IA se equivoca,
la comprobación exacta sigue protegiendo el resultado.

## Creación, ejecución y mantenimiento con IA

- **Creación:** en `npm run editor`, o con un agente de código (`npx momentic skills`, `npx momentic install-mcp`),
  describe el recorrido en lenguaje natural y guarda el YAML resultante en `tests/`. Compáralo con las pruebas
  escritas a mano.
- **Ejecución:** `failureRecovery: true` permite que la IA busque otro camino si un paso falla, y deja registrado qué hizo.
- **Mantenimiento:** `useMemory: true` hace que la IA reutilice las decisiones de ejecuciones anteriores, y la caché
  de pasos guarda los localizadores resueltos. Si un texto de la interfaz cambia, revisa en el reporte qué paso se
  reparó y acepta el cambio en el YAML solo si es correcto.

## Decisiones verificadas con `momentic lint`

- En `type`, `into` solo acepta una descripción; el selector CSS va como clave hermana (`css: "#password"`).
- Para reemplazar el contenido de un campo se usa `clear: always`.
- El nombre de cada módulo coincide con su archivo (lo pide `lint`).
- Versión fijada: `momentic` 3.63.1. La más nueva al hacer esto era la 3.66.3, publicada el día anterior.
