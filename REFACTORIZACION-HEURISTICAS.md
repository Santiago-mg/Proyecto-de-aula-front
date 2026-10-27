# Refactorización por heurísticas de usabilidad

Base: `Evaluacion-Heuristica_CelularPro_consolidada.xlsx` (Nielsen + Tognazzini, 60 preguntas, panel simulado de 5 personas no técnicas). El panel evaluó el sistema **original** y obtuvo **63,76 %** de usabilidad (**65,06 %** corregido, solo preguntas contables). Las heurísticas más bajas fueron Ayuda y documentación (0,99 de 5), Autonomía, Color y legibilidad, Prevención de errores y Flexibilidad.

Este documento y la hoja **Correcciones** del libro de Excel salen de la misma tabla. Ninguno cambia las respuestas del panel: la puntuación nueva debe salir de una **re-evaluación** del equipo sobre la versión refactorizada.

## Resumen

| Estado | Hallazgos |
|---|---|
| Corregido | 24 |
| Corregido (integración) | 5 |
| Parcial | 2 |
| Pendiente backend | 0 |
| Verificar en pantalla | 1 |
| **Total** | **32** |

La numeración Hx.y es heurística.pregunta (la pregunta y es la fila y+3 de su hoja). Un hallazgo es una pregunta con valor menor que 1, marcada "Imposible de comprobar", o con valor 1 pero un defecto descrito en el comentario.

## Detalle por hallazgo

### 1- Visibilidad y estado sist.

**H1.1 — La aplicación incluye de forma visible el título de la página, de la sección o del sitio?** · Panel: SÍ, en TODOS los casos (1) · **Corregido**

- *Hallazgo:* Comentario: el título de la pestaña era el mismo en todas las pantallas.
- *Cambio:* Hook useTituloPagina: cada pantalla pone su nombre en la pestaña ("Ingresar · CelularPro", "Mi cuenta · CelularPro", "Usuarios — Administración · CelularPro").
- *Archivos:* `src/hooks/useTituloPagina.ts`, `páginas y AdminLayout.tsx`
- *Evidencia:* heuristicas/sistema.test.tsx «H1.1»; cypress heuristicas.cy.ts; Serenity heuristicas.feature «Cada pantalla nombra su pestaña»

**H1.2 — El usuario sabe en todo momento dónde está?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* El menú solo marcaba 5 categorías; Login/Registro sin salida; el nombre del usuario no se marcaba activo.
- *Cambio:* "Mi cuenta" y "Ayuda" se marcan activos con aria-current="page"; ruta de navegación en Perfil y Ayuda; "← Volver a la tienda" en Ingresar y Crear cuenta.
- *Archivos:* `Nav.tsx`, `Profile.tsx`, `Ayuda.tsx`, `Login.tsx`, `Register.tsx`
- *Evidencia:* navegacion.test.tsx «H1: Mi cuenta marcado»; heuristicas/formularios.test.tsx «ruta de navegación», «Volver a la tienda»; TC27

**H1.3 — El usuario sabe en todo momento qué está haciendo el sistema o aplicación?** · Panel: No siempre (0.33) · **Corregido**

- *Hallazgo:* Mi cuenta no permitía editar ni cerrar sesión; la sesión vencida sacaba a /login sin aviso.
- *Cambio:* Mi cuenta tiene "Editar perfil" y "Cerrar sesión en este equipo". Al vencer o suspenderse la sesión, /login explica el motivo (incluido el motivo de la suspensión).
- *Archivos:* `Dashboard.tsx`, `api.ts`, `errores.ts`, `Login.tsx`
- *Evidencia:* heuristicas/sistema.test.tsx «H1.3»; perfil-y-sesion.test.tsx «Cuenta suspendida», «D-15»

**H1.4 — Los enlaces están claramente definidos?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* Enlaces sin subrayado: solo se distinguían por el color.
- *Cambio:* .cp-link y los enlaces del pie van subrayados (WCAG 1.4.1).
- *Archivos:* `index.css (.cp-link, .cp-footer-links a)`
- *Evidencia:* Revisión visual (jsdom no calcula estilos, axe no puede verificarlo aquí)

**H1.5 — Todas las acciones pueden verse directamente? (Sin requerir acciones adicionales)** · Panel: Sí, pero faltan algunos casos (0.66) · **Parcial**

