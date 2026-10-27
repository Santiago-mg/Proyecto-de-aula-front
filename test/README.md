# Suite de pruebas — CelularPro Front

235 pruebas en 37 archivos. **No necesita el backend encendido**: la red se
sustituye por un doble, así que corre igual en tu máquina que en Jenkins.

```bash
npm test              # toda la suite
npm run test:watch    # en modo watch
npm run test:coverage # + reporte en coverage/ (incluye lcov.info para SonarQube)
npm run typecheck     # tipos de src/ y de test/
```

Todas las aserciones son fluidas con Chai, como en el ejemplo del profesor:
`expect` se importa de `chai` (`import { expect } from 'chai'`), así que solo
existe el estilo encadenado (`expect(x).to.equal(y)`, `.to.be.null`,
`.to.exist`, `.to.deep.include(...)`). Cada prueba sigue el patrón AAA, con sus
bloques `// Arrange`, `// Act` y `// Assert` separados.

## Cómo está montada

`test/setup.ts` se ejecuta antes que cualquier archivo de prueba y hace tres
cosas:

1. Reemplaza el adaptador de axios por el doble de `helpers/servidor.ts`.
2. Completa lo que le falta a jsdom (`helpers/navegador.ts`): `IntersectionObserver`
   para las animaciones y un `getContext` que devuelve `null`, como un navegador
   sin WebGL.
3. Deja todo en blanco antes de cada prueba: rutas del doble, `localStorage` y URL.

Lo único simulado es la red. Interceptores de `api.ts`, servicios, contextos,
rutas y páginas se ejecutan de verdad, igual que en el back solo se simula
Prisma. Cada prueba programa lo que "responde el backend" para forzar el camino
que le interesa, con la misma forma de respuesta que usa el back:

```ts
servidor.responder('PUT', '/admin/users/user-2/ban', ok(filaUsuario({ banned: true })))
servidor.responder('PUT', '/admin/users/user-2/ban', fallo(404, 'Usuario no encontrado'))
```

y después revisa qué le llegó (método, URL, parámetros, body y cabecera
`Authorization`) con `servidor.peticiones()`.

## Estructura

```
test/
├── setup.ts                    Doble de red, polyfills de jsdom y limpieza
├── helpers/
│   ├── servidor.ts             Doble de la red y respuestas con la forma del back
│   ├── fixtures.ts             Usuarios, celulares, pedidos, estadísticas y sesiones
│   ├── app.tsx                 Monta la app completa en una ruta y captura redirecciones
│   └── navegador.ts            Lo que jsdom no trae
├── escenarios/                 Los mismos casos de tests/escenarios del back, desde la interfaz
│   ├── esc-26-banear-usuario.test.tsx          7 caminos (V(G)=7)
│   ├── esc-27-desbanear-usuario.test.tsx       5 caminos (V(G)=5)
│   ├── esc-28-consultar-usuarios.test.tsx      6 caminos (V(G)=6) + la contraseña nunca se ve
│   ├── esc-29-panel-estadisticas.test.tsx      6 caminos (V(G)=6) + panel principal
│   ├── esc-30-administracion-catalogo.test.tsx 10 caminos (V(G)=10) + formulario
│   ├── autenticacion.test.tsx          registro / login / sesión
│   ├── pedidos.test.tsx                crear, consultar, cambiar estado y carrito
│   ├── catalogo-publico.test.tsx       listado, filtros, detalle, inicio y 404
│   ├── ramas-de-error.test.tsx         cambio de rol, 500 y edición con relaciones
│   └── ramas-restantes.test.tsx        listados que fallan, detalle del error, estados terminales
└── unit/                       Pruebas por componente, contexto, servicio y hook
    ├── catalogo/ control-roles/ errores/ estadisticas/ gestion-perfil/
    ├── gestion-usuarios/ interfaz/ login/ pedidos/ registro/ validacion-credenciales/
```

Cada escenario se nombra con el camino del grafo del back. Por ejemplo, el
Camino 2 de ESC-26 (`1-3-4-14`, token con firma inválida → 401) en el front
es: la petición sale con el token guardado, el backend responde 401, se borra
la sesión y se redirige a `/login`.

Quedan fuera ESC-13 (recomendaciones), ESC-31 (alertas de stock) y ESC-32
(favoritos): el front todavía no tiene esas pantallas.

## Fixtures

| Función | Para qué sirve |
|---|---|
| `usuario()` / `administrador()` | El usuario de la sesión, como lo devuelve `/auth/login` |
| `filaUsuario()` | Fila del listado `GET /admin/users` (con `banned`, `banReason` y `orderCount`) |
| `celular()` / `celularCompleto()` | Un celular del listado y el detalle con colores, fotos y características |
| `itemCarrito()` | Una línea del carrito guardado en `cp_cart` |
| `pedido()` | Un pedido con un artículo, como lo devuelve `/orders` |
| `estadisticas()` / `sieteDias()` | Respuesta de `GET /admin/stats` con sus 7 días de ingresos |
| `paginado()` | Envuelve una lista con su `meta` de paginación |
| `sesionIniciada()` / `sesionDeAdmin()` | Deja la sesión en `localStorage`, como tras un login |

## Cobertura

100% de líneas y 98% de ramas sobre `src/`. Quedan fuera del cálculo
`src/main.tsx` (arranque) y los archivos que solo declaran tipos.
