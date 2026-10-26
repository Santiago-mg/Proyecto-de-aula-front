# Pruebas E2E de CelularPro — por autor

Cada persona del equipo tiene su carpeta, con sus propias dependencias y sus
propios comandos. Correr una carpeta **no** ejecuta las de otra.

Todas corren contra la aplicación real encendida (front, API y base de datos),
no contra dobles. Cómo levantarla: [`santiago/README.md`](santiago/README.md),
sección 1. Por defecto esperan el front en <http://localhost:8081> y la API en
<http://localhost:3001/api/v1>.

| Carpeta | Autor | Herramientas | Qué cubre | Resultado contra esta app |
|---|---|---|---|---|
| [`santiago/serenityjs/`](santiago/serenityjs/README.md) | Santiago | Serenity/JS + Playwright + Cucumber | Funcionalidades 13, 26–30 (web y API) | 32 de 32 |
| [`santiago/cypress/`](santiago/cypress/README.md) | Santiago | Cypress + TypeScript (estructura Screenplay) | Las mismas 13, 26–30 (web y API) | 32 de 32 |
| [`mario/`](mario/README.md) | Mario | Serenity/JS + Cucumber (Gherkin) y Katalon Recorder | Registro, inicio de sesión, credenciales, roles (+ perfil y alertas de stock, pendientes) | 13 de 13 activos; 13 pendientes; Katalon 3 de 3 activos |
| [`companero-test/`](companero-test/README.md) | Compañero sin identificar (archivo `test.zip`) | Serenity/JS con Playwright Test | Login, catálogo, banear, desbanear, cancelar pedido (+ favoritos, pendiente) | 6 de 6 activos; 1 pendiente |

## Comandos

```bash
# Santiago (Serenity/JS)
cd e2e/santiago/serenityjs && npm install && npx playwright install chromium && npm test

# Santiago (Cypress)
cd e2e/santiago/cypress && npm install && npm test

# Mario
cd e2e/mario && npm ci && npx playwright install chromium
npm test                   # los escenarios que sí aplican a este proyecto
npm run test:katalon       # sus casos de Katalon Recorder, ejecutados con Playwright
npm run test:pendiente     # los que esperan código que este proyecto no tiene (fallan a propósito)

# Compañero (test.zip)
cd e2e/companero-test && npm install && npx playwright install chromium
npm test
npm run test:pendiente
```

Con un Chromium ya instalado (por ejemplo, en una red restringida):
`CHROMIUM_PATH=/ruta/a/chrome npm test`.

## Qué significa "pendiente"

Los tres autores partieron del mismo proyecto de clase, pero cada uno le agregó
y le cambió cosas. Una prueba queda como **pendiente** cuando verifica algo que
esta aplicación no hace (por ejemplo, la página de perfil de Mario o la lista de
favoritos del otro compañero). Se separa en vez de borrarla o de cambiar el
código de producción para que pase: así la corrida normal no queda en rojo por
funciones que no existen, y la lista de pendientes dice qué faltaría construir.

## Cómo se comprobó que las pruebas ajenas verifican lo correcto

1. Se corrieron contra esta aplicación y se miró cada falla: ¿la app está mal o
   la prueba busca algo que aquí se llama distinto? Lo segundo se adaptó (ver el
   README de cada carpeta); lo primero quedó como pendiente.
2. **Mutación:** con la app encendida se rompió a propósito una regla del código
   (por ejemplo, que el login acepte cualquier contraseña) y se comprobó que la
   prueba correspondiente falla. Mario: 7 de 7 detectadas. Compañero: 6 de 6.
   Una prueba que sigue en verde cuando la regla está rota no protege nada.
3. Las que pasan se repitieron para descartar que dependan del orden o de datos
   que dejó la corrida anterior.
