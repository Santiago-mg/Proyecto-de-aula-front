# DevOps de CelularPro

Jenkins prueba y analiza el backend y el front. Solo si todo pasa, despliega la
app con Docker y la publica en Vercel.

## Cómo funciona

```
push a main (back o front)
      │   el orquestador revisa GitHub cada 5 minutos
      ▼
celularpro-orquestador          (Jenkinsfile.orquestador, repo del front)
  0. Código     baja los dos repositorios
  1. Backend    → job celularpro-backend: typecheck, suite completa, SonarQube + Quality Gate, imagen celularpro-api
  2. Frontend   → job celularpro-front:   typecheck, suite completa, SonarQube + Quality Gate, imagen celularpro-front
  3. Docker     base de datos → migraciones + seed → API → front, y prueba de humo
  4. Vercel     publica la API y el front
```

Si una etapa falla, las siguientes no corren. A Docker y a Vercel solo llega
lo que pasó sus pruebas y su Quality Gate.

## Archivos

| Repo | Archivo | Qué hace |
|------|---------|----------|
| back | `Jenkinsfile` | Pipeline del backend |
| back | `Dockerfile` | Imagen de la API: compila TypeScript y trae la CLI de Prisma para las migraciones |
| back y front | `Dockerfile.jenkins` | Agente de Jenkins: Node 22 + cliente de Docker |
| back y front | `sonar-project.properties` | Proyectos `CelularPro-Backend` y `CelularPro-Frontend` en SonarQube |
| front | `Jenkinsfile` | Pipeline del front |
| front | `Jenkinsfile.orquestador` | El trigger que encadena todo |
| front | `Dockerfile` + `nginx.conf` | Imagen del front: compila con Vite y sirve con nginx |
| front | `docker-compose.yml` | La app completa: db, migraciones, api y front |
| front | `.vercelignore` | Lo que no se sube a Vercel |

## Qué cambió respecto al pipeline de Andrés

| Andrés | Aquí | Por qué |
|--------|------|---------|
| Agente Ubuntu + PostgreSQL + sonar-scanner (zip) | `Dockerfile.jenkins`: Node 22 + cliente de Docker | Las pruebas usan un doble de Prisma y no necesitan base de datos. El scanner va por npm, que baja el Java de la máquina (el zip trae uno solo para x64) |
| Verify environment | Entorno | |
| Install dependencies (+ crear BD, migrate dev, seed) | Instalar dependencias | |
| — | Typecheck | Revisa los tipos de `src/` y de las pruebas |
| Testing and coverage | Pruebas y cobertura | Además publica cada prueba en *Test Result* |
| SonarQube Analysis + Quality Gate (webhook) | SonarQube | Con `sonar.qualitygate.wait=true` el scanner espera el Quality Gate: no hace falta webhook |
| Build Docker Image (`Dockerfile.app`) | Build + Imagen Docker (`Dockerfile`) | La misma idea de imagen en dos etapas |
| Deploy Database + Apply Migrations | Orquestador, etapa 3 (`docker-compose.yml`) | Base, migraciones, seed, API y front con un solo comando |
| — | Orquestador, etapa 4 | Publicación en Vercel |

## Antes de empezar

- Docker Desktop abierto.
- SonarQube arriba en http://localhost:9000.
- Jenkins con acceso a Docker: en esa máquina, `docker ps` tiene que funcionar
  para el usuario que corre Jenkins.
  - En Mac, si no tienen Jenkins: `brew install jenkins-lts` y
    `brew services start jenkins-lts` → http://localhost:8080. Si el primer
    build dice `docker: command not found`, ve a Manage Jenkins → System →
    Global properties → Environment variables y agrega `PATH+EXTRA` con el
    valor `/usr/local/bin:/opt/homebrew/bin`.
  - Si Jenkins corre en un contenedor, ese contenedor necesita el cliente
    `docker` y el socket montado (`-v /var/run/docker.sock:/var/run/docker.sock`).
- El código subido a GitHub en la rama `main`. Jenkins baja el código de
  GitHub, no de tu carpeta.

## Paso 1. Plugins

Manage Jenkins → Plugins → Available plugins. Instala **Docker Pipeline**,
**SonarQube Scanner**, **Timestamper** y **JUnit**, y reinicia Jenkins.
Pipeline, Git y Credentials Binding ya vienen con la instalación sugerida.

## Paso 2. Conectar SonarQube

1. En SonarQube: My Account → Security → Generate Tokens. Elige el tipo
   **Global Analysis Token**, que sirve para los dos proyectos, y copia el token.
2. En Jenkins: Manage Jenkins → Credentials → System → Global credentials →
   Add Credentials. Kind: *Secret text*, Secret: el token, ID: `sonar-token`.
3. Manage Jenkins → System → SonarQube servers → Add SonarQube:
   - Name: `SonarQube`. Tiene que ser exacto, porque así lo llaman los Jenkinsfile.
   - Server URL: `http://host.docker.internal:9000`
   - Server authentication token: `sonar-token`

¿Por qué no `localhost`? El análisis corre dentro de un contenedor, y ahí
`localhost` es el propio contenedor. `host.docker.internal` es tu Mac.

No hace falta configurar webhook.

## Paso 3. Vercel

Solo lo usa la etapa 4.

1. Crea un token en vercel.com/account/tokens.
2. Saca los IDs. Corre esto una vez en la carpeta del backend y otra en la del front:
   ```bash
   npx vercel link            # elige el proyecto que ya tienen en Vercel
   cat .vercel/project.json   # aquí están orgId y projectId
   ```
