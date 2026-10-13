# Pruebas de regresión del front — por autor

Cada persona del equipo tiene su propia carpeta. Los comandos de una carpeta
corren **solo** las pruebas de esa carpeta.

| Carpeta | Autor | Qué cubre | Pruebas | Comando |
|---|---|---|---:|---|
| [`santiago/`](santiago/README.md) | Santiago | Funcionalidades 13, 26–30 en cuatro categorías: funcional, API, rendimiento y seguridad | 164 | `npm run test:regresion:santiago` |
| [`mario/`](mario/README.md) | Mario | Resumen de precios del checkout (envío) y el 401 del login | 5 | `npm run test:regresion:mario` |
| `mario/pendiente-codigo-de-mario/` | Mario | Reglas que dependen de código que este front no tiene | 5 | `npm run test:regresion:mario:pendiente` (falla a propósito) |

`npm run test:regresion` corre Santiago y después Mario. `npm test` corre toda
la suite del front (406 pruebas) y **no** incluye la carpeta pendiente.

## Cómo comprobar que cada autor corre solo lo suyo

```bash
npm run test:regresion:santiago   # debe terminar con "Total: 164 passed"
npm run test:regresion:mario      # debe decir "Tests 5 passed (5)"
```

## Reglas para agregar pruebas de otra persona

1. Una carpeta por autor: `test/regresion/<nombre>/`.
2. Los imports de `src/` se ajustan a la profundidad de la carpeta
   (`../../../src/...`). Los dobles compartidos están en `test/helpers/`.
3. Si la prueba espera código o un comportamiento que este front no tiene, no
   se cambia producción a escondidas: va a una subcarpeta `pendiente-*`, se
   excluye de `vitest.config.ts` y el README del autor explica qué falta.
4. Antes de dar una prueba por buena se rompe a propósito la regla que dice
   cuidar (mutación) y se comprueba que falla. Una prueba que nunca falla no
   protege nada.
