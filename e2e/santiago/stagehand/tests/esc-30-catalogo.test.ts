/**
 * ESC-30 — Gestión del catálogo
 * El administrador crea, edita y elimina celulares desde /admin/phones.
 *
 * Objetivo: comprobar el ciclo completo con el formulario real (act con
 * variables), que un formulario vacío no se envía y que lo que queda guardado
 * es lo que se escribió (se verifica contra la API, no contra la pantalla).
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';
import { borrarCelular, buscarCelular, publicarCelular, tokenAdmin, unico } from '../src/api.js';
import { entorno } from '../src/entorno.js';
import { entrarComoAdmin, Sesion } from '../src/sesion.js';

describe('ESC-30 Gestión del catálogo', { timeout: 420_000 * entorno.margen }, () => {
  let s: Sesion;
  let token: string;
  const slugsCreados: string[] = [];

  before(async () => {
    token = await tokenAdmin();
    s = await Sesion.abrir('esc-30-catalogo');
    await entrarComoAdmin(s);
  });
  after(async () => {
    for (const slug of slugsCreados) await borrarCelular(token, slug);
    await s.cerrar();
  });

  /** Espera a que la API deje de conocer el celular (la tabla se actualiza antes que el servidor responda). */
  async function esperarBorrado(slug: string): Promise<number> {
    let estado = 200;
    for (let i = 0; i < 20 && estado !== 404; i++) {
      estado = (await buscarCelular(slug)).status;
      if (estado !== 404) await s.page.waitForTimeout(500);
    }
    return estado;
  }

  it('act: crear un celular llenando el formulario', async () => {
    // Arrange
    const sufijo = unico();
    const nombre = `Galaxy SH ${sufijo}`;
    const slug = `galaxy-sh-${sufijo}`;
    slugsCreados.push(slug);
    await s.ir('/admin/phones/new');
    await s.esperarTexto('Crear celular');

    // Act: una acción por campo; los valores van como variables
    await s.actuar('escribe %nombre% en el campo Nombre', { nombre });
    await s.actuar('escribe %slug% en el campo Slug (URL)', { slug });
    await s.actuar('escribe %marca% en el campo Marca', { marca: 'Samsung' });
    await s.actuar('elige la opción Samsung en la lista Categoría');
    await s.actuar('escribe %precio% en el campo Precio (COP)', { precio: 2_300_000 });
    await s.actuar('escribe %stock% en el campo Stock', { stock: 7 });
    await s.capturar('formulario-lleno');
    await s.actuar('pulsa el botón Crear celular');
    await s.esperarUrl((url) => url.endsWith('/admin/phones'));
    await s.capturar('lista-con-el-nuevo');

    // Assert: lo guardado es lo escrito
    const guardado = await buscarCelular(slug);
    assert.equal(guardado.status, 200, 'el celular no quedó en el catálogo');
    assert.equal(guardado.json.data.name, nombre);
    assert.equal(guardado.json.data.brand, 'Samsung');
    assert.equal(Number(guardado.json.data.price), 2_300_000);
    assert.equal(Number(guardado.json.data.stock), 7);
  });

  it('observe + extract: con el formulario vacío no se crea nada y se explican los errores', async () => {
    // Arrange
    await s.ir('/admin/phones/new');
    await s.esperarTexto('Crear celular');

    // Act: la IA lee los avisos (quedan en el registro); cuántos hay y qué dicen lo comprueba el navegador
    await s.actuar('pulsa el botón Crear celular');
    await s.esperarTexto('Requerido');
    await s.extraer(
      'los mensajes de error que aparecen junto a los campos obligatorios del formulario',
      z.object({ errores: z.array(z.string()) }),
    );
    const avisos = await s.contar('.cp-field-error');
    const textos = await s.textoDe('.cp-field-error');
    await s.capturar('formulario-vacio');

    // Assert
    assert.ok(avisos >= 3, `se esperaban varios avisos de campos obligatorios y hay ${avisos}`);
    assert.match(textos, /requerido|m[ií]nimo|positivo/i, 'los avisos no explican qué campo falta');
    assert.ok((await s.url()).endsWith('/admin/phones/new'), 'el formulario vacío se envió y la página cambió');
  });

  it('act: editar el precio de un celular y guardar', async () => {
    // Arrange
    const sufijo = unico();
    const slug = `editar-sh-${sufijo}`;
    slugsCreados.push(slug);
    const creado = await publicarCelular(token, {
      slug, name: `Editar SH ${sufijo}`, brand: 'Xiaomi', categoryId: 'xiaomi', price: 900_000, stock: 3,
    });
    assert.equal(creado.status, 201, 'no se pudo preparar el celular a editar');
    await s.ir(`/admin/phones/${creado.json.data.id}/edit`);
    await s.esperarTexto('Guardar cambios');

    // Act
    await s.actuar('escribe %precio% en el campo Precio (COP)', { precio: 850_000 });
    await s.capturar('precio-nuevo');
    await s.actuar('pulsa el botón Guardar cambios');
    await s.esperarUrl((url) => url.endsWith('/admin/phones'));

    // Assert
    const guardado = await buscarCelular(slug);
    assert.equal(Number(guardado.json.data.price), 850_000);
    assert.equal(guardado.json.data.name, `Editar SH ${sufijo}`, 'el nombre cambió sin que nadie lo tocara');
  });

  it('observe + act: eliminar un celular desde la tabla', async () => {
    // Arrange
    const sufijo = unico();
    const slug = `borrar-sh-${sufijo}`;
    const nombre = `Borrar SH ${sufijo}`;
    slugsCreados.push(slug);
    const creado = await publicarCelular(token, {
      slug, name: nombre, brand: 'Motorola', categoryId: 'motorola', price: 700_000, stock: 2,
    });
    assert.equal(creado.status, 201, 'no se pudo preparar el celular a eliminar');
    await s.ir('/admin/phones');
    await s.esperarTexto(nombre);

    // Act: el diálogo "¿Eliminar…?" del navegador se acepta solo (ver Sesion.abrir)
    const [botonEliminar] = await s.observar(`el botón Eliminar de la fila del celular «${nombre}»`);
    assert.ok(botonEliminar, `no se encontró el botón Eliminar de «${nombre}» en la primera página de la tabla`);
    await s.capturar('antes-de-eliminar');
    await s.actuar(botonEliminar);

    // Assert
    assert.equal(await esperarBorrado(slug), 404, 'el celular sigue existiendo después de eliminarlo');
    await s.capturar('despues-de-eliminar');
  });
});
