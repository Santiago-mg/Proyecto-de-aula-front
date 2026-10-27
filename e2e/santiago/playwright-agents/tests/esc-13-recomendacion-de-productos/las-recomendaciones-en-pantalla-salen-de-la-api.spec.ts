// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { recomendaciones } from '../../support/api';
import { evidencia } from '../../support/pantalla';

const SLUG = 'iphone-15-pro-max';

test.describe('ESC-13 Recomendación de productos', () => {
  test('Las recomendaciones en pantalla salen de la API', async ({ page }, info) => {
    const deLaApi = await recomendaciones(SLUG);
    expect(deLaApi.length, 'la API no devolvió recomendaciones para el iPhone 15 Pro Max').toBeGreaterThan(0);

    // 1. Abrir la ficha del iPhone 15 Pro Max
    await page.goto(`/phones/${SLUG}`);

    // 2. Ubicar la sección «También te puede interesar»
    const seccion = page.getByRole('region', { name: 'También te puede interesar' });
    await expect(seccion).toBeVisible();

    // Resultado: muestra los mismos celulares, en el mismo orden, que responde GET /phones/:slug/similares
    await expect(seccion.getByRole('heading', { level: 3 })).toHaveText(deLaApi);
    await expect(seccion.getByRole('heading', { name: 'iPhone 15 Pro Max', exact: true })).toHaveCount(0);
    await evidencia(page, info, 'recomendaciones');
  });
});
