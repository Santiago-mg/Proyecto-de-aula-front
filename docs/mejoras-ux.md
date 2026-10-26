# Mejoras de experiencia de uso — CelularPro (front)

Este documento resume lo que se cambió en el front a partir del informe
`Analisis_UX_CelularPro.pdf` (heurísticas de Nielsen, accesibilidad, ayuda,
errores, personalización, autoguardado y primera visita). Cada fila dice qué
problema había, qué se hizo y dónde mirar.

El back no se tocó. Nada de esto cambia la API.

## 1. Heurísticas de Nielsen

| # | Principio | Problema que había | Qué se hizo | Dónde |
|---|---|---|---|---|
| 1 | Visibilidad del estado | Un botón sin internet "no hacía nada"; los avisos se iban muy rápido; no se sabía en qué página se estaba | Banner de conexión, avisos con pausa al pasar el cursor o enfocar (7 s si traen botón), migas de pan, título de pestaña por pantalla, filtros activos visibles | `ConnectionBanner`, `ToastContext`, `Breadcrumbs`, `useDocumentTitle`, `utils/filtros` |
| 2 | Lenguaje del usuario | Estados de pedido en inglés (`SHIPPED`), mensajes técnicos | Tabla única de estados con etiqueta y frase de ayuda; errores con "qué pasó y qué hacer" | `utils/estados`, `utils/errores` |
| 3 | Control y libertad | Quitar del carrito era definitivo; no había forma de volver a donde se estaba | "Deshacer" al quitar o vaciar el carrito; al ingresar se vuelve a la ruta de origen; Escape cierra paneles | `CartDrawer`, `utils/sesion`, `useFocusTrap` |
| 4 | Consistencia | Cada pantalla armaba sus formatos, estados y vacíos a su manera | Utilidades y componentes compartidos (`formato`, `EmptyState`, `ErrorState`, `Campo`, `Aviso`) | `src/utils`, `src/components/ui` |
| 5 | Prevención de errores | Acciones destructivas con `confirm()`; cantidades sin tope; contraseña a ciegas | `ConfirmDialog` (foco en "Cancelar" si es peligroso), tope por stock en el carrito, botón Mostrar/Ocultar, ayuda bajo cada campo | `ConfirmDialog`, `CartContext`, `BotonMostrar`, `Campo` |
| 6 | Reconocer en vez de recordar | Había que recordar filtros y lo ya visto | Etiquetas de filtros activos con "Limpiar filtros", "Vistos recientemente" | `PhoneFilters`, `RecentlyViewed`, `utils/vistos` |
| 7 | Flexibilidad y eficiencia | Solo ratón | Atajos `/`, `c`, `?`, `Esc`; panel de pantalla y accesibilidad | `useAtajos`, `PreferencesDialog` |
| 8 | Diseño minimalista | Estilos en línea y ruido visual | Tres hojas de estilo nuevas por área y tokens de tema | `styles/ux.css`, `componentes.css`, `tienda.css`, `admin.css` |
| 9 | Recuperación de errores | Errores sin salida o con "Error" suelto | `ErrorMessage`/`ErrorState` con pista, referencia para soporte y "Reintentar"; sugerencia "¿Quisiste decir…?" en búsquedas vacías | `utils/errores`, `utils/busqueda`, `Catalog` |
| 10 | Ayuda y documentación | Sin centro de ayuda | `/ayuda` con preguntas buscables y atajos, `/privacidad`, ayuda contextual `HelpTip` | `pages/Help`, `pages/Privacy`, `content/ayuda.ts`, `HelpTip` |

## 2. Accesibilidad (WCAG 2.2 AA)

- **Resultado con axe-core 4.10:** de 18 tipos de problema / 33 elementos a
  **0 / 0 en los tres temas** (oscuro, claro y alto contraste), 19 pantallas.
- **Contraste de texto (1.4.3):** tokens revisados con `matriz.py`; en el tema
  claro se oscurecieron `--ok`, `--bad` y `--accent`.
