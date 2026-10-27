/**
 * Seed de los agentes de Playwright.
 *
 * El Planner y el Generator lo ejecutan antes de explorar o grabar un escenario,
 * así que deja el navegador en el punto de partida común: la administradora con
 * la sesión iniciada, parada en el panel. Usa los mismos fixtures que los
 * escenarios (support/fixtures.ts), así lo que graban los agentes ya sale con
 * los datos y la sesión listos.
 */
import { test, expect } from './support/fixtures';

test.describe('Seed', () => {
  test('seed', async ({ admin }) => {
    // La administradora entra por el formulario de /login y llega a una página protegida
    await admin.goto('/admin');
    await expect(admin).toHaveURL(/\/admin$/);
    await expect(admin.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
