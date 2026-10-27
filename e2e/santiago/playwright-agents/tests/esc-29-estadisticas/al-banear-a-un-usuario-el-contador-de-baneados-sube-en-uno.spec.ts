// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { banear, crearUsuario, estadisticas } from '../../support/api';
import { cifra, evidencia } from '../../support/pantalla';

test.describe('ESC-29 Estadísticas del administrador', () => {
  test('Al banear a un usuario, el contador de baneados sube en uno', async ({ admin, token }, info) => {
    const antes = (await estadisticas(token)).users.banned;
    const gaston = await crearUsuario('Gaston');
    expect((await banear(token, gaston.id, 'Cuenta usada para fraude')).status).toBe(200);

    // 1. Abrir /admin/stats y leer «Baneados» en la tarjeta «Usuarios»
    await admin.goto('/admin/stats');

    // Resultado: el contador es el de antes más uno
    await expect(cifra(admin, 'Usuarios', 'Baneados')).toHaveText(String(antes + 1));
    await evidencia(admin, info, 'baneados-subio');
  });
});
