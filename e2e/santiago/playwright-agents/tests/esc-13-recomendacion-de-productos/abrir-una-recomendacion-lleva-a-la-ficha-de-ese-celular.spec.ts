// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { recomendaciones } from '../../support/api';
import { evidencia } from '../../support/pantalla';

const SLUG = 'iphone-15-pro-max';

test.describe('ESC-13 Recomendación de productos', () => {
  test('Abrir una recomendación lleva a la ficha de ese celular', async ({ page }, info) => {
    const [primero] = await recomendaciones(SLUG);
    expect(primero, 'la API no devolvió recomendaciones').toBeTruthy();

    // 1. Abrir la ficha del iPhone 15 Pro Max
    await page.goto(`/phones/${SLUG}`);
    const seccion = page.getByRole('region', { name: 'También te puede interesar' });
    await expect(seccion).toBeVisible();

    // 2. Pulsar la primera tarjeta recomendada
    await seccion
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { name: primero, exact: true }) })
      .click();

    // Resultado: la ficha que se abre es la del celular recomendado, no la de origen
    await expect(page).toHaveURL(/\/phones\//);
    await expect(page).not.toHaveURL(new RegExp(`/phones/${SLUG}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(primero);
    await evidencia(page, info, 'ficha-recomendada');
  });
});
