# CelularPro — Plan de pruebas E2E (ESC-13 y ESC-26 a ESC-30)

## Application Overview

CelularPro es una tienda de celulares (nuevos, certificados y usados verificados) con un panel de administración.
El front es React + Vite y habla con una API REST (`/api/v1`). Esta prueba cubre las funcionalidades de Santiago:

| Escenario | Funcionalidad | Pantalla |
|-----------|---------------|----------|
| ESC-13 | Recomendación de productos («También te puede interesar») | `/phones/:slug` |
| ESC-26 | Banear usuario | `/admin/users` |
| ESC-27 | Desbanear usuario | `/admin/users` |
| ESC-28 | Consultar usuarios (buscador) | `/admin/users` |
| ESC-29 | Estadísticas del administrador | `/admin/stats` |
| ESC-30 | Gestión del catálogo (crear, editar, eliminar) | `/admin/phones`, `/admin/phones/new`, `/admin/phones/:id/edit` |

**Punto de partida común (seed):** `seed.spec.ts` deja a la administradora (`admin@celularpro.co`) con la sesión iniciada
por el formulario de `/login`. Los escenarios de ESC-13 son públicos y no necesitan sesión.

**Reglas del plan**

- Cada escenario es independiente: crea sus propios datos por la API con un sufijo único y no depende de otro.
- La API es el oráculo. Lo que se ve en pantalla se compara con lo que responde `GET /phones/:slug/similares`,
  `GET /admin/stats`, `GET /phones/:slug` o `POST /auth/login`.
- Datos esperados que la pantalla debe mostrar tal cual: motivo mínimo de baneo = 4 caracteres; recomendaciones = 4 como máximo;
  catálogo del panel = 50 por página, el más nuevo primero.

## Test Scenarios

### 1. ESC-26 Banear usuario

**Seed:** `seed.spec.ts`

#### 1.1 Banear con un motivo válido

**File:** `tests/esc-26-banear-usuario/banear-con-motivo-valido.spec.ts`

**Steps:**
  1. Abrir /admin/users y buscar a Carlos por su correo
  2. Pulsar «Banear» en la fila de Carlos
  3. Escribir el motivo «Spam en los comentarios»
  4. Pulsar «Confirmar baneo»

**Expected Results:**
  - Se abre el diálogo «Banear usuario» con el correo de Carlos.
  - El diálogo se cierra y la fila pasa de «Activo» a «Baneado», con el motivo escrito y el botón «Desbanear».
  - Carlos ya no puede iniciar sesión (la API rechaza el login).

#### 1.2 Un motivo de menos de 4 caracteres no se puede confirmar

**File:** `tests/esc-26-banear-usuario/motivo-de-menos-de-4-caracteres-no-se-puede-confirmar.spec.ts`

**Steps:**
  1. Abrir el diálogo de baneo de Bruno
  2. Escribir «abc» (3 caracteres, justo por debajo del límite)
  3. Escribir «abcd» (4 caracteres, justo en el límite)
  4. Escribir solo espacios: el motivo se recorta, así que no cuenta

**Expected Results:**
  - Sin motivo y con «abc», «Confirmar baneo» está deshabilitado y la ayuda dice «Mínimo 4 caracteres».
  - Con «abcd» el botón se habilita.
  - Con solo espacios vuelve a deshabilitarse.
  - Bruno sigue pudiendo iniciar sesión.

#### 1.3 Cancelar el diálogo no banea

**File:** `tests/esc-26-banear-usuario/cancelar-el-dialogo-no-banea.spec.ts`

**Steps:**
  1. Abrir el diálogo de baneo de Camila y escribir un motivo válido
  2. Pulsar «Cancelar»

**Expected Results:**
  - El diálogo se cierra, la fila sigue «Activo» y Camila puede iniciar sesión.

#### 1.4 El administrador no puede banearse a sí mismo

**File:** `tests/esc-26-banear-usuario/el-administrador-no-puede-banearse-a-si-mismo.spec.ts`

**Steps:**
  1. Buscar la propia cuenta del administrador en /admin/users

**Expected Results:**
  - La fila se marca «(tú)» y no ofrece «Banear» ni cambiar el rol.

### 2. ESC-27 Desbanear usuario

**Seed:** `seed.spec.ts`

#### 2.1 Desbanear devuelve la cuenta a Activo

**File:** `tests/esc-27-desbanear-usuario/desbanear-devuelve-la-cuenta-a-activo.spec.ts`

**Steps:**
  1. Buscar a Diana (baneada por la API antes de empezar) en /admin/users
  2. Pulsar «Desbanear» en su fila

