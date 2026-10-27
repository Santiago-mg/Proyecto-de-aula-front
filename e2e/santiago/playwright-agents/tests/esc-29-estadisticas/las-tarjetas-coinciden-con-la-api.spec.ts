// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { estadisticas } from '../../support/api';
import { cifra, evidencia } from '../../support/pantalla';

test.describe('ESC-29 Estadísticas del administrador', () => {
  test('Las tarjetas de usuarios, inventario y órdenes coinciden con la API', async ({ admin, token }, info) => {
    const api = await estadisticas(token);

    // 1. Abrir /admin/stats
    await admin.goto('/admin/stats');
    await expect(admin.getByRole('heading', { level: 1, name: 'Estadísticas' })).toBeVisible();

    // 2. Leer la tarjeta «Usuarios»
    await expect(cifra(admin, 'Usuarios', 'Total registrados')).toHaveText(String(api.users.total));
    await expect(cifra(admin, 'Usuarios', 'Nuevos esta semana')).toHaveText(String(api.users.newThisWeek));
    await expect(cifra(admin, 'Usuarios', 'Administradores')).toHaveText(String(api.users.admins));
    await expect(cifra(admin, 'Usuarios', 'Baneados')).toHaveText(String(api.users.banned));

    // 3. Leer la tarjeta «Inventario»
    await expect(cifra(admin, 'Inventario', 'Total en catálogo')).toHaveText(String(api.phones.total));
    await expect(cifra(admin, 'Inventario', 'Con stock disponible')).toHaveText(String(api.phones.inStock));
    await expect(cifra(admin, 'Inventario', 'Verificados ✓')).toHaveText(String(api.phones.verified));
    await expect(cifra(admin, 'Inventario', 'Sin stock')).toHaveText(String(api.phones.outOfStock));

    // 4. Leer la tarjeta «Órdenes»
    await expect(cifra(admin, 'Órdenes', 'Total órdenes')).toHaveText(String(api.orders.total));
    await expect(cifra(admin, 'Órdenes', 'Pendientes')).toHaveText(String(api.orders.pending));
    await expect(cifra(admin, 'Órdenes', 'Confirmadas')).toHaveText(String(api.orders.confirmed));
    await expect(cifra(admin, 'Órdenes', 'En camino')).toHaveText(String(api.orders.shipped));
    await expect(cifra(admin, 'Órdenes', 'Entregadas')).toHaveText(String(api.orders.delivered));
    await expect(cifra(admin, 'Órdenes', 'Canceladas')).toHaveText(String(api.orders.cancelled));
    await evidencia(admin, info, 'estadisticas');
  });
});
