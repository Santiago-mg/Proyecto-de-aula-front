/**
 * ESC-28 — Consultar usuarios
 * La lista de /admin/users se puede buscar por nombre o correo.
 *
 * Objetivo: comprobar que la búsqueda muestra a las personas correctas (las
 * mismas que devuelve la API), que se puede acotar con el correo completo y que
 * una búsqueda sin coincidencias lo dice en vez de dejar la tabla vacía.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';
import { crearUsuario, listarUsuarios, tokenAdmin, unico } from '../src/api.js';
import { entorno } from '../src/entorno.js';
import { entrarComoAdmin, Sesion } from '../src/sesion.js';

describe('ESC-28 Consultar usuarios', { timeout: 300_000 * entorno.margen }, () => {
  let s: Sesion;
  let token: string;

  before(async () => {
    token = await tokenAdmin();
    s = await Sesion.abrir('esc-28-consultar-usuarios');
    await entrarComoAdmin(s);
  });
  after(async () => {
    await s.cerrar();
  });

  it('extract: buscar por un texto compartido muestra a todos y solo a esos usuarios', async () => {
    // Arrange: dos usuarios con el mismo apellido de prueba, para poder buscarlos juntos
    const marca = `consulta${unico()}`;
    const a = await crearUsuario(marca);
    const b = await crearUsuario(marca);
    const esperados = (await listarUsuarios(token, marca)).correos.sort();
    assert.deepEqual(esperados, [a.email, b.email].sort(), 'la API no encuentra a los dos usuarios: el dato de prueba no sirve');
    await s.ir('/admin/users');

    // Act
    await s.actuar('escribe %busqueda% en el buscador de usuarios', { busqueda: marca });
    await s.esperarListaUsuarios(marca);
    const { correos } = await s.extraer(
      'los correos electrónicos de todas las filas de la tabla de usuarios',
      z.object({ correos: z.array(z.string()) }),
    );
    await s.capturar('busqueda-compartida');

    // Assert
    assert.deepEqual(correos.map((c) => c.trim().toLowerCase()).sort(), esperados.map((c) => c.toLowerCase()));
  });

  it('act + extract: buscar con el correo completo deja una sola fila', async () => {
    // Arrange
    const fabio = await crearUsuario('Fabio');
    await s.ir('/admin/users');

    // Act
    await s.actuar('escribe %busqueda% en el buscador de usuarios', { busqueda: fabio.email });
    await s.esperarListaUsuarios(fabio.email);
    const { correos } = await s.extraer(
      'los correos electrónicos de todas las filas de la tabla de usuarios',
      z.object({ correos: z.array(z.string()) }),
    );
    await s.capturar('busqueda-exacta');

    // Assert
    assert.equal(correos.length, 1, `se esperaba 1 fila y hay ${correos.length}`);
    assert.equal(correos[0].trim().toLowerCase(), fabio.email.toLowerCase());
  });

  it('extract: una búsqueda sin coincidencias avisa que no hay resultados', async () => {
    // Arrange
    const inexistente = `nadie-${unico()}@example.invalid`;
    await s.ir('/admin/users');

    // Act
    await s.actuar('escribe %busqueda% en el buscador de usuarios', { busqueda: inexistente });
    await s.esperarListaUsuarios(inexistente);
    // La IA copia el aviso (queda en el registro); que el aviso exista y no queden filas lo comprueba el navegador
    await s.extraer(
      'el título del aviso que aparece en lugar de la tabla de usuarios',
      z.object({ aviso: z.string() }),
    );
    const aviso = await s.textoDe('body');
    const filas = await s.contar('tbody tr');
    await s.capturar('sin-resultados');

    // Assert
    assert.match(aviso, /ning[uú]n usuario coincide/i, 'no hay ningún aviso de que la búsqueda no encontró nada');
    assert.equal(filas, 0, 'la tabla sigue mostrando filas');
    assert.equal((await listarUsuarios(token, inexistente)).total, 0);
  });
});
