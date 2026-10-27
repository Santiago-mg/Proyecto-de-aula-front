# Playwright Test Agents — CelularPro (funcionalidades de Santiago)

Solo se prueban estas funcionalidades: ESC-13 (recomendaciones en la ficha), ESC-26 (banear usuario),
ESC-27 (desbanear usuario), ESC-28 (consultar usuarios), ESC-29 (estadísticas del administrador)
y ESC-30 (gestión del catálogo: crear, editar y eliminar celulares).

## La aplicación

- Front: http://localhost:8081 — API: http://localhost:3001/api/v1
- Administradora: admin@celularpro.co / admin1234 (el seed `seed.spec.ts` ya inicia sesión por /login).
- ESC-13 es público: no necesita sesión.

## Reglas al planear y al generar

- Los escenarios y los textos van en español.
- Cada escenario es independiente: crea sus propios datos y no depende de otro.
- **Datos por la API, nunca fijos.** Usa `support/api.ts` (`crearUsuario`, `banear`, `publicarCelular`, `estadisticas`, `recomendaciones`…)
  o las fixtures de `support/fixtures.ts` (`admin`, `token`, `celulares.publicar`). No uses correos, slugs ni usuarios de corridas
  anteriores (por ejemplo «helena.pw…»): cada prueba crea el suyo con un sufijo único y borra lo que cree.
- **La API es el oráculo.** Lo que se ve en pantalla se compara con lo que responde la API.
- No borres ni cambies celulares o usuarios del seed (por ejemplo `iphone-15-pro-max`): solo los que la prueba crea.
- Genera un test por archivo, dentro de `tests/<escenario>/`, con nombre de archivo sin acentos ni espacios.
- Importa `test` y `expect` desde `../../support/fixtures` y usa la fixture `admin` para las pantallas de /admin.
- Selectores por rol y etiqueta (`getByRole`, `getByLabel`). Sin esperas fijas (`waitForTimeout`): usa aserciones que reintentan.
- Deja capturas con `evidencia(page, info, 'nombre')` de `support/pantalla.ts`.
- No modifiques ni borres archivos que ya existen; solo crea archivos nuevos.
