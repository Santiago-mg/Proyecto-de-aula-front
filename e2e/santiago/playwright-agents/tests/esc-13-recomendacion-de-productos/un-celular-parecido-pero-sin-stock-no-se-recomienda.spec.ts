// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { buscarCelular, recomendaciones } from '../../support/api';
import { evidencia } from '../../support/pantalla';

const SLUG = 'iphone-15-pro-max';

test.describe('ESC-13 Recomendación de productos', () => {
  test('Un celular parecido pero sin stock no se recomienda', async ({ page, celulares }, info) => {
    const precioBase = Number((await buscarCelular(SLUG)).json.data.price);
    const agotado = await celulares.publicar({ name: `iPhone agotado PW ${Date.now().toString(36)}`, brand: 'Apple', categoryId: 'apple', price: precioBase, stock: 0 });
    expect(await recomendaciones(SLUG), 'la API lo recomienda estando agotado').not.toContain(agotado.name);

    // 1. Abrir la ficha del iPhone 15 Pro Max
    await page.goto(`/phones/${SLUG}`);
    const seccion = page.getByRole('region', { name: 'También te puede interesar' });
    await expect(seccion).toBeVisible();

    // Resultado: el celular agotado no está entre las recomendaciones
    await expect(seccion.getByRole('heading', { name: agotado.name, exact: true })).toHaveCount(0);
    await evidencia(page, info, 'agotado-no-aparece');
  });
});
