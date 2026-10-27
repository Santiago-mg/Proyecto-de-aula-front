# Playwright Test Agents — CelularPro

Pruebas de extremo a extremo de las funcionalidades de Santiago (ESC-13 y ESC-26 a ESC-30) hechas con
**Playwright Test Agents**: tres agentes de IA (Planner, Generator y Healer) que planean, escriben y reparan pruebas de
Playwright. Es la tercera herramienta de IA de Santiago, junto a Katalon Studio con IA y Stagehand.

## 1. Propósito

- **Planner**: explora la aplicación y deja un plan de pruebas en Markdown (`specs/`).
- **Generator**: convierte cada escenario del plan en una prueba de Playwright, ejecutando los pasos en un navegador real.
- **Healer**: corre las pruebas que fallan, mira la página, y propone o aplica el arreglo.

La diferencia con Stagehand (carpeta `../stagehand`): ahí la IA corre **dentro** de cada ejecución (cada paso es una llamada
a un modelo, con cuota y espera). Aquí la IA trabaja **al escribir y al reparar**; las pruebas que quedan son código
Playwright normal, rápido y gratis de repetir, y pueden correr en Jenkins sin ninguna clave.

## 2. Configuración

Requisitos: Node 20 o más y CelularPro encendido (front en `:8081`, API en `:3001`, como en el docker-compose del front).
Las pruebas están escritas contra el código actual del front: si tu imagen de Docker es vieja, reconstrúyela primero
(`docker build -t celularpro-front:latest .` en la raíz del front, y luego `docker compose -p celularpro up -d --force-recreate`;
lo mismo con la imagen de la API en el back).

```bash
cd e2e/santiago/playwright-agents
npm install
npx playwright install chromium
npm test            # corre los 24 escenarios (el navegador va oculto)
npm run reporte     # abre el reporte HTML con capturas, trazas y video de los que fallen
```

Variables opcionales (los valores por defecto sirven para el docker-compose):

| Variable | Por defecto |
|----------|-------------|
| `E2E_FRONT_URL` | `http://localhost:8081` |
| `E2E_API_URL` | `http://localhost:3001/api/v1` |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | `admin@celularpro.co` / `admin1234` |

Para ver el navegador mientras corre: `npx playwright test --headed`. Para depurar uno: `npx playwright test --ui`.

### Correr los agentes

Los agentes viven en `.claude/agents/` y el servidor MCP de Playwright en `.mcp.json` (se generaron con
`npm run agentes`). Se usan desde Claude Code abierto **en esta carpeta**:

```bash
cd e2e/santiago/playwright-agents
claude
```

| Agente | Qué pedirle |
|--------|-------------|
| Planner | `Usa playwright-test-planner. Seed: seed.spec.ts. Explora http://localhost:8081/admin/users y planea los escenarios de banear, desbanear y buscar. Guarda el plan en specs/plan-usuarios.md` |
| Generator | `Usa playwright-test-generator para generar los escenarios 1.1 y 1.2 de specs/plan-celularpro.md` |
| Healer | `Usa playwright-test-healer para reparar las pruebas que fallan` |

El `seed.spec.ts` deja a la administradora con la sesión iniciada: es el punto de partida de los tres agentes.

## 3. Pruebas

El plan completo, con pasos y resultados esperados, está en [`specs/plan-celularpro.md`](specs/plan-celularpro.md).
Sigue el formato del Planner, y cada archivo de `tests/` el del Generator (una prueba por archivo, un `describe` por
escenario, un comentario con el texto del paso antes de cada paso).

| Escenario | Pruebas | Qué comprueban |
|-----------|:-------:|----------------|
| ESC-26 Banear usuario | 4 | Banear con motivo; mínimo 4 caracteres (3, 4 y solo espacios); cancelar no banea; el admin no se banea a sí mismo |
| ESC-27 Desbanear usuario | 2 | Desbanear devuelve a «Activo»; una cuenta activa ofrece Banear y no Desbanear |
| ESC-28 Consultar usuarios | 3 | Texto compartido; correo completo (y en mayúsculas); búsqueda sin resultados y «Quitar la búsqueda» |
| ESC-29 Estadísticas | 3 | Las 14 cifras contra `GET /admin/stats`; baneados +1; total registrados +1 |
| ESC-30 Catálogo | 6 | Crear; formulario vacío; precio en cero; editar; eliminar; cancelar la eliminación |
| ESC-13 Recomendaciones | 5 | Pantalla = API; abrir una recomendación; celular parecido con stock aparece; sin stock no aparece; máximo 4 |
| Seed | 1 | Inicio de sesión del administrador |

Cómo están hechas:

- **La API es el oráculo.** Los datos se preparan por la API (`support/api.ts`) y lo que se ve en pantalla se compara con lo
  que la API responde. Cada prueba crea sus propios usuarios y celulares con un sufijo único y los borra al terminar
  (`support/fixtures.ts`), así pueden correr en cualquier orden y en una base con datos.
- **Selectores por rol y etiqueta** (`getByRole`, `getByLabel`), como los percibe una persona o un lector de pantalla; solo
  los mensajes de error del formulario usan el id que el front les pone (`#price-error`).
