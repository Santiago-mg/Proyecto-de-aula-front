# Autify Nexus — E2E web con bajo código

Autify Nexus es una plataforma de pruebas E2E construida sobre **Playwright**. Permite crear escenarios
grabando, con pasos de bajo código o con IA a partir de lenguaje natural, y exportarlos como código
Playwright editable. Esta carpeta conecta Nexus con el repositorio en las dos direcciones.

```
escenarios/   18 escenarios en JavaScript, escritos para IMPORTARSE en Nexus (6 funcionalidades, positivos y negativos)
exportados/   lo que el equipo EXPORTA desde Nexus ("Export to Playwright Code"), para correrlo en CI
```

Los dos se ejecutan con la misma configuración (`playwright.config.js`) y, con `RP_API_KEY`, llegan a ReportPortal
con el *trace* de Playwright adjunto a cada fallo.

## Modalidad usada

- **Gratis (local):** creación y ejecución local, bajo código y código, Chrome y Edge. Alcanza para importar,
  editar, ejecutar y exportar estos escenarios.
- **IA y nube:** la generación con IA, *Fix with AI* y la ejecución en la nube dependen del plan o de la prueba
  ampliada. Las secciones 3 y 4 las necesitan; si no hay acceso, se documenta el intento en lugar de simularlo.

## 1. Importar los escenarios

1. Instala Autify Nexus y abre un workspace.
2. **Scenario → Import → Playwright code** y elige un archivo de `escenarios/`.
3. Cada bloque `test(...)` queda como un escenario. Lo que Nexus no traduzca a un paso propio queda como
   *Playwright code step* (sigue funcionando).
4. En cada escenario revisa el primer paso **Navigate**: el código usa rutas relativas (`/login`) porque Playwright
   toma la base de `BASE_URL`. Si Nexus lo deja relativo, completa `http://localhost:5173`.

Los escenarios se escribieron para que la importación salga limpia: JavaScript (no TypeScript), un `test()` por
escenario, sin funciones auxiliares compartidas, y localizadores accesibles (`getByRole`, `getByLabel`,
`getByTestId`) en lugar de clases CSS.

| Archivo | Funcionalidad | Escenarios |
|---|---|---|
| `01-registro.spec.js` | Registro de usuario | correcto · dominio no permitido · confirmación distinta |
| `02-inicio-sesion.spec.js` | Inicio de sesión | admin correcto · clave incorrecta · correo en mayúsculas · cerrar sesión |
| `03-perfil.spec.js` | Gestión de perfil | cambiar nombre · descartar cambios · clave actual incorrecta |
| `04-credenciales.spec.js` | Validación de credenciales | requisitos en vivo · sin mayúscula · sesión corrupta |
| `05-roles.spec.js` | Control de roles | sin sesión → login · cliente → no autorizado · admin entra |
| `06-alertas-stock.spec.js` | Alertas de stock bajo | admin ve alertas · cliente no |

## 2. Ejecutar fuera de Nexus

```bash
cd e2e/autify-nexus
npm install
npx playwright install chromium
BASE_URL=http://localhost:5173 npm test        # frontend y backend levantados, con el seed cargado
npm run reporte                                # reporte HTML de Playwright
```

`npm run listar` compila y lista los escenarios sin abrir el navegador (sirve de validación rápida).

## 3. Generar escenarios con IA (lenguaje natural)

En **Natural Language Recorder** o en la generación de casos a partir de requisitos, usa estas instrucciones.
Cada una tiene un resultado verificable, para que el escenario generado incluya una aserción y no solo clics.

| # | Instrucción para Nexus | Resultado esperado |
|---|---|---|
| 1 | Ve a /register, crea una cuenta con nombre "Ana Pérez", un correo nuevo de gmail.com y la contraseña "Medellin2026" repetida en la confirmación. | Llega a /dashboard y el título dice "Hola, Ana". |
| 2 | En /register intenta crear una cuenta con el correo "ana@empresa.com". | Aparece "Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud." y sigue en /register. |
| 3 | En /login ingresa como admin@celularpro.co con una contraseña equivocada. | Aparece "Credenciales inválidas" y sigue en /login. |
| 4 | Con una cuenta nueva, abre Mi perfil, cambia el nombre a "María Gómez" y guarda. | Aparece "Perfil actualizado" y Mi cuenta saluda "Hola, María". |
| 5 | En /register escribe "medellin2026" en Contraseña sin enviar el formulario. | Los requisitos de minúscula y número quedan cumplidos; el de mayúscula, pendiente. |
| 6 | Con una cuenta de cliente, abre /admin. | Termina en /unauthorized con el título "Acceso no autorizado". |
| 7 | Ingresa como administrador y abre /admin/alerts. | Se ve la lista de alertas o el aviso de que no hay alertas abiertas. |

Compara lo que genera la IA con el escenario equivalente de `escenarios/`: qué localizadores eligió, si agregó la
aserción y si necesitó correcciones. Esa comparación es la evidencia del análisis con IA.

## 4. Reparación asistida (*Fix with AI*)

Para mostrar la reparación, provoca un cambio controlado en la interfaz y deja que Nexus lo corrija:

1. Ejecuta en Nexus el escenario *Cerrar sesión vuelve a Ingresar y protege Mi cuenta*: pasa.
2. En una rama, cambia el texto del botón "Cerrar sesión" del menú (por ejemplo, a "Salir de la cuenta").
3. Vuelve a ejecutar: falla al no encontrar el botón.
4. Usa **Fix with AI** en el paso fallido, revisa el localizador que propone y acéptalo solo si apunta al botón correcto.
5. Captura el antes, el fallo, la propuesta y el resultado. Revierte el cambio de texto.

## 5. Exportar a Playwright

**Scenario → Export → Export to Playwright Code** y guarda el `.js` en `exportados/`. `npm run test:exportados`
lo ejecuta igual que en CI. Corrige en Nexus, no en el exportado, si el escenario se va a volver a importar.
