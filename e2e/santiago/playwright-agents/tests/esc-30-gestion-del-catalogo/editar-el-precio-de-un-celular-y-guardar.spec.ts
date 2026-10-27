// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { buscarCelular } from '../../support/api';
import { evidencia } from '../../support/pantalla';

test.describe('ESC-30 Gestión del catálogo', () => {
  test('Editar el precio de un celular y guardar', async ({ admin, celulares }, info) => {
    const celular = await celulares.publicar({ brand: 'Xiaomi', categoryId: 'xiaomi', price: 900_000, stock: 3 });

    // 1. Abrir la edición del celular
    await admin.goto(`/admin/phones/${celular.id}/edit`);
    await expect(admin.getByRole('heading', { level: 1, name: 'Editar celular' })).toBeVisible();
    await expect(admin.getByLabel('Nombre', { exact: true })).toHaveValue(celular.name);
    await expect(admin.getByLabel('Precio (COP)', { exact: true })).toHaveValue('900000');

    // 2. Cambiar el precio a 850000
    await admin.getByLabel('Precio (COP)', { exact: true }).fill('850000');
    await evidencia(admin, info, 'precio-nuevo');

    // 3. Pulsar «Guardar cambios»
    await admin.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(admin).toHaveURL(/\/admin\/phones$/);

    // Resultado: el precio cambió y lo demás quedó como estaba
    const guardado = await buscarCelular(celular.slug);
    expect(Number(guardado.json.data.price)).toBe(850_000);
    expect(guardado.json.data.name, 'el nombre cambió sin que nadie lo tocara').toBe(celular.name);
    expect(Number(guardado.json.data.stock)).toBe(3);
  });
});
