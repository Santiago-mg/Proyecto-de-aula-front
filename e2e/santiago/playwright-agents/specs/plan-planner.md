# Plan de pruebas: Administración de usuarios (banear, desbanear, buscar) - CelularPro

## Application Overview

Página /admin/users de CelularPro (http://localhost:8081/admin/users). Requiere sesión admin (admin@celularpro.co / admin1234). UI observada: título "Usuarios", contador "N usuarios registrados", buscador "Buscar por nombre o email" (placeholder "Buscar por nombre o email..."), tabla con columnas Usuario, Rol, Órdenes, Registro, Estado, Acciones; botones por fila "Banear" / "Desbanear" y "Hacer admin"; paginación "← Anterior" / "Siguiente →" ("Página 1 / 5" sin filtro). Banear abre el diálogo "Banear usuario" con campo "Motivo del baneo" (mínimo 4 caracteres), botones "Cancelar" y "Confirmar baneo". Desbanear es inmediato, sin confirmación. La búsqueda es en vivo (sin botón), case-insensitive. Sin resultados: "Ningún usuario coincide con tu búsqueda" / "Prueba con otra parte del nombre o del correo." / botón "Quitar la búsqueda". La fila del admin logueado muestra "(tú)" y no tiene botones de acción. Datos de prueba sugeridos: usuario "Helena Playwright" (helena.pw.7d66bb68@gmail.com), activo. Cada escenario que banee debe desbanear al final para dejar el estado limpio. Los nombres/correos de usuarios de prueba pueden variar; localizar un usuario activo con rol Usuario mediante búsqueda.

## Test Scenarios

### 1. Búsqueda de usuarios

**Seed:** `seed.spec.ts`

#### 1.1. Buscar por nombre sin importar mayúsculas/minúsculas

**File:** `tests/admin-users/buscar-nombre.spec.ts`

**Steps:**
  1. Iniciar sesión como admin y abrir /admin/users
    - expect: Se muestra el encabezado 'Usuarios' y el contador '86 usuarios registrados' (o el total vigente)
    - expect: Paginación visible con 'Página 1 / N'
  2. Escribir 'HELENA' en el campo 'Buscar por nombre o email'
    - expect: La tabla se filtra en vivo, sin pulsar botón
    - expect: Solo aparece la fila 'Helena Playwright'
    - expect: El contador pasa a '1 usuario registrado' (singular)
  3. Reemplazar el texto por 'helena' y luego por 'HeLeNa'
    - expect: El resultado es el mismo en ambos casos (búsqueda case-insensitive)

#### 1.2. Buscar por correo completo y parcial

**File:** `tests/admin-users/buscar-email.spec.ts`

**Steps:**
  1. Escribir 'helena.pw.7d66bb68@gmail.com' en el buscador
    - expect: Aparece únicamente la fila de Helena Playwright
  2. Cambiar el texto por 'helena.pw'
    - expect: Sigue apareciendo Helena Playwright
  3. Cambiar el texto por 'playwright'
    - expect: Contador con varios usuarios (p. ej. '10 usuarios registrados'), todas las filas contienen 'playwright' en nombre o correo
    - expect: Los controles de paginación desaparecen si todos caben en una página

#### 1.3. Búsqueda sin resultados y limpiar con 'Quitar la búsqueda'

**File:** `tests/admin-users/buscar-sin-resultados.spec.ts`

**Steps:**
  1. Escribir 'zzzxyz' en el buscador
    - expect: Contador '0 usuarios registrados'
    - expect: Mensaje 'Ningún usuario coincide con tu búsqueda' y texto 'Prueba con otra parte del nombre o del correo.'
    - expect: Botón 'Quitar la búsqueda' visible
  2. Pulsar 'Quitar la búsqueda'
    - expect: El campo de búsqueda queda vacío y se restablece el listado completo con su contador y paginación

#### 1.4. Búsqueda con espacios y caracteres especiales

**File:** `tests/admin-users/buscar-casos-borde.spec.ts`

**Steps:**
  1. Escribir '  helena ' (espacios al inicio y al final)
    - expect: Se muestra Helena Playwright (los espacios sobrantes se ignoran)
  2. Escribir '<script>'
    - expect: Contador '0 usuarios registrados' y mensaje de sin resultados
    - expect: No se ejecuta ningún script ni aparece diálogo; la página no se rompe
  3. Borrar el texto manualmente
    - expect: Se restablece el listado completo

#### 1.5. Buscar al propio administrador

**File:** `tests/admin-users/buscar-admin.spec.ts`

**Steps:**
  1. Escribir 'admin@celularpro' en el buscador
    - expect: Aparece la fila 'Admin CelularPro' con la marca '(tú)', rol ADMIN y estado ACTIVO
  2. Revisar la columna Acciones de esa fila
    - expect: No hay botones 'Banear' ni 'Hacer admin' (un admin no puede banearse a sí mismo)

### 2. Banear usuarios

**Seed:** `seed.spec.ts`

#### 2.1. Banear usuario con motivo válido (camino feliz) y persistencia

**File:** `tests/admin-users/banear-feliz.spec.ts`

**Steps:**
  1. Abrir /admin/users, anotar el contador de baneados del Dashboard (p. ej. '31 baneados') y buscar 'helena.pw'
    - expect: Fila de Helena Playwright con estado 'Activo' y botones 'Banear' y 'Hacer admin'
  2. Pulsar 'Banear a Helena Playwright'
    - expect: Se abre el diálogo 'Banear usuario' con el texto 'Vas a suspender la cuenta de Helena Playwright (helena.pw.7d66bb68@gmail.com). El usuario no podrá iniciar sesión.'
    - expect: Campo 'Motivo del baneo' vacío con ayuda 'Mínimo 4 caracteres. El motivo queda registrado en la cuenta.'
    - expect: 'Confirmar baneo' deshabilitado; 'Cancelar' habilitado
  3. Escribir 'Motivo de prueba QA' y pulsar 'Confirmar baneo'
    - expect: El diálogo se cierra
    - expect: La fila muestra estado 'Baneado' con el motivo 'Motivo de prueba QA'
    - expect: El botón cambia a 'Desbanear a Helena Playwright'; 'Hacer admin' sigue visible
  4. Recargar la página y buscar de nuevo 'helena.pw'
    - expect: El estado 'Baneado' y el motivo persisten
  5. Abrir /admin (Dashboard)
    - expect: El contador de baneados aumenta en 1 (p. ej. '32 baneados')
  6. Limpieza: volver a /admin/users, buscar 'helena.pw' y pulsar 'Desbanear a Helena Playwright'
    - expect: El usuario vuelve a 'Activo'

#### 2.2. Validación del motivo de baneo (mínimo 4 caracteres)

**File:** `tests/admin-users/banear-validacion-motivo.spec.ts`

**Steps:**
  1. Buscar 'helena.pw' y pulsar 'Banear a Helena Playwright'
    - expect: Diálogo 'Banear usuario' abierto
  2. Escribir 'abc' (3 caracteres)
    - expect: 'Confirmar baneo' permanece deshabilitado
  3. Reemplazar por solo espacios '    '
    - expect: 'Confirmar baneo' permanece deshabilitado (los espacios no cuentan)
  4. Escribir 'abcd' (4 caracteres)
    - expect: 'Confirmar baneo' se habilita
  5. Pulsar 'Cancelar' sin confirmar
    - expect: El diálogo se cierra y el usuario sigue 'Activo'

#### 2.3. Cancelar el baneo no modifica al usuario

**File:** `tests/admin-users/banear-cancelar.spec.ts`

**Steps:**
  1. Buscar 'helena.pw', pulsar 'Banear a Helena Playwright' y escribir 'Motivo que no se guardara'
    - expect: El diálogo muestra el texto escrito y 'Confirmar baneo' está habilitado
  2. Pulsar 'Cancelar'
    - expect: El diálogo se cierra; la fila sigue con estado 'Activo' y botón 'Banear'
  3. Pulsar nuevamente 'Banear a Helena Playwright'
    - expect: El campo 'Motivo del baneo' aparece vacío (no conserva el texto previo)
  4. Pulsar la tecla Escape
    - expect: El diálogo se cierra sin banear
  5. Recargar la página
    - expect: Helena Playwright continúa 'Activo'

#### 2.4. Motivo de baneo con caracteres especiales y texto largo

**File:** `tests/admin-users/banear-motivo-borde.spec.ts`

**Steps:**
  1. Banear a un usuario activo con el motivo '<b>Fraude</b> & "spam" ñandú 😀'
    - expect: El baneo se aplica
    - expect: El motivo se muestra como texto literal (sin interpretar HTML) en la columna Estado
  2. Desbanear al usuario y banearlo con un motivo de 300 caracteres
    - expect: El baneo se aplica o se muestra un error controlado; el diseño de la tabla no se rompe
  3. Limpieza: desbanear al usuario
    - expect: El usuario vuelve a 'Activo'

#### 2.5. El administrador logueado no puede banearse a sí mismo

**File:** `tests/admin-users/banear-a-si-mismo.spec.ts`

**Steps:**
  1. Buscar 'admin@celularpro' en /admin/users
    - expect: Fila 'Admin CelularPro (tú)' sin botones 'Banear' ni 'Hacer admin'
  2. Buscar por texto 'Banear a Admin CelularPro' mediante el árbol de accesibilidad / localizador
    - expect: No existe ningún botón 'Banear a Admin CelularPro'

#### 2.6. Usuario ya baneado no ofrece la acción 'Banear'

**File:** `tests/admin-users/banear-ya-baneado.spec.ts`

**Steps:**
  1. Buscar un usuario ya baneado (p. ej. 'gaston.pw')
    - expect: Estado 'Baneado' con motivo (p. ej. 'Cuenta usada para fraude')
    - expect: Solo está disponible 'Desbanear a ...' y 'Hacer admin a ...'; no existe 'Banear a ...'

### 3. Desbanear usuarios

**Seed:** `seed.spec.ts`

#### 3.1. Desbanear usuario baneado (camino feliz) y persistencia

**File:** `tests/admin-users/desbanear-feliz.spec.ts`

**Steps:**
  1. Precondición: banear a Helena Playwright con el motivo 'Preparacion QA'
    - expect: Estado 'Baneado' con el motivo
  2. Pulsar 'Desbanear a Helena Playwright'
    - expect: La acción se aplica de inmediato, sin diálogo de confirmación
    - expect: La fila pasa a estado 'Activo' sin motivo
    - expect: El botón vuelve a ser 'Banear a Helena Playwright'
  3. Recargar la página y buscar 'helena.pw'
    - expect: El usuario sigue 'Activo'
  4. Abrir /admin
    - expect: El contador de baneados regresa al valor previo a la prueba

#### 3.2. Desbanear y volver a banear el mismo usuario (ciclo)

**File:** `tests/admin-users/ciclo-ban-desban.spec.ts`

**Steps:**
  1. Banear a Helena Playwright con motivo 'Primer baneo'
    - expect: Estado 'Baneado' con 'Primer baneo'
  2. Desbanear
    - expect: Estado 'Activo'
  3. Banear otra vez con motivo 'Segundo baneo'
    - expect: Estado 'Baneado' mostrando 'Segundo baneo' (no el motivo anterior)
  4. Limpieza: desbanear
    - expect: Estado 'Activo'

#### 3.3. Banear/desbanear mientras hay un filtro activo

**File:** `tests/admin-users/ban-con-filtro.spec.ts`

**Steps:**
  1. Buscar 'helena.pw' y banear al usuario con motivo 'Prueba con filtro'
    - expect: La fila permanece visible con estado 'Baneado'; el texto del buscador se mantiene y el contador sigue en '1 usuario registrado'
  2. Desbanear desde la misma vista filtrada
    - expect: La fila pasa a 'Activo' y el filtro se mantiene

#### 3.4. Cambio de estado visible tras paginar (sin filtro)

**File:** `tests/admin-users/ban-paginacion.spec.ts`

**Steps:**
  1. En /admin/users sin filtro, pulsar 'Siguiente →'
    - expect: Se muestra 'Página 2 / 5'; 'Anterior' queda habilitado
  2. Banear a un usuario activo de esa página con motivo 'Prueba paginacion'
    - expect: La fila muestra 'Baneado' y la página actual no cambia
  3. Pulsar '← Anterior' y luego 'Siguiente →'
    - expect: El usuario sigue baneado al volver a la página 2
  4. Limpieza: desbanear al usuario
    - expect: Estado 'Activo'
