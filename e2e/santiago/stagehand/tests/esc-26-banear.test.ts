/**
 * ESC-26 — Banear usuario
 * El administrador suspende una cuenta desde /admin/users, con un motivo.
 *
 * Objetivo: comprobar que el baneo se hace desde la pantalla, que el motivo
 * tiene que tener al menos 4 caracteres y que la persona baneada ya no puede
 * iniciar sesión.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';
import { crearUsuario, iniciarSesion } from '../src/api.js';
import { entorno } from '../src/entorno.js';
import { entrarComoAdmin, Sesion } from '../src/sesion.js';

describe('ESC-26 Banear usuario', { timeout: 300_000 * entorno.margen }, () => {
  let s: Sesion;

  before(async () => {
    s = await Sesion.abrir('esc-26-banear');
    await entrarComoAdmin(s);
  });
  after(async () => {
    await s.cerrar();
  });

  it('act + extract: Ana banea a Carlos con un motivo y Carlos ya no puede entrar', async () => {
    // Arrange
    const carlos = await crearUsuario('Carlos');
    await s.ir('/admin/users');
    await s.actuar('escribe %busqueda% en el buscador de usuarios', { busqueda: carlos.email });
    await s.esperarListaUsuarios(carlos.email);

    // Act
    const [botonBanear] = await s.observar(`el botón Banear de la fila del usuario ${carlos.email}`);
    assert.ok(botonBanear, 'no se encontró el botón Banear de la fila de Carlos');
    await s.actuar(botonBanear);
    await s.actuar('escribe %motivo% en el campo del motivo del baneo', { motivo: 'Spam en los comentarios' });
    await s.capturar('motivo-escrito');
    await s.actuar('pulsa el botón Confirmar baneo');
    await s.esperarFilaUsuario(carlos.email, /Baneado/);
    const fila = await s.extraer(
      `el estado (por ejemplo Activo o Baneado) y el motivo de baneo que se ven en la fila del usuario ${carlos.email}`,
      z.object({ estado: z.string(), motivo: z.string().optional() }),
    );
    await s.capturar('carlos-baneado');

    // Assert
    assert.match(fila.estado, /ban/i);
    assert.match(fila.motivo ?? '', /spam/i);
    const intento = await iniciarSesion(carlos.email, carlos.password);
    assert.ok(!intento.ok, 'Carlos pudo iniciar sesión estando baneado');
  });

  it('observe + extract: con un motivo de menos de 4 caracteres no se puede confirmar', async () => {
    // Arrange
    const bruno = await crearUsuario('Bruno');
    await s.ir('/admin/users');
    await s.actuar('escribe %busqueda% en el buscador de usuarios', { busqueda: bruno.email });
    await s.esperarListaUsuarios(bruno.email);
    const [botonBanear] = await s.observar(`el botón Banear de la fila del usuario ${bruno.email}`);
    assert.ok(botonBanear, 'no se encontró el botón Banear de la fila de Bruno');
    await s.actuar(botonBanear);

    // Act
    await s.actuar('escribe %motivo% en el campo del motivo del baneo', { motivo: 'abc' });
    // La IA lee el título del cuadro (queda en el registro); el aviso del mínimo y el estado del botón los lee el navegador
    await s.extraer(
      'el título del cuadro de diálogo que está abierto',
      z.object({ titulo: z.string() }),
    );
    const { ayuda, botonActivo } = await s.page.evaluate(() => {
      const dialogo = document.querySelector('[role="dialog"]');
      const boton = Array.from(dialogo?.querySelectorAll('button') ?? []).find((b) => /Confirmar baneo/i.test(b.textContent ?? ''));
      return {
        ayuda: dialogo?.querySelector('.cp-field-hint')?.textContent ?? '',
        botonActivo: boton ? !boton.disabled : null,
      };
    });
    await s.capturar('motivo-corto');

    // Assert
    assert.match(ayuda, /4/, 'la pantalla no explica el mínimo de 4 caracteres');
    assert.equal(botonActivo, false, 'el botón dejó confirmar un motivo de 3 caracteres');
    assert.ok((await iniciarSesion(bruno.email, bruno.password)).ok, 'Bruno quedó baneado sin confirmar');
  });
});
