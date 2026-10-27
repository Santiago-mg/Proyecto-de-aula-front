// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { evidencia } from '../../support/pantalla';

test.describe('ESC-30 Gestión del catálogo', () => {
  test('El formulario vacío no se envía y explica los errores', async ({ admin }, info) => {
    // 1. Abrir /admin/phones/new sin llenar nada
    await admin.goto('/admin/phones/new');
    await expect(admin.getByRole('button', { name: 'Crear celular' })).toBeVisible();

    // 2. Pulsar «Crear celular»
    await admin.getByRole('button', { name: 'Crear celular' }).click();

    // Resultado: cada campo obligatorio dice qué le falta
    await expect(admin.locator('#name-error')).toHaveText('Mínimo 3 caracteres');
    await expect(admin.locator('#slug-error')).toHaveText('Mínimo 3 caracteres');
    await expect(admin.locator('#brand-error')).toHaveText('Requerido');
    await expect(admin.locator('#categoryId-error')).toHaveText('Requerido');
    await expect(admin.locator('#price-error')).toHaveText('Debe ser positivo');
    await expect(admin.getByLabel('Nombre', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await evidencia(admin, info, 'formulario-vacio');

    // Resultado: no se envió nada, la página sigue en el formulario
    await expect(admin).toHaveURL(/\/admin\/phones\/new$/);
  });
});
