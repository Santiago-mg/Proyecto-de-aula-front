// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { crearUsuario } from '../../support/api';
import { buscarUsuarios, evidencia } from '../../support/pantalla';

test.describe('ESC-28 Consultar usuarios', () => {
  test('Buscar con el correo completo deja una sola fila', async ({ admin }, info) => {
    const fabio = await crearUsuario('Fabio');

    // 1. Escribir el correo completo de Fabio en el buscador
    await buscarUsuarios(admin, fabio.email);

    // Resultado: una sola fila, la de Fabio, y el contador dice «1 usuario registrado»
    await expect(admin.locator('tbody tr')).toHaveCount(1);
    await expect(admin.locator('tbody tr')).toContainText(fabio.email);
    await expect(admin.getByText('1 usuario registrado', { exact: true })).toBeVisible();
    await evidencia(admin, info, 'busqueda-exacta');

    // 2. Cambiar la búsqueda a mayúsculas: la búsqueda no distingue mayúsculas de minúsculas
    await admin.getByLabel('Buscar por nombre o email').fill(fabio.email.toUpperCase());
    await expect(admin.locator('tbody tr')).toHaveCount(1);
    await expect(admin.locator('tbody tr')).toContainText(fabio.email);
  });
});