- *Hallazgo:* En celular el menú queda detrás del botón.
- *Cambio:* Se mantiene el menú plegable (patrón estándar en móvil), pero el botón ahora dice "Abrir menú"/"Cerrar menú" y anuncia aria-expanded; la Ayuda y el carrito quedan siempre visibles en la barra; el menú móvil incluye Ayuda y Panel admin.
- *Archivos:* `Nav.tsx`
- *Evidencia:* navegacion.test.tsx «alterna entre abrir y cerrar (aria-expanded)»

### 2- Conexión con el mundo

**H2.1 — La información aparece de una manera lógica para el usuario común?** · Panel: SÍ, en TODOS los casos (1) · **Corregido**

- *Hallazgo:* Comentario: el menú decía "Salir" y el móvil "Cerrar sesión".
- *Cambio:* "Cerrar sesión" en escritorio, móvil y panel de administración. "Dashboard" pasó a "Panel".
- *Archivos:* `Nav.tsx`, `AdminLayout.tsx`, `AdminDashboard.tsx`
- *Evidencia:* navegacion.test.tsx «H2: escritorio y móvil dicen lo mismo»; Cypress, Serenity y Katalon actualizados

**H2.4 — Se utilizan frases y conceptos familiares para el usuario?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* "Token inválido o expirado" es un mensaje técnico.
- *Cambio:* Los mensajes técnicos del backend se traducen (sesión, permisos, datos inválidos, ruta no encontrada, error interno, sin conexión). El panel ya no muestra "¿Está corriendo en localhost:3001?" ni "Request failed with status code 500".
- *Archivos:* `utils/errores.ts (enLenguajeCotidiano)`, `AdminDashboard.tsx`, `AdminStats.tsx`
- *Evidencia:* errores-sesion.test.tsx «H2: traduce…»; ramas-restantes.test.tsx; esc-29-panel-estadisticas.test.tsx

### 3- Control usuario

**H3.3 — Es fácil volver a un estado anterior de la aplicación?** · Panel: No siempre (0.33) · **Corregido**

- *Hallazgo:* No se podía volver atrás: ni editar el nombre ni cambiar la contraseña.
- *Cambio:* Integración: el perfil usa las rutas reales del backend (PATCH /auth/me y PUT /auth/me/password). Heurísticas: "Descartar cambios" devuelve el nombre guardado y "Limpiar campos" vacía el formulario de contraseña.
- *Archivos:* `auth.service.ts`, `Profile.tsx`
- *Evidencia:* heuristicas/formularios.test.tsx «H3.3»; Cypress «Descartar cambios»; Serenity «Descartar los cambios…»

### 4- Consistencia y estándares

**H4.1 — Las etiquetas de los vínculos tienen los mismos nombres que sus destinos?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* "Garantías" del pie llevaba al catálogo; el menú mostraba el primer nombre en lugar de "Mi cuenta".
- *Cambio:* Pie: Garantías, Contacto y Preguntas frecuentes llevan a su sección de /ayuda. Menú: "Mi cuenta" (el nombre queda en el title).
- *Archivos:* `Footer.tsx`, `Nav.tsx`, `Ayuda.tsx`
- *Evidencia:* heuristicas/ayuda.test.tsx «H4.1»; navegacion.test.tsx; TC29; Serenity «Garantías lleva a las garantías»

**H4.2 — Las mismas acciones siempre conducen a los mismos resultados?** · Panel: No siempre (0.33) · **Corregido (integración)**

- *Hallazgo:* El login no normalizaba el correo: con mayúsculas respondía "Credenciales inválidas".
- *Cambio:* El correo se recorta y pasa a minúsculas en login y registro, igual que el backend.
- *Archivos:* `utils/validacion.ts`
- *Evidencia:* perfil-y-sesion.test.tsx «D-06/D-07»; reglas-backend.test.ts; TC08

**H4.3 — Un mismo icono tiene el mismo significado en todo el sistema?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* ShieldCheck se usaba para "verificado" y para "Total"; CheckCircle para "Activo" y "Desbanear".
- *Cambio:* Total del pedido: ícono de recibo. Desbanear: candado abierto. Abrir el menú del panel: ícono de menú (antes el de "Panel").
- *Archivos:* `Dashboard.tsx`, `AdminUsers.tsx`, `AdminLayout.tsx`
- *Evidencia:* heuristicas/sistema.test.tsx «H4.3» (dos pruebas)

**H4.5 — Los colores de los enlaces son adecuados para su uso?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* Colores de enlaces adecuados pero dependen solo del color.
- *Cambio:* Igual que H1.4: subrayado.
- *Archivos:* `index.css`
- *Evidencia:* Revisión visual

