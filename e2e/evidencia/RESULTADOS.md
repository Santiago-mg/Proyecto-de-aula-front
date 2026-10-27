> **Ejecución vigente (2026-10-25)** — navegador real Chromium 153, frontend en build de producción y la API
> simulada del equipo (`Proyecto-de-aula-mario/frontend/e2e/support/api-simulada.ts`, con `POST /phones` y el
> límite de intentos de login agregados igual que en el backend real):
>
> | Suite | Resultado |
> |---|---|
> | Serenity/JS (Screenplay + Gherkin) | **35 de 35 pasan** |
> | Autify Nexus (Playwright) | **18 de 18 pasan** |
> | Katalon (Selenese) | **29 de 29 pasan**; TC99 falla a propósito, como se espera |
>
> La ejecución encontró y se corrigieron dos defectos: la barra promocional tapaba la parte superior del menú
> (DEF-22, `index.css` y `PromoBar.tsx`) y un escenario de Serenity esperaba 10 intentos fallidos cuando el
> backend bloquea al 5.º (DEF-23). Los reportes JUnit y los logs están en `evidencias-matriz.zip`.
> Lo que sigue en este archivo es la ejecución anterior, contra otra versión del backend.

# Resultados de la ejecución E2E

Fecha de la ejecución: 2026-10-11

## Condiciones (importante para interpretar)

| Elemento | Valor |
|---|---|
| Navegador | Chromium 153, sin interfaz (headless) |
| Equipo | 1 núcleo de CPU, ~4 GB de RAM |
| Frontend | Vite (modo desarrollo), este repositorio |
| Backend | Código real, con **base de datos en memoria** (`npm run dev:memoria`), `bcrypt` 6 real. **No es Postgres** |
| Datos | Administrador `admin@celularpro.co`; cada prueba crea sus propios usuarios y celulares |

## Serenity/JS — 28 de 28 escenarios pasan

| Funcionalidad | Escenarios | Resultado |
|---|---|---|
| Registro de usuario | 6 | 6 correctos |
| Inicio de sesión | 5 | 5 correctos |
| Gestión de perfil | 4 | 4 correctos |
| Validación de credenciales | 3 | 3 correctos |
| Control de roles | 3 | 3 correctos |
| Alertas de stock bajo | 7 | 7 correctos |

Reporte completo: `serenity-js/index.html` (abrir en el navegador). Resumen en texto: `serenity-resumen.txt`.

## Katalon (ejecutor Selenese) — 25 de 25 se comportan como se esperaba

| Caso | Resultado | Pasos | Tiempo |
|---|---|---|---|
| TC01_Registro_correcto | Passed | 16 | 4 s |
| TC02_Registro_clave_solo_numeros | Passed | 15 | 2.4 s |
| TC03_Registro_confirmacion_distinta | Passed | 14 | 2.6 s |
| TC04_Registro_correo_repetido | Passed | 26 | 4.7 s |
| TC05_Login_correcto | Passed | 24 | 4.9 s |
| TC06_Login_clave_incorrecta_usuario_valido | Passed | 25 | 5.9 s |
| TC07_Login_usuario_inexistente_clave_valida | Passed | 12 | 3.2 s |
| TC08_Login_correo_en_mayusculas | Passed | 25 | 5.5 s |
| TC09_Perfil_cambiar_nombre | Passed | 23 | 5.7 s |
| TC10_Perfil_nombre_en_blanco | Passed | 21 | 4.7 s |
| TC11_Perfil_cambiar_contrasena | Passed | 32 | 7.6 s |
| TC12_Perfil_contrasena_actual_incorrecta | Passed | 23 | 4.9 s |
| TC13_Sesion_perfil_sin_login | Passed | 8 | 1.9 s |
| TC14_Sesion_cerrar_sesion | Passed | 20 | 4 s |
| TC15_Sesion_token_corrupto_se_explica | Passed | 19 | 4.4 s |
| TC16_Roles_cliente_no_entra_al_panel | Passed | 18 | 3.6 s |
| TC17_Roles_sin_sesion_panel | Passed | 7 | 1.7 s |
| TC18_Roles_admin_entra_al_panel | Passed | 14 | 2.8 s |
| TC19_Alertas_stock_bajo_3_de_5 | Passed | 30 | 3.5 s |
| TC20_Alertas_en_el_minimo_exacto_5_de_5 | Passed | 30 | 3.7 s |
| TC21_Alertas_sobre_el_minimo_6_de_5 | Passed | 28 | 3.4 s |
| TC22_Alertas_sin_stock_0_de_5 | Passed | 30 | 3.7 s |
| TC23_Alertas_umbral_propio_10_de_12 | Passed | 30 | 4 s |
| TC24_Alertas_reponer_cierra_la_alerta | Passed | 36 | 4.5 s |
| TC99_FALLA_CONTROLADA_login_clave_incorrecta | Failed (a propósito) | 23 | 5.6 s |

El caso `TC99_FALLA_CONTROLADA…` espera un texto equivocado **a propósito** y debe fallar: es la evidencia de que las aserciones comparan de verdad (actividad de la Clase 18).
Capturas de cada caso en `../katalon/evidencia/`.

## Comprobación de que las pruebas detectan fallos (mutación)

Se renombró a propósito el campo `minStock` del formulario (`id="stockMinimo"`): **Katalon falló** (TC19, paso 22) y **Serenity falló** ("waiting for locator('#minStock')"). Al restaurar el campo, ambas volvieron a pasar.

## Límites

- No es Katalon Recorder: es un intérprete propio de los mismos archivos `.html`. La extensión no se pudo ejecutar en este entorno.
- Base en memoria: no ejercita Postgres, sus restricciones ni su latencia.
- Una sola ejecución y un solo navegador: no mide estabilidad en el tiempo ni compatibilidad entre navegadores.
