// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { crearUsuario } from '../../support/api';
import { buscarUsuarios, evidencia, filaDe } from '../../support/pantalla';

test.describe('ESC-27 Desbanear usuario', () => {
  test('Una cuenta activa ofrece Banear y no Desbanear', async ({ admin }, info) => {
    const elias = await crearUsuario('Elias');

    // 1. Buscar a Elias (cuenta activa) en /admin/users
    await buscarUsuarios(admin, elias.email);
    const fila = filaDe(admin, elias.email);

    // Resultado: la fila dice «Activo», ofrece Banear y no ofrece Desbanear
    await expect(fila).toContainText('Activo');
    await expect(fila.getByRole('button', { name: /^Banear a / })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Desbanear a / })).toHaveCount(0);
    await evidencia(admin, info, 'elias-activo');
  });
});