**Expected Results:**
  - Antes: la fila dice «Baneado» y muestra el motivo.
  - Después: la fila dice «Activo», ya no muestra el motivo y ofrece «Banear».
  - Diana vuelve a poder iniciar sesión.

#### 2.2 Una cuenta activa ofrece Banear y no Desbanear

**File:** `tests/esc-27-desbanear-usuario/una-cuenta-activa-ofrece-banear-y-no-desbanear.spec.ts`

**Steps:**
  1. Buscar a Elias (cuenta activa) en /admin/users

**Expected Results:**
  - La fila dice «Activo», ofrece «Banear» y no ofrece «Desbanear».

### 3. ESC-28 Consultar usuarios

**Seed:** `seed.spec.ts`

#### 3.1 Buscar por un texto compartido muestra a todos y solo a esos usuarios

**File:** `tests/esc-28-consultar-usuarios/buscar-por-un-texto-compartido-muestra-a-todos-y-solo-a-esos.spec.ts`

**Steps:**
  1. Escribir en el buscador una marca que comparten dos usuarios recién creados

**Expected Results:**
  - La tabla tiene exactamente esas dos filas (las mismas que devuelve la API) y el contador dice «2 usuarios registrados».

#### 3.2 Buscar con el correo completo deja una sola fila

**File:** `tests/esc-28-consultar-usuarios/buscar-con-el-correo-completo-deja-una-sola-fila.spec.ts`

**Steps:**
  1. Escribir el correo completo de Fabio en el buscador
  2. Cambiar la búsqueda a mayúsculas

**Expected Results:**
  - Una sola fila, la de Fabio, y el contador dice «1 usuario registrado».
  - En mayúsculas el resultado es el mismo: la búsqueda no distingue mayúsculas de minúsculas.

#### 3.3 Una búsqueda sin coincidencias avisa que no hay resultados

**File:** `tests/esc-28-consultar-usuarios/una-busqueda-sin-coincidencias-avisa-que-no-hay-resultados.spec.ts`

**Steps:**
  1. Escribir un correo que no existe en el buscador de /admin/users
  2. Pulsar «Quitar la búsqueda»

**Expected Results:**
  - Se avisa «Ningún usuario coincide con tu búsqueda» y no queda ninguna fila.
  - Al quitar la búsqueda el buscador queda vacío y la tabla vuelve con usuarios.

### 4. ESC-29 Estadísticas del administrador

**Seed:** `seed.spec.ts`

#### 4.1 Las tarjetas de usuarios, inventario y órdenes coinciden con la API

**File:** `tests/esc-29-estadisticas/las-tarjetas-coinciden-con-la-api.spec.ts`

**Steps:**
  1. Abrir /admin/stats
  2. Leer la tarjeta «Usuarios»
  3. Leer la tarjeta «Inventario»
  4. Leer la tarjeta «Órdenes»

**Expected Results:**
  - Cada una de las 14 cifras es igual a la de `GET /admin/stats`.

#### 4.2 Al banear a un usuario, el contador de baneados sube en uno

**File:** `tests/esc-29-estadisticas/al-banear-a-un-usuario-el-contador-de-baneados-sube-en-uno.spec.ts`

**Steps:**
  1. Abrir /admin/stats y leer «Baneados» en la tarjeta «Usuarios» después de banear a Gastón por la API

**Expected Results:**
  - «Baneados» es el valor de antes más uno.

#### 4.3 El total de usuarios cuenta a la persona recién registrada

**File:** `tests/esc-29-estadisticas/el-total-de-usuarios-cuenta-a-la-persona-recien-registrada.spec.ts`

**Steps:**
  1. Abrir /admin/stats y leer «Total registrados» en la tarjeta «Usuarios» después de registrar a Helena

**Expected Results:**
  - «Total registrados» es el valor de antes más uno.

### 5. ESC-30 Gestión del catálogo

**Seed:** `seed.spec.ts`

#### 5.1 Crear un celular llenando el formulario

**File:** `tests/esc-30-gestion-del-catalogo/crear-un-celular-llenando-el-formulario.spec.ts`

**Steps:**
  1. Abrir /admin/phones/new
  2. Llenar nombre, slug, marca, categoría, precio y stock
  3. Pulsar «Crear celular»

**Expected Results:**
  - La página vuelve a /admin/phones y el celular nuevo aparece en la tabla.
  - La API guarda exactamente lo escrito: nombre, marca, precio 2.300.000 y stock 7.

#### 5.2 El formulario vacío no se envía y explica los errores

**File:** `tests/esc-30-gestion-del-catalogo/el-formulario-vacio-no-se-envia-y-explica-los-errores.spec.ts`

**Steps:**
  1. Abrir /admin/phones/new sin llenar nada
  2. Pulsar «Crear celular»

