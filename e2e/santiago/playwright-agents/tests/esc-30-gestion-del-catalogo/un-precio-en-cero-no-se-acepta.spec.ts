// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { buscarCelular, unico } from '../../support/api';

test.describe('ESC-30 Gestión del catálogo', () => {
  test('Un precio en cero no se acepta', async ({ admin, celulares }) => {
    const sufijo = unico();
    const slug = `precio-cero-pw-${sufijo}`;
    celulares.registrar(slug);

    // 1. Llenar el formulario con datos válidos, pero con precio 0
    await admin.goto('/admin/phones/new');
    await admin.getByLabel('Nombre', { exact: true }).fill(`Precio cero PW ${sufijo}`);
    await admin.getByLabel('Slug (URL)', { exact: true }).fill(slug);
    await admin.getByLabel('Marca', { exact: true }).fill('Motorola');
    await admin.getByLabel('Categoría', { exact: true }).selectOption('motorola');
    await admin.getByLabel('Precio (COP)', { exact: true }).fill('0');
    await admin.getByLabel('Stock', { exact: true }).fill('1');

    // 2. Pulsar «Crear celular»
    await admin.getByRole('button', { name: 'Crear celular' }).click();

    // Resultado: solo el precio se marca con error y el celular no se crea
    await expect(admin.locator('#price-error')).toHaveText('Debe ser positivo');
    await expect(admin.locator('.cp-field-error')).toHaveCount(1);
    await expect(admin).toHaveURL(/\/admin\/phones\/new$/);
    expect((await buscarCelular(slug)).status, 'se creó un celular con precio 0').toBe(404);
  });
});