### 5- Reconocimiento

**H5.5 — La información está organizada según la lógica de los usuarios a los que va dirigida la interfície?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido (integración)**

- *Hallazgo:* Faltaba editar el perfil y cambiar la contraseña.
- *Cambio:* Mi perfil funciona contra el backend real.
- *Archivos:* `auth.service.ts`, `Profile.tsx`
- *Evidencia:* auth-service-contrato.test.ts; perfil-y-sesion.test.tsx

### 6- Flexibilidad

**H6.1 — Existen atajos de teclado para las acciones frecuentes?** · Panel: NO, en NINGÚN caso (0) · **Corregido**

- *Hallazgo:* No hay atajos de teclado.
- *Cambio:* Atajos "/" (buscar en el catálogo) y "?" (ayuda de atajos). No se activan al escribir en un campo ni con Ctrl/Alt/Meta. aria-keyshortcuts en la búsqueda.
- *Archivos:* `hooks/useAtajosTeclado.ts`, `MainLayout.tsx`, `Catalog.tsx`, `PhoneFilters.tsx`
- *Evidencia:* heuristicas/sistema.test.tsx «H6.1» (5 pruebas); Cypress «H6»

**H6.3 — Al realizar cualquier acción por primera vez, queda claro cómo realizarla permanentemente?** · Panel: No siempre (0.33) · **Corregido (integración)**

- *Hallazgo:* PUT y PATCH respondían "Ruta no encontrada".
- *Cambio:* El frontend llama a las rutas que existen en el backend.
- *Archivos:* `auth.service.ts`
- *Evidencia:* auth-service-contrato.test.ts; cypress/api

**H6.5 — Es visible el uso de aceleradores para el usuario habitual?** · Panel: NO, en NINGÚN caso (0) · **Corregido**

- *Hallazgo:* No hay aceleradores visibles; la sesión de 7 días ayuda pero no se ve.
- *Cambio:* El pie anuncia los atajos; Mi cuenta dice que la sesión dura hasta 7 días en el navegador; la ayuda los documenta.
- *Archivos:* `Footer.tsx`, `Dashboard.tsx`, `Ayuda.tsx`
- *Evidencia:* heuristicas/sistema.test.tsx «dice cuánto dura la sesión», «el pie anuncia los atajos»

### 7- Diagnosticar errores

**H7.1 — Se muestra un mensaje antes de tomar acciones irreversibles?** · Panel: No siempre (0.33) · **Corregido**

- *Hallazgo:* El botón Banear aparecía en filas de otros administradores y la API lo permitía.
- *Cambio:* Frontend: no ofrece banear a un administrador y explica el camino. Backend: `banUser` actualiza solo `where { id, role: 'USER' }` (atómico) y responde 403 «No puedes banear a un administrador…» si el destino es ADMIN.
- *Archivos:* `AdminUsers.tsx`, backend `AdminRepository.ts`
- *Evidencia:* ban-admin.test.tsx (frontend); backend esc-26 «Camino 8»; Cypress contrato-y-seguridad «banear a otro administrador → 403»

**H7.2 — Los errores cometidos se muestran en tiempo real?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* El registro decía "Correo electrónico inválido" y el login "Email inválido".
- *Cambio:* Un solo esquema de correo para login y registro; los requisitos de contraseña se validan en vivo.
- *Archivos:* `utils/validacion.ts`, `ReglasContrasena.tsx`
- *Evidencia:* login.schema.test.tsx; register.email-domain.test.tsx; heuristicas/formularios.test.tsx

### 8- Prevención de errores

**H8.1 — Aparece un mensaje de confirmación antes de realizar las acciones?** · Panel: No siempre (0.33) · **Parcial**

- *Hallazgo:* Sin verificación de correo; "Hacer admin"/"Quitar admin" sin confirmar.
- *Cambio:* Cambiar el rol ya pide confirmación. La verificación del correo al registrarse requiere un proveedor de correo en el backend: pendiente.
- *Archivos:* `AdminUsers.tsx (confirmación de rol)`
- *Evidencia:* role-confirm.test.tsx