3. En Jenkins, crea cuatro credenciales de tipo *Secret text*:

   | ID | Valor |
   |----|-------|
   | `vercel-token` | El token |
   | `vercel-org-id` | El `orgId` (es el mismo en los dos proyectos) |
   | `vercel-project-backend` | El `projectId` del backend |
   | `vercel-project-front` | El `projectId` del front |

4. Configura las variables de cada proyecto en Vercel (Settings → Environment
   Variables → Production):
   - **API:** `DATABASE_URL` (un PostgreSQL en la nube, porque Vercel no llega a
     la base local), `JWT_SECRET`, `JWT_EXPIRES_IN=7d` y
     `FRONTEND_URL=https://<tu-front>.vercel.app`.
   - **Front:** `VITE_API_URL=https://<tu-api>.vercel.app/api/v1`.
5. Cuando el schema tenga migraciones nuevas, aplícalas a la base de la nube.
   Desde la carpeta del backend:
   `DATABASE_URL="<la de Vercel>" npx prisma migrate deploy`.
6. Recomendado: en cada proyecto de Vercel ve a Settings → Git → Disconnect.
   Así solo publica Jenkins, después de las pruebas. Si no, Vercel también
   publica por su cuenta en cada push.

## Paso 4. Crear los tres jobs

Para cada uno: New Item → nombre → *Pipeline* → OK. En la sección Pipeline:

- Definition: *Pipeline script from SCM*
- SCM: *Git*, con la Repository URL de la tabla
- Branch Specifier: `*/main`
- Script Path: el de la tabla

| Nombre del job (exacto) | Repository URL | Script Path |
|-------------------------|----------------|-------------|
| `celularpro-backend` | https://github.com/Santiago-mg/Proyecto-de-aula.git | `Jenkinsfile` |
| `celularpro-front` | https://github.com/Santiago-mg/Proyecto-de-aula-front.git | `Jenkinsfile` |
| `celularpro-orquestador` | https://github.com/Santiago-mg/Proyecto-de-aula-front.git | `Jenkinsfile.orquestador` |

No marques triggers en la configuración de ningún job. El del orquestador ya
está en su Jenkinsfile, y a los otros dos los dispara el orquestador.

## Paso 5. Primera corrida

Abre `celularpro-orquestador` y dale **Build Now**. En esa primera corrida
Jenkins aprende los parámetros y el trigger. Desde ahí el botón pasa a ser
*Build with Parameters*, y el orquestador revisa GitHub cada 5 minutos por su cuenta.

Cuando termine en verde:

| Qué | Dónde |
|-----|-------|
| Front (Docker) | http://localhost:8081 |
| API (Docker) | http://localhost:3001/api/v1 |
| Usuario admin | `admin@celularpro.co` / `admin1234` |
| Análisis | http://localhost:9000 → `CelularPro-Backend` y `CelularPro-Frontend` |
| Cada prueba | En el build de cada job → *Test Result* |

La base de Docker se crea de cero con el seed en cada despliegue. No publica
puerto, así que no choca con tu PostgreSQL local.

Para correr la cadena sin Vercel: *Build with Parameters* y desmarca
`DESPLEGAR_VERCEL`.

## Demostrar la regresión

Después de cada cambio corre la suite completa del back y del front. Para
mostrarlo en vivo:

1. Rompe una regla de negocio. Por ejemplo, la de ESC-26: un admin no puede
   banearse a sí mismo. En el backend, en
   `src/application/use-cases/admin.use-cases.ts`, comenta esta línea:
   ```ts
   assertNotSelf(userId, requesterId, 'No puedes banear tu propia cuenta')
   ```
2. Sube el cambio: `git commit -am "prueba de regresion" && git push`.
3. En unos 5 minutos el orquestador arranca solo (o dale **Build Now** para no
   esperar), y la etapa **1. Backend** queda en rojo. En *Test Result* del job del backend aparecen las 2 pruebas
   que atraparon el error:
   - `esc-26-banear-usuario.test.ts`: *Camino 5 (1-3-5-7-9-10-14): un admin no
     puede banearse a sí mismo (RN-05) → 400*
   - `ban.controller.test.ts`: *le pasa al caso de uso el id del admin que hace
     la petición, y ese admin no puede banearse a sí mismo*

   Las etapas 2, 3 y 4 no corren, así que en Docker y en Vercel sigue la
   versión buena.
4. Deshaz el cambio con `git revert --no-edit HEAD && git push`. La cadena
   vuelve a verde y despliega.

## Si algo falla

| Síntoma | Qué hacer |
|---------|-----------|
| `docker: command not found` o `permission denied ... docker.sock` | Jenkins no tiene acceso a Docker. Revisa "Antes de empezar" |
| SonarQube no responde (`Connection refused`) | La URL del servidor en Jenkins tiene que ser `http://host.docker.internal:9000`, no `localhost` |
| `QUALITY GATE STATUS: FAILED` | Abre el proyecto en SonarQube y revisa qué condición no se cumplió |
| `No item named celularpro-backend found` | Los nombres de los jobs tienen que ser exactos |
| Etapa 3: `port is already allocated` | Algo ya usa el puerto 3001 o el 8081 (por ejemplo, `npm run dev` del backend). Detenlo |
| Etapa 4: `Could not find credentials entry with ID 'vercel-token'` | Faltan las credenciales del Paso 3. También puedes correr sin Vercel |

## Lo mismo, a mano

Sin Jenkins, para probar rápido:

```bash
# En el backend
npm ci && npm run typecheck && npm run test:coverage
docker build -t celularpro-api:latest .

# En el front
npm ci && npm run typecheck && npm run test:coverage
docker build -t celularpro-front:latest .
docker compose -p celularpro up -d      # front :8081 · API :3001
docker compose -p celularpro down -v    # apagar y borrar la base
```
