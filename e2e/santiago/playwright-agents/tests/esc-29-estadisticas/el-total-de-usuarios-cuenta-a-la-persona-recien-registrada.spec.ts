// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { crearUsuario, estadisticas } from '../../support/api';
import { cifra, evidencia } from '../../support/pantalla';

test.describe('ESC-29 Estadísticas del administrador', () => {
  test('El total de usuarios cuenta a la persona recién registrada', async ({ admin, token }, info) => {
    const antes = (await estadisticas(token)).users.total;
    await crearUsuario('Helena');

    // 1. Abrir /admin/stats y leer «Total registrados» en la tarjeta «Usuarios»
    await admin.goto('/admin/stats');

    // Resultado: el total es el de antes más uno
    await expect(cifra(admin, 'Usuarios', 'Total registrados')).toHaveText(String(antes + 1));
    await evidencia(admin, info, 'total-usuarios');
  });
});
