// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { listarUsuarios, unico } from '../../support/api';
import { evidencia } from '../../support/pantalla';

test.describe('ESC-28 Consultar usuarios', () => {
  test('Una búsqueda sin coincidencias avisa que no hay resultados', async ({ admin, token }, info) => {
    const inexistente = `nadie-${unico()}@example.invalid`;
    expect((await listarUsuarios(token, inexistente)).total, 'la API sí encuentra a alguien: el dato no sirve').toBe(0);

    // 1. Escribir un correo que no existe en el buscador de /admin/users
    await admin.goto('/admin/users');
    await admin.getByLabel('Buscar por nombre o email').fill(inexistente);

    // Resultado: se avisa «Ningún usuario coincide con tu búsqueda» y la tabla desaparece
    await expect(admin.getByText('Ningún usuario coincide con tu búsqueda')).toBeVisible();
    await expect(admin.locator('tbody tr')).toHaveCount(0);
    await evidencia(admin, info, 'sin-resultados');

    // 2. Pulsar «Quitar la búsqueda»
    await admin.getByRole('button', { name: 'Quitar la búsqueda' }).click();

    // Resultado: el buscador queda vacío y la tabla vuelve con usuarios
    await expect(admin.getByLabel('Buscar por nombre o email')).toHaveValue('');
    await expect(admin.locator('tbody tr').first()).toBeVisible();
  });
});
