/**
 * Fixtures de los escenarios.
 *
 *  - token:     JWT del administrador (para preparar y comprobar datos por la API).
 *  - admin:     una página con la sesión de administrador ya iniciada por /login.
 *  - celulares: publica celulares de prueba por la API y los borra al terminar el escenario.
 */
import { test as base, expect, type Page } from '@playwright/test';
import * as api from './api';
import { entrarComoAdmin } from './pantalla';

export interface CelularPublicado extends api.Celular {
  id: string;
}

interface Celulares {
  /** Publica un celular de prueba (marca, categoría, precio y stock se pueden cambiar). */
  publicar(base?: Partial<api.Celular>): Promise<CelularPublicado>;
  /** Avisa que la pantalla creó este slug, para borrarlo al terminar. */
  registrar(slug: string): void;
}

export const test = base.extend<{ admin: Page; celulares: Celulares }, { token: string }>({
  token: [
    async ({}, use) => {
      await use(await api.tokenAdmin());
    },
    { scope: 'worker' },
  ],

  admin: async ({ page }, use) => {
    await entrarComoAdmin(page);
    await use(page);
  },

  celulares: async ({ token }, use) => {
    const slugs: string[] = [];
    await use({
      registrar: (slug) => {
        slugs.push(slug);
      },
      publicar: async (base = {}) => {
        const sufijo = api.unico();
        const celular: api.Celular = {
          slug: `prueba-pw-${sufijo}`,
          name: `Prueba PW ${sufijo}`,
          brand: 'Xiaomi',
          categoryId: 'xiaomi',
          price: 900_000,
          stock: 3,
          ...base,
        };
        slugs.push(celular.slug);
        const r = await api.publicarCelular(token, celular);
        expect(r.status, 'no se pudo preparar el celular de prueba por la API').toBe(201);
        return { ...celular, id: r.json.data.id as string };
      },
    });
    for (const slug of slugs) await api.borrarCelular(token, slug);
  },
});

export { expect };