- **Controles (1.4.11):** token nuevo `--control-border` para el borde de campos
  y casillas (≥ 3:1); casillas propias visibles en los tres temas y en modo
  forzado de Windows.
- **Teclado (2.1, 2.4.1, 2.4.3, 2.4.7):** enlace "Saltar al contenido", foco
  atrapado y devuelto en los diálogos, menú móvil del panel con `inert`.
- **Títulos y anuncios (2.4.2, 4.1.3):** título por pantalla, región `aria-live`
  para avisos y cambios de ruta, errores con `role="alert"`.
- **Texto y movimiento (1.4.4, 2.3.3):** tamaños 100/115/130 %, "Reducir
  animaciones" (también apaga las de framer-motion) y el fondo animado no se
  monta con tema claro, alto contraste o movimiento reducido.
- **Adaptación a pantallas pequeñas (1.4.10):** sin desbordes horizontales de
  320 a 1280 px, también con texto al 130 %. Las tablas del panel pasan a
  tarjetas en celular y la gráfica de ventas usa rótulos cortos (`1 oct`).

## 3. Personalización, autoguardado y primera visita

| Tema del informe | Cambio |
|---|---|
| Personalización | Panel "Pantalla y accesibilidad" (tema automático/oscuro/claro/alto contraste, tamaño del texto, movimiento). Se guarda en `cp_prefs` y por defecto sigue al dispositivo. |
| Autoguardado | El borrador de la entrega en el checkout se guarda en `cp_checkout_draft` y se recupera con aviso; el carrito y los vistos ya persistían. |
| Primera visita | Tarjeta de bienvenida en el catálogo (`OnboardingTip`), cerrable, que no vuelve; se puede reabrir desde el centro de ayuda. |

## 4. Cambios de comportamiento que conviene saber

- El carrito no deja pasar de las unidades en stock.
- El teléfono del checkout se normaliza a dígitos.
- Al escribir en el buscador el historial se reemplaza (no se llena de entradas).
- `AdminPhones` pagina; borrar celulares y "Hacer admin" siguen usando los
  diálogos nativos porque las pruebas E2E dependen de ellos.
- Entregar o cancelar un pedido pide confirmación.
- Se quitó el contador "N personas viendo ahora": era inventado.
- El tema por defecto sigue al modo del dispositivo (antes siempre oscuro).

## 5. Pendiente de revisar con el equipo

- Los textos de **Privacidad** y del **centro de ayuda** solo afirman lo que el
  código hace hoy; conviene que el equipo los lea antes de entregar.
- Se dejaron sin tocar frases que no se pueden comprobar desde el front:
  "Pago seguro", "Pago 100% seguro", "4.9 ★ de satisfacción" y los
  testimonios bajo "Voces reales".
- No se dividió el bundle (aviso de chunk > 500 kB al compilar): se puede
  mejorar con `import()` en las rutas del panel.
- Los E2E (Serenity, Cypress, Katalon) no se pudieron correr aquí. Si alguno
  falla, lo más probable es un selector: el logo y el enlace "‹ Catálogo"
  ahora son migas de pan.

## 6. Pruebas nuevas

| Archivo | Casos | Qué cubre |
|---|---:|---|
| `test/unit/experiencia/utilidades.test.ts` | 70 | formato, estados, búsqueda tolerante, borrador, vistos, filtros, sesión, errores |
| `test/unit/experiencia/componentes.test.tsx` | 74 | HelpTip, ConfirmDialog, `useConfirmacion`, focus trap, avisos, errores, migas, paginación, conexión, bienvenida, SkipLink, títulos, `Campo` |
| `test/unit/experiencia/preferencias.test.tsx` | 21 | lectura y validación de preferencias, proveedor, panel de pantalla |
| `test/escenarios/experiencia-de-uso.test.tsx` | 8 | volver tras ingresar, sesión vencida, deshacer, ayuda, títulos, atajos |

Total: 583 pruebas de Vitest (410 antes) en 67 archivos. `tsc` limpio en `src` y
en `test`, y `vite build` correcto.
