// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { crearUsuario, iniciarSesion } from '../../support/api';
import { buscarUsuarios, evidencia, filaDe } from '../../support/pantalla';

test.describe('ESC-26 Banear usuario', () => {
  test('Banear con un motivo válido', async ({ admin }, info) => {
    const carlos = await crearUsuario('Carlos');

    // 1. Abrir /admin/users y buscar a Carlos por su correo
    await buscarUsuarios(admin, carlos.email);
    const fila = filaDe(admin, carlos.email);
    await expect(fila).toContainText('Activo');

    // 2. Pulsar «Banear» en la fila de Carlos
    await fila.getByRole('button', { name: /^Banear a / }).click();
    const dialogo = admin.getByRole('dialog', { name: 'Banear usuario' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo).toContainText(carlos.email);

    // 3. Escribir el motivo «Spam en los comentarios»
    await dialogo.getByLabel('Motivo del baneo').fill('Spam en los comentarios');
    await evidencia(admin, info, 'motivo-escrito');

    // 4. Pulsar «Confirmar baneo»
    await dialogo.getByRole('button', { name: 'Confirmar baneo' }).click();

    // Resultado: el diálogo se cierra y la fila queda «Baneado» con su motivo
    await expect(dialogo).toBeHidden();
    await expect(fila).toContainText('Baneado');
    await expect(fila).toContainText('Spam en los comentarios');
    await expect(fila.getByRole('button', { name: /^Desbanear a / })).toBeVisible();
    await evidencia(admin, info, 'carlos-baneado');

    // Resultado: la API no lo deja iniciar sesión
    const intento = await iniciarSesion(carlos.email, carlos.password);
    expect(intento.ok, 'Carlos pudo iniciar sesión estando baneado').toBe(false);
  });
});
