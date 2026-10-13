# Pruebas E2E de CelularPro — funcionalidades 13, 26, 27, 28, 29 y 30

Pruebas de extremo a extremo con el **patrón Screenplay**, hechas con
[`serenityjs/`](serenityjs/README.md) (Serenity/JS + Playwright + Cucumber, en
TypeScript), adaptadas del repositorio del curso
[serenityjs-e2e-testing](https://github.com/mauricioramirezv/serenityjs-e2e-testing).

Prueban los casos contra la aplicación real: el front, la
API y la base de datos encendidos, y un navegador que hace lo que haría una
persona. No hay dobles ni datos simulados.

## Qué se prueba

| ESC | Funcionalidad | Casos por la interfaz | Casos por la API |
|---|---|---|---|
| 13 | Recomendación de productos | Ver los parecidos al iPhone 15 Pro Max · abrir una recomendación lleva a su ficha · un celular parecido con stock aparece · uno sin stock no | Lista de recomendaciones · celular inexistente (404) · más de 12 (400) |
| 26 | Banear usuario | Ana banea a Carlos y Carlos ya no puede entrar · el motivo necesita 4 caracteres · Ana no puede banearse a sí misma | Banear (200) · un cliente no puede banear (403) |
| 27 | Desbanear usuario | Suspendido no entra · Ana lo reactiva y vuelve a entrar | Desbanear deja la cuenta limpia · usuario inexistente (404) |
| 28 | Consultar usuarios | El total en pantalla coincide con la API · buscar por correo · búsqueda sin resultados · un cliente no puede entrar | Paginación · sin sesión (401) |
| 29 | Panel de estadísticas | Los indicadores coinciden con la API · banear suma uno a "Baneados" · un cliente no puede ver el panel | Trae los 7 días de ingresos |
| 30 | Administración del catálogo | Publicar y verlo en la tienda · cambiar el precio · retirarlo · slug repetido | Publicar y borrar (201 / 204) · sin sesión (401) |

Son 32 escenarios: 20 por la interfaz y 12 por la API (con la habilidad
`CallAnApi` de Serenity/JS).

## 1. Levantar CelularPro

Las pruebas esperan la app en las direcciones del `docker-compose.yml` del
front. Con Docker Desktop abierto:

```bash
# Construir las imágenes (la primera vez y cada vez que cambie el código)
cd ~/Documents/Proyecto-de-aula
docker build -t celularpro-api:latest .

cd ~/Documents/Proyecto-de-aula-front
docker build -t celularpro-front:latest .

# Base de datos + API + front, con los datos del seed
docker compose -p celularpro up -d
```

Queda así:

- Front: <http://localhost:8081>
- API: <http://localhost:3001/api/v1>
- Administradora: `admin@celularpro.co` / `admin1234` (la crea el seed)

Para apagarla: `docker compose -p celularpro down`. La base no guarda nada
entre un `up` y otro, así que cada vez arranca limpia desde el seed.

Si la app corre de otra forma (por ejemplo `npm run dev` en los dos
proyectos), se cambian las direcciones con variables de entorno:

| Variable | Por defecto |
|---|---|
| `E2E_FRONT_URL` | `http://localhost:8081` |
| `E2E_API_URL` | `http://localhost:3001/api/v1` |
| `E2E_ADMIN_EMAIL` | `admin@celularpro.co` |
| `E2E_ADMIN_PASSWORD` | `admin1234` |

En ese caso, la API tiene que aceptar el origen del front por CORS
(`FRONTEND_URL` en el `.env` del back).

## 2. Correr las pruebas

```bash
cd e2e/santiago/serenityjs
npm install
npx playwright install chromium
npm test
```

El [README de `serenityjs/`](serenityjs/README.md) tiene el detalle: cómo
correr una sola funcionalidad, ver el navegador, abrir el reporte y los
comandos de Windows.

## Screenplay en un minuto

En vez de escribir "haz clic en el botón #x", cada prueba cuenta una
historia: **un actor** (Ana, la administradora; Carlos, un cliente; Valeria,
una visitante) **con habilidades** (usar un navegador, llamar a la API)
**realiza tareas** (iniciar sesión, banear a Carlos, publicar un celular) y
**hace preguntas** sobre lo que ve (¿qué estado tiene Carlos?, ¿qué celulares
le recomiendan?).

| Pieza | Dónde está |
|---|---|
| Actor y habilidades | `serenityjs/features/support/serenity.config.ts` |
| Tareas (Tasks) | `serenityjs/test/tasks/` |
| Preguntas (Questions) | `serenityjs/test/questions/` |
| Elementos de la pantalla | `serenityjs/test/ui/` (Lean Page Objects) |
| Casos | `serenityjs/features/*.feature` (Gherkin) |

Los selectores (`#email`, la fila de la tabla que tiene tal correo...) solo
aparecen en la carpeta `ui`. Si mañana cambia la pantalla, se arregla ahí y
las pruebas siguen igual.

## Datos de prueba

- **Cada prueba crea sus propios datos**, con correos y slugs únicos
  (`carlos.e2e.<sufijo>@gmail.com`, `nokia-e2e-<sufijo>`). Por eso se pueden
  correr una y otra vez sin reiniciar la base, y en cualquier orden.
- **Los preparativos se hacen por la API** (blended testing, el ejercicio 4
  del curso): si la prueba es "Ana banea a Carlos", la cuenta de Carlos se
  crea por la API y el baneo se hace por la interfaz, que es lo que se prueba.
- **Lo que se publica se borra al terminar**, pase o falle la prueba, para no
  ensuciar el catálogo ni cambiar lo que ven las otras pruebas.
- Las cuentas de clientes que se crean sí se quedan (la API no tiene cómo
  borrar usuarios). No molestan, y desaparecen con `docker compose down`.
- Las recomendaciones del ESC-13 se comparan con las del seed (por ejemplo,
  al iPhone 15 Pro Max le corresponden el iPhone 14, el iPhone 13 (Usado) y
  el Samsung Galaxy S24 Ultra). Si se cambia el seed, hay que actualizar esos
  nombres.

## Si algo falla

- **Ninguna prueba pasa y dice `ECONNREFUSED` o `ERR_CONNECTION_REFUSED`**: la
  app no está encendida, o está en otras direcciones (ver la tabla de
  variables).
- **Fallan solo las de la interfaz con un error de red o CORS**: el front
  está apuntando a otra API. La imagen del front graba `VITE_API_URL` al
  construirse; con el compose debe ser `http://localhost:3001/api/v1`.
- **Una prueba de la interfaz falla**: Serenity/JS deja el paso a paso con
  capturas en `serenityjs/reports/serenity-js/index.html`.