**H8.2 — Queda claro qué hay que introducir en cada campo de un formulario?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* Nombre en blanco y clave trivial aceptados; la regla de la clave solo se explicaba al fallar.
- *Cambio:* Reglas iguales a las del backend; requisitos visibles y marcados mientras se escribe; el correo dice qué dominios acepta; la confirmación vacía tiene su mensaje.
- *Archivos:* `utils/validacion.ts`, `ReglasContrasena.tsx`, `Register.tsx`, `Profile.tsx`
- *Evidencia:* reglas-backend.test.ts; heuristicas/formularios.test.tsx; TC28; Serenity «requisitos…»

### 10- Ayuda y documentación

**H10.1 — Existe la opción "ayuda"?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* Solo una columna "Ayuda" en el pie, sin centro de ayuda.
- *Cambio:* Nueva página /ayuda: preguntas frecuentes, guías de problemas, garantías, atajos y contacto.
- *Archivos:* `pages/Ayuda.tsx`, `AppRouter.tsx`
- *Evidencia:* heuristicas/ayuda.test.tsx; accesibilidad-axe.test.tsx «Centro de ayuda»

**H10.2 — En el caso de existir, es visible y de fácil acceso?** · Panel: No siempre (0.33) · **Corregido**

- *Hallazgo:* La ayuda no aparecía en Login ni Registro.
- *Cambio:* Ícono de Ayuda fijo en la barra; enlaces en Ingresar, Crear cuenta, Mi perfil, "Acceso no autorizado" y en los mensajes de error.
- *Archivos:* `Nav.tsx`, `Login.tsx`, `Register.tsx`, `Profile.tsx`, `Unauthorized.tsx`, `ErrorMessage.tsx`
- *Evidencia:* heuristicas/ayuda.test.tsx «la ayuda está donde se necesita»; navegacion.test.tsx «H10»; TC27

**H10.3 — La ayuda está orientada a la solución de problemas?** · Panel: NO, en NINGÚN caso (0) · **Corregido**

- *Hallazgo:* Solo un correo; no hay guías para resolver problemas.
- *Cambio:* Guías paso a paso: "No puedo ingresar", "La página me devolvió a Ingresar", "No hay conexión con el servidor".
- *Archivos:* `pages/Ayuda.tsx`
- *Evidencia:* heuristicas/ayuda.test.tsx «guía orientada a resolver»

**H10.4 — Dispone de un apartado de preguntas frecuentes?** · Panel: NO, en NINGÚN caso (0) · **Corregido**

- *Hallazgo:* No existe sección de preguntas frecuentes.
- *Cambio:* 6 preguntas frecuentes desplegables, enlazables por #ancla.
- *Archivos:* `pages/Ayuda.tsx`
- *Evidencia:* heuristicas/ayuda.test.tsx «#ancla abre la pregunta»

**H10.5 — La documentación de ayuda es clara, utiliza ejemplos?** · Panel: NO, en NINGÚN caso (0) · **Corregido**

- *Hallazgo:* No hay documentación con ejemplos.
- *Cambio:* Ejemplos de correos y contraseñas aceptados y rechazados, y de referencia de pedido.
- *Archivos:* `pages/Ayuda.tsx`
- *Evidencia:* heuristicas/ayuda.test.tsx «ejemplos concretos»; Cypress

### 11- Guardar estado

**H11.3 — Tiene buena respuesta a fallos ajenos? (Cortes de corriente, de internet, …)** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* Ante fallos responde controlado pero sin reintentos.
- *Cambio:* Aviso cuando se pierde internet (también en Ingresar y Crear cuenta); "Reintentar" en Mi cuenta y Estadísticas; Mi cuenta ya no dice "no tienes pedidos" cuando en realidad falló.
- *Archivos:* `AvisoSinConexion.tsx`, `useConexion.ts`, `Dashboard.tsx`, `AdminStats.tsx`, `ErrorMessage.tsx`
- *Evidencia:* heuristicas/sistema.test.tsx «H11.3»; ramas-restantes.test.tsx; admin-stats.test.tsx; Cypress «H11»

### 12- Color y legibilidad

**H12.1 — Las fuentes del texto tienen un tamaño adecuado?** · Panel: No siempre (0.33) · **Corregido**

- *Hallazgo:* Tamaño de fuente "No siempre" adecuado.
- *Cambio:* Etiquetas, ayudas y errores de 12 px a 13 px; descripción de portada sin peso 300.
- *Archivos:* `index.css`, `shape-landing-hero.tsx`
- *Evidencia:* Revisión visual

**H12.2 — Las fuentes del texto utilizan colores con suficiente contraste con el fondo?** · Panel: Sí, pero faltan algunos casos (0.66) · **Corregido**

