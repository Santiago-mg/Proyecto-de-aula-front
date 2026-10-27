/**
 * ESC-27 — Desbanear usuario
 * El administrador levanta la suspensión de una cuenta desde /admin/users.
 *
 * Objetivo: comprobar que el botón Desbanear devuelve la cuenta a "Activo" y
 * que la persona puede volver a iniciar sesión.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';
import { banear, crearUsuario, iniciarSesion, tokenAdmin } from '../src/api.js';
import { entorno } from '../src/entorno.js';
import { entrarComoAdmin, Sesion } from '../src/sesion.js';

describe('ESC-27 Desbanear usuario', { timeout: 300_000 * entorno.margen }, () => {
  let s: Sesion;
  let token: string;

  before(async () => {
    token = await tokenAdmin();
    s = await Sesion.abrir('esc-27-desbanear');
    await entrarComoAdmin(s);
  });
  after(async () => {
    await s.cerrar();
  });

  it('act + extract: Ana desbanea a Diana y Diana vuelve a entrar', async () => {
    // Arrange: Diana se crea y se banea por la API; la prueba empieza con la cuenta suspendida
    const diana = await crearUsuario('Diana');
    assert.equal((await banear(token, diana.id, 'Reclamos falsos repetidos')).status, 200);
    assert.ok(!(await iniciarSesion(diana.email, diana.password)).ok, 'Diana no quedó baneada: el dato de prueba no sirve');
    await s.ir('/admin/users');
    await s.actuar('escribe %busqueda% en el buscador de usuarios', { busqueda: diana.email });
    await s.esperarListaUsuarios(diana.email);

    // Act
    const [botonDesbanear] = await s.observar(`el botón Desbanear de la fila del usuario ${diana.email}`);
    assert.ok(botonDesbanear, 'no se encontró el botón Desbanear de la fila de Diana');
    await s.capturar('diana-baneada');
    await s.actuar(botonDesbanear);
    await s.esperarFilaUsuario(diana.email, /Activo/);
    const fila = await s.extraer(
      `el estado (por ejemplo Activo o Baneado) que se ve en la fila del usuario ${diana.email}`,
      z.object({ estado: z.string() }),
    );
    await s.capturar('diana-activa');

    // Assert
    assert.match(fila.estado, /activo/i);
    assert.ok((await iniciarSesion(diana.email, diana.password)).ok, 'Diana sigue sin poder entrar');
  });

  it('observe: una cuenta activa ofrece Banear y no Desbanear', async () => {
    // Arrange
    const elias = await crearUsuario('Elias');
    await s.ir('/admin/users');
    await s.actuar('escribe %busqueda% en el buscador de usuarios', { busqueda: elias.email });
    await s.esperarListaUsuarios(elias.email);

    // Act: la IA localiza el botón Banear; qué botones tiene la fila lo lee el navegador
    const conBanear = await s.observar(`el botón Banear de la fila del usuario ${elias.email}`);
    const botones = await s.botonesDeFila(elias.email);
    await s.capturar('elias-activo');

    // Assert
    assert.ok(conBanear.length > 0, 'la IA no encontró el botón Banear de una cuenta activa');
    assert.ok(botones.some((b) => /^Banear$/i.test(b)), `una cuenta activa no ofrece Banear (botones: ${botones.join(', ')})`);
    assert.ok(!botones.some((b) => /Desbanear/i.test(b)), 'una cuenta activa ofrece Desbanear');
  });
});
