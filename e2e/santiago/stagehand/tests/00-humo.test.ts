/**
 * Prueba de humo: ¿están bien el navegador, la clave del modelo y la app?
 * Si esta falla, no tiene sentido correr las demás.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';
import { entorno } from '../src/entorno.js';
import { Sesion } from '../src/sesion.js';

describe('Humo: Stagehand puede leer CelularPro', { timeout: 120_000 * entorno.margen }, () => {
  let s: Sesion;
  before(async () => {
    s = await Sesion.abrir('00-humo');
  });
  after(async () => {
    await s.cerrar();
  });

  it('extract: lee el nombre de la tienda en la página de inicio', async () => {
    // Arrange
    await s.ir('/');

    // Act
    const { tienda } = await s.extraer(
      'el nombre de la marca o tienda que aparece en la barra superior de la página',
      z.object({ tienda: z.string() }),
    );
    await s.capturar('inicio');

    // Assert
    assert.match(tienda, /celular\s*pro/i);
  });

  it('observe: encuentra el acceso al catálogo sin tocar nada', async () => {
    // Arrange
    await s.ir('/');

    // Act
    const acciones = await s.observar('el enlace que lleva al catálogo de celulares');

    // Assert
    assert.ok(acciones.length > 0, 'observe no encontró ningún enlace al catálogo');
  });
});
