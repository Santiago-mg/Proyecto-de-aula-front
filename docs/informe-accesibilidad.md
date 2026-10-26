# Informe de accesibilidad — CelularPro (front)

Herramienta: **axe-core 4.10** (el motor de Lighthouse), ejecutado con Chromium
sobre la app corriendo en local. Reglas: WCAG 2.0 y 2.1 niveles A y AA, más las
buenas prácticas de axe. Se escanearon 10 pantallas: 7 públicas (inicio,
catálogo, detalle, carrito, login, registro y 404) y 3 del panel de
administración (panel, usuarios y catálogo).

## 1. Resultado

Cada fila cuenta un tipo de problema en una pantalla.

| Severidad | Antes | Después |
|---|---:|---:|
| Crítica | 1 | 0 |
| Seria | 9 | 1 |
| Moderada | 12 | 6 |
| **Total** | **22** | **7** |

Elementos afectados: de 98 a 51.

## 2. Hallazgos y correcciones

| # | Pantalla | Problema | Severidad | Corrección | Estado |
|---|---|---|---|---|---|
| 1 | Detalle de celular | Las 3 miniaturas de la galería son botones sin nombre: un lector de pantalla solo dice "botón". | Crítica | `aria-label="Ver imagen N de M"` y `aria-pressed` en cada botón (`PhoneDetail.tsx`). | Corregido |
| 2 | Inicio, catálogo, detalle y admin | El texto secundario (`--ink-faint`, `#3f4f6a` sobre `#050a14`) tiene contraste **2,39:1**; el mínimo AA es 4,5:1. | Seria | Se cambió el color a `#7686a3` (≈5,4:1) en `index.css`. | Corregido |
| 3 | Login, registro y carrito | Los enlaces dentro de un texto ("Regístrate gratis", "Ingresar") se distinguen solo por el color. | Seria | `.cp-link` ahora va subrayado (`index.css`). | Corregido |
| 4 | Login, registro y carrito | La página no tiene un elemento `main`, así que no hay un punto de salto para teclado ni lector de pantalla. | Moderada | El contenedor de `Login.tsx` y `Register.tsx` pasó de `div` a `main`. | Corregido |
| 5 | Usuarios (admin) | 42 elementos con contraste bajo: las filas de usuarios baneados se atenúan con opacidad y el texto queda a ~2,6–3:1. | Seria | Pendiente: hay que decidir cómo marcar a un baneado sin bajar el contraste (por ejemplo, un borde o un icono en vez de opacidad). | Pendiente |
| 6 | Inicio, catálogo y detalle | La barra promocional superior (`cp-promo-bar`, con el enlace "Ver certificados →") queda fuera de cualquier región semántica. | Moderada | Pendiente: envolverla en un `aside` con `aria-label="Promociones"`. | Pendiente |
| 7 | 404 | La página no usa el layout principal, así que no tiene `main`. | Moderada | Pendiente: envolver el contenido de la 404 en `main`. | Pendiente |
| 8 | Catálogo | El orden de los encabezados salta un nivel (de `h1` a `h3` en las tarjetas). | Moderada | Pendiente: usar `h2` en las tarjetas o ajustar el estilo con CSS. | Pendiente |
| 9 | Login y registro | El mensaje de error del servidor ("Credenciales inválidas", "El email ya está registrado") aparecía sin avisar al lector de pantalla. No lo detectó axe porque solo aparece después de enviar el formulario. | Moderada | `role="alert"` en `ErrorMessage.tsx`: el lector lo anuncia en cuanto aparece. | Corregido |

## 3. Verificación

- Se midió **antes y después con el mismo script** y esperando a que cada
  pantalla cargara por completo; la primera medición dio un falso "cero" en el
  panel de administración porque la página aún no había renderizado.
- Tras los cambios: `typecheck` sin errores, 401 pruebas del front en verde y
  `npm run build` correcto.

## 4. Lo que este informe no cubre

axe detecta una parte de los problemas de accesibilidad, no todos. Falta una
revisión manual de: navegación completa solo con teclado, orden del foco,
lectura con un lector de pantalla (VoiceOver o NVDA), zoom al 200 % y
comportamiento en móvil. Esa revisión debe hacerla el equipo y contrastarse con
estos resultados automáticos.

## 5. Cómo repetirlo

1. Levantar la app (`docker compose -p celularpro up -d`).
2. Instalar axe-core (`npm i axe-core`) y correrlo en cada pantalla con
   Playwright, o abrir la extensión **axe DevTools** en Chrome.
3. Alternativa sin código: Chrome → DevTools → Lighthouse → categoría
   *Accessibility*.


## Actualización (octubre 2026)

Tras la refactorización de experiencia de uso se repitió la auditoría con axe-core 4.10 sobre 19 pantallas (públicas, sesión de usuario y panel) en los tres temas: **0 violaciones** en oscuro, claro y alto contraste. Además, no hay desbordes horizontales entre 320 y 1280 px. El detalle de cambios está en [`mejoras-ux.md`](mejoras-ux.md).
