// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { buscarCelular } from '../../support/api';

test.describe('ESC-30 Gestión del catálogo', () => {
  test('Cancelar la pregunta de confirmación conserva el celular', async ({ admin, celulares }) => {
    const celular = await celulares.publicar({ brand: 'Motorola', categoryId: 'motorola', price: 650_000, stock: 1 });

    // 1. Abrir /admin/phones y pulsar «Eliminar» en la fila del celular
    await admin.goto('/admin/phones');
    const fila = admin.getByRole('row').filter({ hasText: celular.name });
    await expect(fila).toBeVisible();

    // 2. Rechazar la pregunta de confirmación del navegador
    admin.once('dialog', (dialogo) => dialogo.dismiss());
    await admin.getByRole('button', { name: `Eliminar ${celular.name}` }).click();

    // Resultado: la fila sigue en la tabla y el celular sigue en la API
    await expect(fila).toBeVisible();
    expect((await buscarCelular(celular.slug)).status).toBe(200);
  });
});
