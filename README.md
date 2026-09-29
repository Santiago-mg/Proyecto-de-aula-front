# CelularPro — Frontend

Tienda de celulares certificados. Compra equipos nuevos, reacondicionados y usados verificados con garantía real.

## Stack

- React 18 + **TypeScript**
- Vite
- React Router v6
- Axios (cliente HTTP centralizado)
- React Hook Form + Zod (validación)
- Lucide React (iconos)
- Vitest + Testing Library + jsdom (pruebas)

## Estructura

```
src/
  services/    → Llamadas a la API (cliente HTTP centralizado)
  hooks/       → Lógica reutilizable
  context/     → AuthContext, CartContext, ToastContext
  components/  → UI pura sin lógica de negocio
  pages/       → Composición de vistas
  types/       → Interfaces TypeScript
  routes/      → AppRouter con rutas protegidas

test/
  setup.ts     → Doble de red, polyfills de jsdom y limpieza entre pruebas
  helpers/     → Doble de red, fixtures y montaje de la app
  escenarios/  → Los casos de los escenarios del back, desde la interfaz
  unit/        → Pruebas por componente, contexto, servicio y hook
```

## Configuración

> **Requiere Node 22 o superior** (lo exige jsdom, que usan las pruebas).
> Con `nvm`: `nvm use` toma la versión de `.nvmrc`.

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL del backend (ej: `https://tu-api.onrender.com/api/v1`) |

### 3. Iniciar

```bash
npm run dev
```

### 4. Build para producción

```bash
npm run build
```

## Pruebas y cobertura

```bash
npm test                # corre la suite una vez
npm run test:watch      # modo watch
npm run test:coverage   # suite + reporte de cobertura en coverage/
npm run typecheck       # tipos de src/ y tambien de test/
```

La suite tiene 235 pruebas en 37 archivos: `test/escenarios/` repite los casos
de los escenarios del back (ESC-26 a ESC-30, autenticación, pedidos, catálogo y
ramas de error) desde la interfaz, y `test/unit/` prueba cada pieza por separado.
Corren sobre jsdom, sin backend: solo se sustituye la red. Las aserciones son
fluidas (Chai) y cada prueba sigue el patrón AAA. El detalle está en
[`test/README.md`](test/README.md).

`npm run test:coverage` deja en `coverage/`:

| Archivo | Para qué |
|---------|----------|
| `index.html` | Reporte navegable, archivo por archivo y línea por línea |
| `lcov.info` | El que lee SonarQube |
| `cobertura-coverage.xml` | Formato Cobertura, para el plugin Coverage de Jenkins |

La cobertura se mide sobre **todo** `src/`, incluidos los archivos que ninguna
prueba toca, así que el porcentaje global es el real. Solo se excluyen
`src/main.tsx` (arranque) y los archivos que únicamente declaran tipos.

Con `CI=true` (como en Jenkins) se genera además `reports/junit.xml`, que es lo
que Jenkins lee para mostrar cada prueba en la pestaña *Test Result*.

### SonarQube

```bash
SONAR_TOKEN=tu_token npm run sonar
```

Corre las pruebas con cobertura y envía el análisis al proyecto
`CelularPro-Frontend` (configurado en `sonar-project.properties`).

## Rutas

| Ruta | Descripción | Requiere |
|------|-------------|----------|
| `/` | Home | Público |
| `/catalog` | Catálogo con filtros | Público |
| `/phones/:slug` | Detalle de celular | Público |
| `/login` | Iniciar sesión | Público |
| `/register` | Crear cuenta | Público |
| `/dashboard` | Mis órdenes | Usuario |
| `/checkout` | Finalizar compra | Usuario |
| `/admin/phones` | Panel de celulares | Admin |
| `/admin/phones/new` | Crear celular | Admin |
| `/admin/phones/:id/edit` | Editar celular | Admin |

## Docker

Imagen multi-etapa: compila con Node 22 y sirve el resultado con nginx. La
imagen final pesa ~50 MB porque solo lleva `dist/`, sin `node_modules` ni
código fuente.

```bash
docker build --build-arg VITE_API_URL=http://localhost:3001/api/v1 -t celularpro-front .
docker run --rm -p 8081:80 celularpro-front   # -> http://localhost:8081
```

> **Importante:** Vite no lee variables de entorno en tiempo de ejecución, las
> sustituye dentro del bundle al compilar. Por eso `VITE_API_URL` va como
> `--build-arg` y no como `-e`: cambiar la URL del backend obliga a reconstruir
> la imagen, no basta con reiniciar el contenedor.

El `nginx.conf` incluye el fallback de SPA (`try_files ... /index.html`), sin el
cual entrar directo a `/catalog` o recargar en `/admin/phones` devolvería 404.

`docker-compose.yml` levanta la app completa (base de datos, migraciones + seed,
API y front) con las imágenes `celularpro-api` y `celularpro-front`:

```bash
docker compose -p celularpro up -d     # front :8081 · API :3001/api/v1
docker compose -p celularpro down -v   # apagar y borrar la base
```

## Integración continua (Jenkins + SonarQube + Docker + Vercel)

| Job en Jenkins | Archivo | Qué hace |
|----------------|---------|----------|
| `celularpro-backend` | `Jenkinsfile` del backend | Typecheck, pruebas, SonarQube e imagen de la API |
| `celularpro-front` | `Jenkinsfile` | Typecheck, pruebas, SonarQube e imagen del front |
| `celularpro-orquestador` | `Jenkinsfile.orquestador` | Corre el back; si pasa, el front; si pasa, despliega con Docker y en Vercel |

El orquestador revisa los dos repositorios cada 5 minutos y arranca solo con
cada cambio, así que la suite de regresión corre completa después de cada push.

La configuración paso a paso, y cómo demostrar la regresión en vivo, están en
[`DEVOPS.md`](DEVOPS.md).

## Deploy

Lo hace el orquestador (etapa 4) con la CLI de Vercel, y solo si el back y el
front pasaron sus pruebas y su Quality Gate. `VITE_API_URL` se configura en el
proyecto de Vercel.
