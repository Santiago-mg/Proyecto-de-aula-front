// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { buscarCelular, recomendaciones } from '../../support/api';
import { evidencia } from '../../support/pantalla';

const SLUG = 'iphone-15-pro-max';

test.describe('ESC-13 Recomendación de productos', () => {
  test('Muestra como máximo 4 recomendaciones', async ({ page, celulares }, info) => {
    // Cinco celulares con stock, de la misma marca, categoría y precio: sobran candidatos
    const precioBase = Number((await buscarCelular(SLUG)).json.data.price);
    const sufijo = Date.now().toString(36);
    for (let i = 1; i <= 5; i++) {
      await celulares.publicar({ name: `iPhone tope ${i} PW ${sufijo}`, brand: 'Apple', categoryId: 'apple', price: precioBase, stock: 2 });
    }
    expect((await recomendaciones(SLUG)).length, 'la API no limita a 4: el dato no sirve').toBe(4);

    // 1. Abrir la ficha del iPhone 15 Pro Max
    await page.goto(`/phones/${SLUG}`);
    const seccion = page.getByRole('region', { name: 'También te puede interesar' });
    await expect(seccion).toBeVisible();

    // Resultado: la fila muestra exactamente 4 tarjetas, ni más ni menos
    await expect(seccion.getByRole('heading', { level: 3 })).toHaveCount(4);
    await evidencia(page, info, 'maximo-cuatro');
  });
});
