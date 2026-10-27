// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { buscarCelular } from '../../support/api';
import { evidencia } from '../../support/pantalla';

test.describe('ESC-30 Gestión del catálogo', () => {
  test('Eliminar un celular desde la tabla', async ({ admin, celulares }, info) => {
    const celular = await celulares.publicar({ brand: 'Motorola', categoryId: 'motorola', price: 700_000, stock: 2 });

    // 1. Abrir /admin/phones y ubicar la fila del celular (el más nuevo sale primero)
    await admin.goto('/admin/phones');
    const fila = admin.getByRole('row').filter({ hasText: celular.name });
    await expect(fila).toBeVisible();
    await evidencia(admin, info, 'antes-de-eliminar');

    // 2. Pulsar «Eliminar» y aceptar la pregunta de confirmación del navegador
    let pregunta = '';
    admin.once('dialog', async (dialogo) => {
      pregunta = dialogo.message();
      await dialogo.accept();
    });
    await admin.getByRole('button', { name: `Eliminar ${celular.name}` }).click();

    // Resultado: la fila desaparece, la pregunta nombraba al celular y la API ya no lo conoce
    await expect(fila).toHaveCount(0);
    expect(pregunta).toContain(celular.name);
    await expect.poll(async () => (await buscarCelular(celular.slug)).status, {
      message: 'el celular sigue existiendo después de eliminarlo',
    }).toBe(404);
    await evidencia(admin, info, 'despues-de-eliminar');
  });
});
