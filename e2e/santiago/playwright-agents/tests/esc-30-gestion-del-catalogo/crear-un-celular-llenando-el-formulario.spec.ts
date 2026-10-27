// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { buscarCelular, unico } from '../../support/api';
import { evidencia } from '../../support/pantalla';

test.describe('ESC-30 Gestión del catálogo', () => {
  test('Crear un celular llenando el formulario', async ({ admin, celulares }, info) => {
    const sufijo = unico();
    const nombre = `Galaxy PW ${sufijo}`;
    const slug = `galaxy-pw-${sufijo}`;
    celulares.registrar(slug);

    // 1. Abrir /admin/phones/new
    await admin.goto('/admin/phones/new');
    await expect(admin.getByRole('heading', { level: 1, name: 'Nuevo celular' })).toBeVisible();

    // 2. Llenar nombre, slug, marca, categoría, precio y stock
    await admin.getByLabel('Nombre', { exact: true }).fill(nombre);
    await admin.getByLabel('Slug (URL)', { exact: true }).fill(slug);
    await admin.getByLabel('Marca', { exact: true }).fill('Samsung');
    await admin.getByLabel('Categoría', { exact: true }).selectOption('samsung');
    await admin.getByLabel('Precio (COP)', { exact: true }).fill('2300000');
    await admin.getByLabel('Stock', { exact: true }).fill('7');
    await evidencia(admin, info, 'formulario-lleno');

    // 3. Pulsar «Crear celular»
    await admin.getByRole('button', { name: 'Crear celular' }).click();

    // Resultado: vuelve a la lista y el celular nuevo aparece en ella
    await expect(admin).toHaveURL(/\/admin\/phones$/);
    await expect(admin.getByRole('row').filter({ hasText: nombre })).toBeVisible();
    await evidencia(admin, info, 'lista-con-el-nuevo');

    // Resultado: lo guardado es lo escrito (se comprueba contra la API, no contra la pantalla)
    const guardado = await buscarCelular(slug);
    expect(guardado.status, 'el celular no quedó en el catálogo').toBe(200);
    expect(guardado.json.data.name).toBe(nombre);
    expect(guardado.json.data.brand).toBe('Samsung');
    expect(Number(guardado.json.data.price)).toBe(2_300_000);
    expect(Number(guardado.json.data.stock)).toBe(7);
  });
});