- *Hallazgo:* Contraste suficiente salvo algunos casos.
- *Cambio:* --ink-faint de 4,09:1 a 4,55:1 sobre --surface-2; texto de portada de 40 % a 80 % de opacidad (≈3,5:1 → AA). Todos los colores de texto ≥ 4,5:1 sobre los tres fondos.
- *Archivos:* `index.css`, `shape-landing-hero.tsx`
- *Evidencia:* Cálculo de contraste WCAG (fórmula de luminancia relativa); revisión visual

**H12.3 — El texto con imágenes o patrones de fondo es fácil de leer?** · Panel: Imposible de comprobar (WR) · **Verificar en pantalla**

- *Hallazgo:* Imposible de comprobar: texto sobre el fondo WebGL animado.
- *Cambio:* Se agregó sombra al texto de portada y más opacidad. Además, con "reducir movimiento" el fondo queda fijo. Falta comprobarlo en un navegador real.
- *Archivos:* `shape-landing-hero.tsx`, `ShaderBackground.tsx`
- *Evidencia:* Revisión visual pendiente

**H12.4 — Se tiene en cuenta a los usuarios con visión reducida?** · Panel: No siempre (0.33) · **Corregido**

- *Hallazgo:* Zoom y foco visible sí, pero ignoraba "reducir movimiento".
- *Cambio:* El fondo WebGL pinta un cuadro fijo si el sistema pide reducir movimiento (el CSS y framer-motion ya lo respetaban).
- *Archivos:* `ShaderBackground.tsx`
- *Evidencia:* shader-background.test.tsx «H12: reducir movimiento»

### 13- Autonomía

**H13.1 — Se mantiene en todo momento informado al usuario del estado del sistema?** · Panel: No siempre (0.33) · **Corregido (integración)**

- *Hallazgo:* Siempre respondía 401 igual; no avisaba de demasiados intentos.
- *Cambio:* El backend limita los intentos (429 con tiempo de espera) y el frontend muestra el mensaje; la guía "No puedo ingresar" lo explica.
- *Archivos:* `Backend login-limiter`, `Login.tsx`, `Ayuda.tsx`
- *Evidencia:* perfil-y-sesion.test.tsx «429»; cypress/api «429»

**H13.3 — El usuario puede personalizar su espacio personal o de trabajo del sistema?** · Panel: NO, en NINGÚN caso (0) · **Corregido (integración)**

- *Hallazgo:* No existía opción para editar el perfil.
- *Cambio:* Mi perfil permite cambiar nombre y contraseña.
- *Archivos:* `Profile.tsx`
- *Evidencia:* perfil-y-sesion.test.tsx; Serenity perfil.feature

## Pendientes que no dependen del frontend

1. ~~H7.1 — Banear a un administrador~~ **Resuelto en el backend** (403 atómico, ver H7.1).
2. **H8.1 — Verificación del correo al registrarse.** Requiere un proveedor de correo y un endpoint de confirmación en el backend.
3. **H12.3 — Texto sobre el fondo animado.** Se reforzó la opacidad y la sombra, pero solo se puede confirmar en un navegador real.

## Qué falta para cerrar el criterio 3 de la rúbrica

- Que el equipo **re-evalúe** la versión refactorizada con el mismo libro y compare el porcentaje con el 63,76 % original.
- Tomar capturas antes/después de las pantallas tocadas: Ingresar, Crear cuenta, Mi cuenta, Mi perfil, Ayuda y el panel.
- Ejecutar las suites E2E (Cypress, Serenity y Katalon) contra el backend real y guardar la evidencia.

## Pruebas agregadas por la refactorización

| Suite | Antes | Ahora | Nuevas para heurísticas |
|---|---|---|---|
| Vitest | 363 | 415 | `test/unit/heuristicas/` (ayuda, formularios, sistema), traducciones de errores, reducir movimiento, 3 auditorías axe |
| Cypress | — | +13 casos | `cypress/e2e/heuristicas.cy.ts` |
| Serenity/JS | 30 escenarios | 35 | `features/heuristicas.feature` (Screenplay: tareas `FollowLink`, `TypeRegisterPassword`, `TypeProfileNameWithoutSaving`, `DiscardProfileChanges`; preguntas `Usability.*`) |
| Katalon | 26 casos | 29 | TC27 (ayuda desde Ingresar), TC28 (requisitos en vivo), TC29 (Garantías del pie) |
