// spec: specs/plan-celularpro.md
// seed: seed.spec.ts

import { test, expect } from '../../support/fixtures';
import { crearUsuario, iniciarSesion } from '../../support/api';
import { buscarUsuarios, filaDe } from '../../support/pantalla';

test.describe('ESC-26 Banear usuario', () => {
  test('Cancelar el diálogo no banea', async ({ admin }) => {
    const camila = await crearUsuario('Camila');

    // 1. Abrir el diálogo de baneo de Camila y escribir un motivo válido
    await buscarUsuarios(admin, camila.email);
    await filaDe(admin, camila.email).getByRole('button', { name: /^Banear a / }).click();
    const dialogo = admin.getByRole('dialog', { name: 'Banear usuario' });
    await dialogo.getByLabel('Motivo del baneo').fill('Motivo que no se va a confirmar');

    // 2. Pulsar «Cancelar»
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();

    // Resultado: el diálogo se cierra, la fila sigue «Activo» y Camila puede entrar
    await expect(dialogo).toBeHidden();
    await expect(filaDe(admin, camila.email)).toContainText('Activo');
    expect((await iniciarSesion(camila.email, camila.password)).ok, 'Camila quedó baneada al cancelar').toBe(true);
  });
});
