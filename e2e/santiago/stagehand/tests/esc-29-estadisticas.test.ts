/**
 * ESC-29 — Estadísticas del administrador
 * /admin/stats resume usuarios, inventario, órdenes y revenue.
 *
 * Objetivo: comprobar que las cifras que se ven en pantalla son las mismas que
 * entrega GET /admin/stats y que, al banear a alguien, el contador de baneados
 * sube en uno.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';
import { banear, crearUsuario, estadisticas, tokenAdmin } from '../src/api.js';
import { entorno } from '../src/entorno.js';
import { entrarComoAdmin, Sesion } from '../src/sesion.js';

describe('ESC-29 Estadísticas del administrador', { timeout: 300_000 * entorno.margen }, () => {
  let s: Sesion;
  let token: string;

  before(async () => {
    token = await tokenAdmin();
    s = await Sesion.abrir('esc-29-estadisticas');
    await entrarComoAdmin(s);
  });
  after(async () => {
    await s.cerrar();
  });

  it('extract: las tarjetas de usuarios, inventario y órdenes coinciden con la API', async () => {
    // Arrange
    const api = await estadisticas(token);
    await s.ir('/admin/stats');

    await s.esperarTexto('Total registrados');

    // Act: una lectura por tarjeta, para que el modelo no mezcle cifras de tarjetas distintas
    const usuarios = await s.extraer(
      'los cuatro números de la tarjeta Usuarios: total registrados, nuevos esta semana, administradores y baneados',
      z.object({
        totalRegistrados: z.number(),
        nuevosEstaSemana: z.number(),
        administradores: z.number(),
        baneados: z.number(),
      }),
    );
    const inventario = await s.extraer(
      'los cuatro números de la tarjeta Inventario: total en catálogo, con stock disponible, verificados y sin stock',
      z.object({
        totalEnCatalogo: z.number(),
        conStockDisponible: z.number(),
        verificados: z.number(),
        sinStock: z.number(),
      }),
    );
    const ordenes = await s.extraer(
      'los seis números de la tarjeta Órdenes: total, pendientes, confirmadas, en camino, entregadas y canceladas',
      z.object({
        total: z.number(),
        pendientes: z.number(),
        confirmadas: z.number(),
        enCamino: z.number(),
        entregadas: z.number(),
        canceladas: z.number(),
      }),
    );
    await s.capturar('estadisticas');

    // Assert
    assert.deepEqual(usuarios, {
      totalRegistrados: api.users.total,
      nuevosEstaSemana: api.users.newThisWeek,
      administradores: api.users.admins,
      baneados: api.users.banned,
    });
    assert.deepEqual(inventario, {
      totalEnCatalogo: api.phones.total,
      conStockDisponible: api.phones.inStock,
      verificados: api.phones.verified,
      sinStock: api.phones.outOfStock,
    });
    assert.deepEqual(ordenes, {
      total: api.orders.total,
      pendientes: api.orders.pending,
      confirmadas: api.orders.confirmed,
      enCamino: api.orders.shipped,
      entregadas: api.orders.delivered,
      canceladas: api.orders.cancelled,
    });
  });

  it('extract: al banear a un usuario, el contador de baneados sube en uno', async () => {
    // Arrange
    const antes = (await estadisticas(token)).users.banned;
    const gaston = await crearUsuario('Gaston');
    assert.equal((await banear(token, gaston.id, 'Cuenta usada para fraude')).status, 200);

    // Act
    await s.ir('/admin/stats');
    await s.esperarTexto('Total registrados');
    const { baneados } = await s.extraer(
      'el número de la fila "Baneados" de la tarjeta Usuarios',
      z.object({ baneados: z.number() }),
    );
    await s.capturar('baneados-subio');

    // Assert
    assert.equal(baneados, antes + 1);
  });

  it('extract: el total de usuarios cuenta a la persona recién registrada', async () => {
    // Arrange
    const antes = (await estadisticas(token)).users.total;
    await crearUsuario('Helena');

    // Act
    await s.ir('/admin/stats');
    await s.esperarTexto('Total registrados');
    const { total } = await s.extraer(
      'el número de la fila "Total registrados" de la tarjeta Usuarios',
      z.object({ total: z.number() }),
    );
    await s.capturar('total-usuarios');

    // Assert
    assert.equal(total, antes + 1);
  });
});