- **Sin esperas fijas.** Las aserciones de Playwright reintentan hasta que la pantalla llega al estado esperado (por ejemplo,
  el buscador espera 400 ms antes de consultar y la tabla se actualiza después).
- **Evidencia automática.** Cada prueba guarda capturas en `evidencia/<escenario>/` y las adjunta al reporte HTML.

## 4. Resultados

| Corrida | Entorno | Resultado | Tiempo |
|---------|---------|-----------|--------|
| 1 | Front compilado del código actual + API de laboratorio | 24 de 24 pasan | 56 s |
| 2 | Igual, repetida 3 veces seguidas (`--repeat-each=3`) | 72 de 72 pasan | 2,7 min |
| 3 | Front con 4 defectos inyectados a propósito (ver abajo) | 19 pasan, 5 fallan | 1,8 min |
| 4 | Docker del equipo (completar al correrlo) | _ de 24 | _ |

**Comprobación de que detectan defectos (corrida 3).** Se compiló una copia del front con cuatro defectos puestos a propósito
y se corrió la suite contra ella: el motivo mínimo de baneo bajado de 4 a 3, la cifra «Baneados» mostrando la de
administradores, las recomendaciones limitadas a 3 en vez de 4 y la tabla que no quita la fila al eliminar. Los cuatro se
detectaron: fallaron 5 pruebas (motivo corto, las dos de estadísticas que miran «Baneados», máximo 4 recomendaciones y
eliminar), y ninguna de las otras 19 se vio afectada. Con el código sin tocar, las 24 pasan. Una prueba que sigue en verde con la regla rota no protege nada.

Las corridas 1 a 3 se hicieron en un entorno de laboratorio: el front real compilado, pero con una API que imita los
endpoints que usan estas pruebas (sin la base de datos real). Comprueban que los selectores y los textos corresponden al
código actual del front; la corrida 4, contra el Docker del equipo, es la que comprueba también el back. El resultado queda en
`resultados/junit.xml` (para Jenkins) y en `reporte/index.html`.

## 5. Evidencias

- `reporte/index.html` — reporte HTML de la última corrida (`npm run reporte`).
- `evidencia/<escenario>/*.png` — capturas de los pasos clave, para pegar en el informe.
- `resultados/junit.xml` — resultado en formato JUnit.
- `resultados/artefactos/` — captura, video y traza de cada prueba que falla (`npx playwright show-trace <traza>`).

### Ejemplo de reparación (lo que hace el Healer)

Se cambió a propósito la etiqueta del campo del motivo en una prueba de ESC-26 (`Razón del baneo` en lugar de
`Motivo del baneo`), como si el texto de la pantalla hubiera cambiado. La prueba falló así:

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'Banear usuario' }).getByLabel('Razón del baneo')
```

Playwright guarda con la falla una instantánea de accesibilidad de la página (`error-context.md`) donde el campo aparece como
`textbox "Motivo del baneo"`. Con esa información el Healer corrige el selector, y la prueba vuelve a pasar:

```diff
-    await dialogo.getByLabel('Razón del baneo').fill('Spam en los comentarios');
+    await dialogo.getByLabel('Motivo del baneo').fill('Spam en los comentarios');
```

## 6. Análisis

**Lo que funcionó**

- Con selectores por rol y etiqueta, las pruebas leen como una descripción de la pantalla y sobreviven a cambios de estilos.
- La IA solo interviene al escribir y reparar: la suite completa corre en menos de un minuto, sin claves ni cuotas, y es
  repetible (72 de 72 en tres vueltas).
- Probar contra la API evita falsos positivos: si la pantalla muestra algo que el servidor no dijo, la prueba falla.
- Los escenarios agregan casos que Stagehand no tenía: límites del motivo (3 / 4 / espacios), cancelar diálogos, usuario
  que no puede banearse a sí mismo, precio en cero, recomendación sin stock, tope de 4 recomendaciones.

**Límites y cuidados**

- El plan lo escribe un modelo: hay que leerlo. El Planner puede inventar pasos para una pantalla que no existe o suponer
  datos que la base no tiene; por eso el seed y los datos de cada prueba se preparan por la API.
- El Healer arregla selectores, pero no sabe si el cambio de la pantalla era un error. Antes de aceptar una reparación hay
  que preguntarse si falló la prueba o falló el producto.
- Los agentes necesitan Claude Code y un modelo (tiene costo al planear, generar y reparar); la suite ya generada no.
- Las pruebas dependen de datos del seed (`iphone-15-pro-max` y sus recomendados). Si ese celular se borra, ESC-13 falla por
  falta de datos, no por un defecto.

**Comparación con las otras herramientas de IA**

| | Playwright Agents | Stagehand |
|---|---|---|
| Cuándo trabaja la IA | Al escribir y reparar | En cada ejecución |
| Velocidad de la suite | ~2 s por prueba | decenas de segundos por prueba |
| Costo por corrida | Ninguno | Llamadas al modelo (cuota) |
| Resultado | Código Playwright estándar | Pasos en lenguaje natural |
| Se adapta a cambios de pantalla | Con ayuda del Healer, al reparar | Solo, al ejecutar |
