/**
 * ESC-13 — Recomendación de productos
 * La ficha de un celular muestra la sección "También te puede interesar".
 *
 * Objetivo: comprobar que lo que se ve en pantalla coincide con lo que
 * responde GET /phones/:slug/similares, que abrir una recomendación lleva a su
 * ficha y que un celular nuevo parecido aparece entre las recomendaciones.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';
import { borrarCelular, buscarCelular, publicarCelular, recomendaciones, tokenAdmin, unico } from '../src/api.js';
import { entorno } from '../src/entorno.js';
import { Sesion } from '../src/sesion.js';

const FICHA = '/phones/iphone-15-pro-max';
const SLUG = 'iphone-15-pro-max';

describe('ESC-13 Recomendación de productos', { timeout: 300_000 * entorno.margen }, () => {
  let s: Sesion;
  let token: string;
  const slugsCreados: string[] = [];

  before(async () => {
    token = await tokenAdmin();
    s = await Sesion.abrir('esc-13-recomendacion');
  });
  after(async () => {
    for (const slug of slugsCreados) await borrarCelular(token, slug);
    await s.cerrar();
  });

  it('observe + extract: las recomendaciones en pantalla salen de la API', async () => {
    // Arrange
    const deLaApi = await recomendaciones(SLUG);
    assert.ok(deLaApi.length > 0, 'la API no devolvió recomendaciones para el iPhone 15 Pro Max');
    await s.ir(FICHA);
    await s.esperarTexto('También te puede interesar');

    // Act
    const seccion = await s.observar('el título "También te puede interesar" de la sección de celulares recomendados');
    const { nombres } = await s.extraer(
      'los nombres de los celulares que aparecen dentro de la sección "También te puede interesar"',
      z.object({ nombres: z.array(z.string()) }),
    );
    await s.capturar('recomendaciones');

    // Assert
    assert.ok(seccion.length > 0, 'no se encontró la sección de recomendaciones');
    assert.ok(nombres.length > 0, 'la sección no muestra ningún celular');
    const enApi = deLaApi.map((n) => n.trim().toLowerCase());
    for (const nombre of nombres) {
      assert.ok(enApi.includes(nombre.trim().toLowerCase()), `«${nombre}» está en pantalla pero no lo recomienda la API`);
    }
  });

  it('act: abrir una recomendación lleva a la ficha de ese celular', async () => {
    // Arrange
    const [primero] = await recomendaciones(SLUG);
    await s.ir(FICHA);
    await s.esperarTexto('También te puede interesar');

    // Act: observe localiza el enlace y act lo ejecuta sin volver a preguntarle al modelo
    const [enlace] = await s.observar(`el enlace de la tarjeta del celular recomendado «${primero}» en la sección "También te puede interesar"`);
    assert.ok(enlace, `no se encontró la tarjeta de «${primero}»`);
    await s.actuar(enlace);
    await s.esperarUrl((url) => url.includes('/phones/') && !url.endsWith(SLUG));
    await s.esperarTexto(primero);
    const { nombre } = await s.extraer(
      'el nombre del celular en el título principal de la ficha',
      z.object({ nombre: z.string() }),
    );
    await s.capturar('ficha-recomendada');

    // Assert
    assert.equal(nombre.trim().toLowerCase(), primero.toLowerCase());
  });

  it('extract: un celular parecido y con stock aparece entre las recomendaciones', async () => {
    // Arrange: se publica por la API uno de la misma marca, categoría y precio
    const sufijo = unico();
    const nombre = `iPhone SH ${sufijo}`;
    const slug = `iphone-sh-${sufijo}`;
    slugsCreados.push(slug);
    // Mismo precio que el iPhone 15 Pro Max, misma marca y categoría: puntaje máximo y empate más cercano
    const precioBase = Number((await buscarCelular(SLUG)).json.data.price);
    const r = await publicarCelular(token, {
      slug, name: nombre, brand: 'Apple', categoryId: 'apple', price: precioBase, stock: 4,
    });
    assert.equal(r.status, 201, 'no se pudo publicar el celular de prueba');
    assert.ok((await recomendaciones(SLUG)).includes(nombre), 'la API no lo recomienda: el dato de prueba no sirve');
    await s.ir(FICHA);
    await s.esperarTexto(nombre);

    // Act
    const { nombres } = await s.extraer(
      'los nombres de todos los celulares de la sección "También te puede interesar"',
      z.object({ nombres: z.array(z.string()) }),
    );
    await s.capturar('recomendacion-nueva');

    // Assert
    assert.ok(nombres.map((n) => n.trim()).includes(nombre), `«${nombre}» no aparece en pantalla`);
  });
});
