// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { crearUsuario, listarUsuarios, unico } from '../../support/api';
import { buscarUsuarios, evidencia } from '../../support/pantalla';

test.describe('ESC-28 Consultar usuarios', () => {
  test('Buscar por un texto compartido muestra a todos y solo a esos usuarios', async ({ admin, token }, info) => {
    // Dos usuarios con la misma marca en el nombre, para poder buscarlos juntos
    const marca = `consulta${unico()}`;
    const a = await crearUsuario(marca);
    const b = await crearUsuario(marca);
    const esperados = (await listarUsuarios(token, marca)).correos.sort();
    expect(esperados, 'la API no encuentra a los dos usuarios: el dato no sirve').toEqual([a.email, b.email].sort());

    // 1. Escribir la marca en el buscador de /admin/users
    await buscarUsuarios(admin, marca);

    // Resultado: la tabla tiene exactamente esas dos filas y el contador dice «2 usuarios registrados»
    await expect(admin.locator('tbody tr')).toHaveCount(2);
    for (const correo of esperados) await expect(admin.getByRole('row').filter({ hasText: correo })).toBeVisible();
    await expect(admin.getByText('2 usuarios registrados', { exact: true })).toBeVisible();
    await evidencia(admin, info, 'busqueda-compartida');
  });
});
