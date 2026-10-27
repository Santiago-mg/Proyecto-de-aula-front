# Integración del frontend con el backend de Proyecto-de-aula-mario

Este frontend estaba escrito para otro backend (`Proyecto-de-aula-mario-v2`, que no
viene en la entrega). Contra el backend de Proyecto-de-aula-mario fallaban la gestión
de perfil y el cierre de sesión, y las reglas de credenciales no coincidían. Este
documento resume qué se cambió y por qué.

## 1. Rutas que no existían en el backend

| Antes (frontend) | Backend real | Efecto antes del cambio | Ahora |
|---|---|---|---|
| `PUT /auth/me` | `PATCH /auth/me` | 404: no se podía editar el nombre | `PATCH /auth/me` |
| `PUT /auth/password`, esperando `{ user, token }` | `PUT /auth/me/password` → 204 | 404: no se podía cambiar la contraseña | `PUT /auth/me/password`; la sesión se conserva |
| `POST /auth/logout` | No existe | 404 silencioso en cada cierre de sesión | Se borra el token en el navegador (JWT sin estado) |

Archivos: `src/services/auth.service.ts`, `src/context/AuthContext.tsx`.

## 2. Reglas de credenciales distintas a las del servidor

| Regla | Antes (frontend) | Backend | Ahora |
|---|---|---|---|
| Dominio al registrarse | Cualquiera | Gmail, Outlook, Hotmail, Yahoo, iCloud | Igual que el backend |
| Dominio al iniciar sesión | Cualquiera | Cualquiera | Sin cambios |
| Contraseña | Letra y número | Mayúscula, minúscula y número | Igual que el backend |
| Mensajes | Propios | Los de `domain/credenciales.ts` | Los mismos textos |

Antes, un correo institucional o una clave sin mayúscula pasaban el formulario y el
servidor respondía 400 después de enviar (heurística H5, prevención de errores).

Archivos: `src/utils/validacion.ts`, `src/pages/Register.tsx`, `src/pages/Profile.tsx`.

## 3. Cuenta suspendida durante la sesión

El backend responde **403 "Tu cuenta ha sido suspendida. Motivo: …"** cuando un
administrador suspende una cuenta con la sesión abierta. Antes el frontend mostraba
errores sueltos en cada acción. Ahora `api.ts` cierra la sesión y `/login` muestra el
motivo. El 403 "Acceso restringido a administradores" no cierra la sesión.

Archivos: `src/services/api.ts`, `src/utils/errores.ts`.

## 4. Pruebas

| Suite | Cambio | Estado |
|---|---|---|
| Vitest | Pruebas ajustadas al contrato real, más `reglas-backend.test.ts` (regresión de reglas), `auth-service-contrato.test.ts` (rutas) y los casos de suspensión, cierre de sesión y dominio | **363/363 ejecutadas en verde** (antes 339; 415 tras la refactorización por heurísticas, ver `REFACTORIZACION-HEURISTICAS.md`) |
| Cypress | Rutas, códigos y mensajes del backend real; correos `@gmail.com`; casos nuevos de dominio, mayúscula, `PATCH /auth/me` y 204 del cambio de contraseña. La prueba de `Cache-Control`/`nosniff` queda en `it.skip`, porque el backend aún no envía esas cabeceras | Compila; **falta ejecutar** |
| Serenity/JS | Escenario "Correo con un dominio no permitido" y esquema de contraseñas con 4 filas | Compila; dry-run de 30 escenarios con todos los pasos definidos; **falta ejecutar** |
| Katalon | Correos, mensajes y casos nuevos TC25 y TC26 en la suite completa | `verificar-localizadores.py` contra este backend: 444 comprobaciones OK; **falta ejecutar** |

## 5. Pendiente para el equipo

1. Ejecutar `npm run cy:component`, `npm run cy:api` y `npm run cy:e2e` con el backend
   levantado (`npm run dev` en Proyecto-de-aula-mario y `npm run db:seed`).
2. Ejecutar Serenity (`cd e2e/serenityjs && npm test`) y la suite Katalon (en Katalon
   Recorder y con `node e2e/katalon/ejecutar-selenese.cjs`), y reemplazar la evidencia
   de `e2e/evidencia/` y `e2e/katalon/evidencia/`.
3. ~~Agregar `helmet` y `Cache-Control: no-store` en el backend~~ **Hecho**: el backend los
   envía y la prueba de Cypress ya está activa (`cypress/api/contrato-y-seguridad.cy.ts`).
