# Regresión de Mario (front)

Pruebas traídas del proyecto de Mario y adaptadas a este front.

```bash
npm run test:regresion:mario   # 5 pruebas, no necesitan back ni navegador
```

## Qué verifica

| Archivo | Prueba | Regla que protege |
|---|---|---|
| `regresion.test.ts` | `envio_gratis_a_partir_de_500_001` | El envío es gratis si el subtotal supera 500.000 |
| `regresion.test.ts` | `envio_tiene_costo_en_el_umbral_exacto_de_500_000` | En 500.000 exactos el envío cuesta 20.000 y el total lo suma |
| `regresion.test.ts` | `multiples_items_suman_precio_por_cantidad...` | El subtotal es precio × cantidad por cada línea |
| `regresion.test.ts` | `constantes_de_envio_coinciden_con_las_del_backend` | 500.000 y 20.000, iguales a los del back |
| `regresion-401-login.test.tsx` | `401_del_login_no_recarga_la_pagina` | Una contraseña incorrecta no recarga la pantalla (se vería el aviso de error) |

## Qué se cambió en este front para que corran

Solo una cosa, y no cambia el comportamiento: la cuenta del envío estaba
escrita a mano en `Checkout.tsx` (`subtotal > 500000 ? 0 : 20000`). Se movió a
`src/utils/pricing.ts` (`calcularTotales`) y `Checkout.tsx` la llama. La fórmula
es la misma; ahora tiene dónde probarla. El resto de la suite (406 pruebas) sigue
en verde. `CartDrawer.tsx` conserva su propia cuenta (muestra envío gratis con
el carrito vacío) y no se tocó.

## Cómo se verificó que prueban lo correcto

Se rompió a propósito cada regla y se corrió la carpeta. **6 de 6 cambios
fueron detectados**:

| Cambio hecho | ¿Falló alguna prueba? |
|---|:-:|
| Envío gratis desde 500.001 → desde 500.000 | Sí |
| Costo de envío 20.000 → 25.000 | Sí |
| Umbral 500.000 → 400.000 | Sí |
| El total deja de sumar el envío | Sí |
| El subtotal ignora la cantidad | Sí |
| El 401 recarga la página aun sin sesión | Sí |

## Lo que está en `pendiente-codigo-de-mario/`

Tres archivos que **no pasan en este front**, por razones distintas:

1. `regresion-credenciales.test.tsx` — necesita `src/validation/credenciales.ts`
   (dominios de correo permitidos y política de contraseña), que solo existe en
   el front de Mario. Es una regla nueva de negocio.
2. `regresion-enlace-admin.test.tsx` — Mario manda el enlace "Admin" al panel
   (`/admin`) porque su panel muestra las alertas de stock. Aquí el enlace va a
   `/admin/phones` y la prueba `test/unit/interfaz/navegacion.test.tsx` lo exige.
   Es una decisión de diseño distinta, no un defecto.
3. `regresion-401-con-sesion-vieja.test.tsx` — un caso borde **real** de este
   front: si queda un token viejo guardado y el login responde 401 por
   contraseña incorrecta, `src/services/api.ts` borra la sesión y recarga
   `/login`, y el mensaje de error se pierde. Mario lo arregló dejando pasar el
   401 en `/auth/login` y `/auth/register`. Arreglarlo aquí son unas pocas
   líneas, pero cambia el comportamiento, por eso queda como decisión.