**Expected Results:**
  - Nombre y slug: «Mínimo 3 caracteres»; marca y categoría: «Requerido»; precio: «Debe ser positivo».
  - El campo Nombre queda marcado como inválido y la página sigue en el formulario.

#### 5.3 Un precio en cero no se acepta

**File:** `tests/esc-30-gestion-del-catalogo/un-precio-en-cero-no-se-acepta.spec.ts`

**Steps:**
  1. Llenar el formulario con datos válidos, pero con precio 0
  2. Pulsar «Crear celular»

**Expected Results:**
  - Solo el precio muestra error («Debe ser positivo») y el celular no se crea.

#### 5.4 Editar el precio de un celular y guardar

**File:** `tests/esc-30-gestion-del-catalogo/editar-el-precio-de-un-celular-y-guardar.spec.ts`

**Steps:**
  1. Abrir la edición de un celular de 900.000
  2. Cambiar el precio a 850000
  3. Pulsar «Guardar cambios»

**Expected Results:**
  - El formulario carga el nombre y el precio actuales.
  - La API guarda 850.000 y conserva el nombre y el stock.

#### 5.5 Eliminar un celular desde la tabla

**File:** `tests/esc-30-gestion-del-catalogo/eliminar-un-celular-desde-la-tabla.spec.ts`

**Steps:**
  1. Abrir /admin/phones y ubicar la fila del celular (el más nuevo sale primero)
  2. Pulsar «Eliminar» y aceptar la pregunta de confirmación del navegador

**Expected Results:**
  - La pregunta nombra al celular, la fila desaparece y la API responde 404 para ese slug.

#### 5.6 Cancelar la pregunta de confirmación conserva el celular

**File:** `tests/esc-30-gestion-del-catalogo/cancelar-la-pregunta-de-confirmacion-conserva-el-celular.spec.ts`

**Steps:**
  1. Abrir /admin/phones y pulsar «Eliminar» en la fila del celular
  2. Rechazar la pregunta de confirmación del navegador

**Expected Results:**
  - La fila sigue en la tabla y la API sigue devolviendo el celular.

### 6. ESC-13 Recomendación de productos

**Seed:** `seed.spec.ts`

#### 6.1 Las recomendaciones en pantalla salen de la API

**File:** `tests/esc-13-recomendacion-de-productos/las-recomendaciones-en-pantalla-salen-de-la-api.spec.ts`

**Steps:**
  1. Abrir la ficha del iPhone 15 Pro Max
  2. Ubicar la sección «También te puede interesar»

**Expected Results:**
  - La sección muestra los mismos celulares, en el mismo orden, que `GET /phones/iphone-15-pro-max/similares?limit=4`.
  - El celular que se está viendo no se recomienda a sí mismo.

#### 6.2 Abrir una recomendación lleva a la ficha de ese celular

**File:** `tests/esc-13-recomendacion-de-productos/abrir-una-recomendacion-lleva-a-la-ficha-de-ese-celular.spec.ts`

**Steps:**
  1. Abrir la ficha del iPhone 15 Pro Max
  2. Pulsar la primera tarjeta recomendada

**Expected Results:**
  - La URL cambia a la del celular recomendado y el título principal es su nombre.

#### 6.3 Un celular parecido y con stock aparece entre las recomendaciones

**File:** `tests/esc-13-recomendacion-de-productos/un-celular-parecido-y-con-stock-aparece-entre-las-recomendaciones.spec.ts`

**Steps:**
  1. Publicar por la API un celular Apple, de la misma categoría y el mismo precio, con stock 4
  2. Abrir la ficha del iPhone 15 Pro Max

**Expected Results:**
  - El celular nuevo aparece en «También te puede interesar».

#### 6.4 Un celular parecido pero sin stock no se recomienda

**File:** `tests/esc-13-recomendacion-de-productos/un-celular-parecido-pero-sin-stock-no-se-recomienda.spec.ts`

**Steps:**
  1. Publicar por la API un celular idéntico en marca, categoría y precio, pero con stock 0
  2. Abrir la ficha del iPhone 15 Pro Max

**Expected Results:**
  - El celular agotado no aparece entre las recomendaciones.

#### 6.5 Muestra como máximo 4 recomendaciones

**File:** `tests/esc-13-recomendacion-de-productos/muestra-como-maximo-4-recomendaciones.spec.ts`

**Steps:**
  1. Publicar por la API cinco celulares Apple de la misma categoría y el mismo precio, con stock
  2. Abrir la ficha del iPhone 15 Pro Max

**Expected Results:**
  - La API devuelve 4 recomendaciones y la sección muestra exactamente 4 tarjetas.
