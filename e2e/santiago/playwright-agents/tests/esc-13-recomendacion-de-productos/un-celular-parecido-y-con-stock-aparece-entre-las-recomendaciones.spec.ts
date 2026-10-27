// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { buscarCelular, recomendaciones } from '../../support/api';
import { evidencia } from '../../support/pantalla';

const SLUG = 'iphone-15-pro-max';

test.describe('ESC-13 Recomendación de productos', () => {
  test('Un celular parecido y con stock aparece entre las recomendaciones', async ({ page, celulares }, info) => {
    // Mismo precio, marca y categoría que el iPhone 15 Pro Max: puntaje máximo y empate más cercano
    const precioBase = Number((await buscarCelular(SLUG)).json.data.price);
    const nuevo = await celulares.publicar({ name: `iPhone PW ${Date.now().toString(36)}`, brand: 'Apple', categoryId: 'apple', price: precioBase, stock: 4 });
    expect(await recomendaciones(SLUG), 'la API no lo recomienda: el dato no sirve').toContain(nuevo.name);

    // 1. Abrir la ficha del iPhone 15 Pro Max
    await page.goto(`/phones/${SLUG}`);

    // Resultado: el celular nuevo aparece en «También te puede interesar»
    const seccion = page.getByRole('region', { name: 'También te puede interesar' });
    await expect(seccion.getByRole('heading', { name: nuevo.name, exact: true })).toBeVisible();
    await evidencia(page, info, 'recomendacion-nueva');
  });
});
