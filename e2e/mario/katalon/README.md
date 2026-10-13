# Suite de Katalon Recorder — CelularPro

Un caso por funcionalidad. Se abren en Katalon Recorder con **Open Test
Suite** → `Suite_CelularPro_6_funcionalidades.html`.

| Caso | Funcionalidad | Qué comprueba |
|---|---|---|
| TC01_Registro_usuario | Registro de usuario | Crea una cuenta con correo único y llega a `/dashboard` |
| TC02_Inicio_sesion | Inicio de sesión | Sale, vuelve a ingresar y, tras salir, `/dashboard` lo devuelve a `/login` |
| TC03_Validacion_credenciales | Validación de credenciales | Contraseña incorrecta, contraseña sin mayúscula y dominio no permitido |
| TC04_Gestion_perfil | Gestión de perfil | Cambia el nombre y la contraseña; la anterior deja de servir |
| TC05_Control_roles | Control de roles | Visitante y cliente no entran a `/admin`; el admin promueve al cliente y entonces sí |
| TC06_Alerta_stock_bajo | Alerta de stock bajo | Desde el formulario deja el stock en 2 y en 0, comprueba la alerta y la cierra reponiendo |

> **En este proyecto.** Estos casos vinieron del proyecto de Mario. Contra esta
> aplicación (front en `:8081`, API en `:3001`): **TC01, TC02 y TC05 pasan**;
> TC03 (reglas de contraseña), TC04 (perfil) y TC06 (alertas de stock) esperan
> funciones que aquí no existen y fallan a propósito. Se cambiaron tres
> localizadores que solo existían en el front de Mario (el aviso de error, el
> buscador de usuarios y la espera del panel en TC05); ver `../README.md`.
>
> ```bash
> cd e2e/mario
> npm run test:katalon             # TC01, TC02 y TC05
> npm run test:katalon:pendiente   # TC03, TC04 y TC06 (fallan a propósito)
> ```
>
> Los casos están grabados contra `http://localhost:5173`; `validar-suite.ts` lo
> reemplaza por la dirección del front que se esté usando. Para abrirlos en
> Katalon Recorder hay que cambiar esa dirección por `http://localhost:8081`.

## Antes de ejecutar

Los casos están grabados contra `http://localhost:5173` (Vite) con el backend
real y la base sembrada:

```powershell
cd Proyecto-de-aula-mario; npm run db:seed; npm run dev
cd Proyecto-de-aula-mario\frontend; npm run dev
```

- Cada caso empieza limpiando la sesión (`runScript localStorage.clear()`), así
  que se pueden ejecutar solos o en la suite, en cualquier orden.
- Las cuentas nuevas usan un correo único generado con `storeEval`
  (`katalon.<número>@gmail.com`), por lo que la suite se puede repetir.
- TC06 modifica el `iPhone 13 (Usado)` del seed y lo deja con 15 unidades.
- Si su versión de Recorder no reconoce `storeEval`, cámbielo por
  `executeScript` con `return "katalon." + Date.now() + "@gmail.com"`.

## Validar la suite sin abrir Recorder

`validar-suite.ts` ejecuta los mismos HTML con Playwright. Sirve para el
pipeline y para comprobar que la suite sigue vigente cuando cambia el frontend:

```bash
cd e2e/mario
npm run test:katalon                      # contra la app real (por defecto)
E2E_SIMULADO=true npm run test:katalon    # contra la API simulada de Mario
```

Los selectores son los mismos que usan las pruebas de Serenity/JS
(`id`, `role`, `data-testid`), no clases de estilo. Aquí no hay `data-testid`:
los dos que se cambiaron usan `role="alert"` y el placeholder del buscador.
