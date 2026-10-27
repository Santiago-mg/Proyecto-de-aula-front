/**
 * Pasos de pantalla que se repiten en varios escenarios: iniciar sesión como
 * administrador, buscar a un usuario y dejar una captura como evidencia.
 */
import { expect, type Page, type TestInfo } from '@playwright/test';
import { entorno } from './api';

/** Inicia sesión por el formulario real de /login, como lo haría la administradora. */
export async function entrarComoAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(entorno.admin.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(entorno.admin.password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** La fila de la tabla de usuarios que contiene ese texto (correo o nombre). */
export const filaDe = (page: Page, texto: string) => page.getByRole('row').filter({ hasText: texto });

/**
 * Abre /admin/users y busca por un texto. Espera a que termine el "Actualizando la
 * lista..." para que el escenario nunca actúe sobre la tabla anterior.
 */
export async function buscarUsuarios(page: Page, termino: string): Promise<void> {
  await page.goto('/admin/users');
  await page.getByLabel('Buscar por nombre o email').fill(termino);
  await expect(page.getByText('Actualizando la lista...')).toBeHidden();
  // La búsqueda espera 400 ms tras la última tecla: hasta que la tabla no se reduce a
  // lo buscado, lo que se ve todavía es la lista anterior.
  await expect(page.locator('tbody tr').first()).toContainText(termino);
}

/** Guarda una captura en evidencia/ (para el informe) y la adjunta al reporte HTML. */
export async function evidencia(page: Page, info: TestInfo, nombre: string): Promise<void> {
  const cuerpo = await page.screenshot({ fullPage: true });
  await info.attach(nombre, { body: cuerpo, contentType: 'image/png' });
  const { mkdir, writeFile } = await import('node:fs/promises');
  const carpeta = `evidencia/${info.titlePath[1]?.replace(/[^a-z0-9]+/gi, '-').toLowerCase() ?? 'sin-suite'}`;
  await mkdir(carpeta, { recursive: true });
  await writeFile(`${carpeta}/${nombre}.png`, cuerpo);
}

/** El número de una fila de una tarjeta de /admin/stats (por ejemplo, «Usuarios» → «Baneados»). */
export const cifra = (page: Page, tarjeta: string, fila: string) =>
  page
    .getByRole('region', { name: tarjeta, exact: true })
    .getByText(fila, { exact: true })
    .locator('xpath=following-sibling::dd[1]');
