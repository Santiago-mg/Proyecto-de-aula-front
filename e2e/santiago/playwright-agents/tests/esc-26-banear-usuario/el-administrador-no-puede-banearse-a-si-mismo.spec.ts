// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { entorno } from '../../support/api';
import { buscarUsuarios, filaDe } from '../../support/pantalla';

test.describe('ESC-26 Banear usuario', () => {
  test('El administrador no puede banearse a sí mismo', async ({ admin }) => {
    // 1. Buscar la propia cuenta del administrador en /admin/users
    await buscarUsuarios(admin, entorno.admin.email);
    const fila = filaDe(admin, entorno.admin.email);

    // Resultado: la fila se marca «(tú)» y no ofrece Banear ni cambiar el rol
    await expect(fila).toContainText('(tú)');
    await expect(fila.getByRole('button', { name: /^Banear a / })).toHaveCount(0);
    await expect(fila.getByRole('button', { name: /admin a / })).toHaveCount(0);
  });
});
