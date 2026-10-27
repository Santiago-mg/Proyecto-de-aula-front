// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { crearUsuario, iniciarSesion } from '../../support/api';
import { buscarUsuarios, evidencia, filaDe } from '../../support/pantalla';

test.describe('ESC-26 Banear usuario', () => {
  test('Un motivo de menos de 4 caracteres no se puede confirmar', async ({ admin }, info) => {
    const bruno = await crearUsuario('Bruno');

    // 1. Abrir el diálogo de baneo de Bruno
    await buscarUsuarios(admin, bruno.email);
    await filaDe(admin, bruno.email).getByRole('button', { name: /^Banear a / }).click();
    const dialogo = admin.getByRole('dialog', { name: 'Banear usuario' });
    const confirmar = dialogo.getByRole('button', { name: 'Confirmar baneo' });

    // Resultado: sin motivo, el botón está apagado y la ayuda explica el mínimo
    await expect(confirmar).toBeDisabled();
    await expect(dialogo).toContainText('Mínimo 4 caracteres');

    // 2. Escribir «abc» (3 caracteres, justo por debajo del límite)
    await dialogo.getByLabel('Motivo del baneo').fill('abc');
    await expect(confirmar).toBeDisabled();
    await evidencia(admin, info, 'motivo-corto');

    // 3. Escribir «abcd» (4 caracteres, justo en el límite)
    await dialogo.getByLabel('Motivo del baneo').fill('abcd');
    await expect(confirmar).toBeEnabled();

    // 4. Escribir solo espacios: el motivo se recorta, así que no cuenta
    await dialogo.getByLabel('Motivo del baneo').fill('      ');
    await expect(confirmar).toBeDisabled();

    // Resultado: nada se confirmó, Bruno sigue pudiendo entrar
    expect((await iniciarSesion(bruno.email, bruno.password)).ok, 'Bruno quedó baneado sin confirmar').toBe(true);
  });
});
