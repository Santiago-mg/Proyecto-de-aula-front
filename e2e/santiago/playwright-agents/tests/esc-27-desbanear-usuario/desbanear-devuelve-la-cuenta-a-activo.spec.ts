// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { banear, crearUsuario, iniciarSesion } from '../../support/api';
import { buscarUsuarios, evidencia, filaDe } from '../../support/pantalla';

test.describe('ESC-27 Desbanear usuario', () => {
  test('Desbanear devuelve la cuenta a Activo', async ({ admin, token }, info) => {
    // La prueba empieza con Diana ya suspendida (se prepara por la API)
    const diana = await crearUsuario('Diana');
    expect((await banear(token, diana.id, 'Reclamos falsos repetidos')).status).toBe(200);
    expect((await iniciarSesion(diana.email, diana.password)).ok, 'Diana no quedó baneada: el dato no sirve').toBe(false);

    // 1. Buscar a Diana en /admin/users
    await buscarUsuarios(admin, diana.email);
    const fila = filaDe(admin, diana.email);
    await expect(fila).toContainText('Baneado');
    await expect(fila).toContainText('Reclamos falsos repetidos');
    await evidencia(admin, info, 'diana-baneada');

    // 2. Pulsar «Desbanear» en su fila
    await fila.getByRole('button', { name: /^Desbanear a / }).click();

    // Resultado: la fila vuelve a «Activo», sin motivo, y ofrece Banear otra vez
    await expect(fila).toContainText('Activo');
    await expect(fila).not.toContainText('Reclamos falsos repetidos');
    await expect(fila.getByRole('button', { name: /^Banear a / })).toBeVisible();
    await evidencia(admin, info, 'diana-activa');

    // Resultado: Diana vuelve a poder iniciar sesión
    expect((await iniciarSesion(diana.email, diana.password)).ok, 'Diana sigue sin poder entrar').toBe(true);
  });
});
