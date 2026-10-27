> ⚠️ Las columnas **Backend**, las suites transversales y la sección de k6 de este
> documento describen el backend `Proyecto-de-aula-mario-v2`, que no viene en la
> entrega. El frontend ahora trabaja con el backend de **Proyecto-de-aula-mario**;
> para sus pruebas, ver `docs/pruebas/` en ese proyecto. Las cifras del frontend
> se actualizaron: 415 pruebas Vitest, 35 escenarios Serenity y 29 casos Katalon
> (más la falla controlada TC99).

# Cobertura de pruebas por funcionalidad

Qué prueba cubre cada una de las 6 funcionalidades y **cuáles se ejecutaron**. Las cantidades salen de contar lo que existe (resultados de `vitest`, escenarios ejecutados de Serenity y Katalon, especificaciones de Cypress).

| Funcionalidad | Backend (vitest) | Frontend (vitest + RTL) | Accesibilidad (axe) | Serenity/JS | Katalon | Cypress (e2e y componentes) |
|---|---|---|---|---|---|---|
| **F1 Registro de usuario** | 9 | 8 | 2 | 6 | 4 de 4 | 7 |
| **F2 Inicio de sesión** | 18 | 10 | 2 | 5 | 4 de 4 | 5 |
| **F3 Gestión de perfil** | 12 | 36 | 1 | 4 | 4 de 4 | 9 |
| **F4 Validación de credenciales** | 22 | 26 | 1 | 3 | 3 de 3 | 3 |
| **F5 Control de roles** | 34 | 20 | 1 | 3 | 3 de 3 | 3 |
| **F14 Alertas de stock bajo** | 49 | 31 | 6 | 7 | 6 de 6 | 13 |

Columnas **ejecutadas**: backend, frontend, axe, Serenity y Katalon (ver `e2e/evidencia/RESULTADOS.md`). **Cypress está escrito y verificado con el compilador, pero no se ejecutó** (necesita su binario, que no se pudo descargar donde se generó este paquete).

## Suites transversales del backend (cubren varias funcionalidades a la vez)

| Suite | Cubre | Pruebas |
|---|---|---|
| `contrato-api.test.ts` | F1–F5 y F14 (contrato de las respuestas) | 26 |
| `seguridad-acceso.test.ts` | F1–F5 y F14 (contraseñas, tokens, roles, entradas hostiles) | 40 |
| `rendimiento.test.ts` | F1–F5 y F14 (consultas, tiempos, memoria) | 14 |
| `regresion-flujos.test.ts` | F1–F5 y F14 (historias completas, alertas con propiedades) | 10 |
| `defectos-auth.test.ts` | F1–F5 (un caso por defecto hallado) | 48 |
| `contrato-y-seguridad.cy.ts` (Cypress, API con cy.request) | F1–F5 y F14 (contrato, credenciales, entradas hostiles, roles, cabeceras) | 17 plantillas (no ejecutado) |

Total: **492 pruebas de backend** y **339 de frontend**, todas en verde. Las cifras de Cypress cuentan plantillas `it()`: las que se generan en un bucle producen más casos al ejecutar.

## Archivos propios de cada funcionalidad

- **F1 Registro de usuario** — backend: register.validate-dto, registerUser.use-case. Frontend: register.email-domain, register.submit.
- **F2 Inicio de sesión** — backend: autenticacion, loginUser.use-case, rate-limit.middleware. Frontend: auth-context, login.schema, login.submit.
- **F3 Gestión de perfil** — backend: perfil.use-cases. Frontend: password-input, perfil-y-sesion, persistencia-sesion.
- **F4 Validación de credenciales** — backend: authenticate.middleware, emailSchema, validate.middleware. Frontend: api-interceptor, api-interceptor.peticion, auth-guard, errores, errores-sesion.
- **F5 Control de roles** — backend: admin.use-cases, ban.controller, changeUserRole.use-case, esc-26-banear-usuario, esc-27-desbanear-usuario, esc-28-consultar-usuarios, requireAdmin.middleware, unban.controller. Frontend: admin-route, ban-admin, ban-modal, protected-route, role-confirm, self-protection.
- **F14 Alertas de stock bajo** — backend: esc-31-alertas-stock, esc-31-limites-inventario, pedidos-cancelar-stock, stock-alerts. Frontend: esc-31-alertas-stock.

## Carga (k6) y usuarios reales

| Funcionalidad | Qué mide k6 (`carga/`) | Tareas del kit de pruebas de usuario |
|---|---|---|
| F1 Registro de usuario | carga (registro de usuarios de prueba) | T1, T2 |
| F2 Inicio de sesión | carga, saturación e interferencia de inicio de sesión | T3, T4 |
| F3 Gestión de perfil | carga (editar perfil) | T5, T6 |
| F4 Validación de credenciales | carga (consultar sesión) | T4, T7 |
| F5 Control de roles | carga (lista de alertas con cuenta de administrador) | T8, T12 |
| F14 Alertas de stock bajo | carga (lista de alertas) | T9, T10, T11 |

El kit de pruebas de usuario (`Kit_Pruebas_Usuario_CelularPro.xlsx`) está listo para sesiones con personas reales; **todavía no se hicieron**.
