import { Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { isVisible, Navigate } from '@serenity-js/web';

import { pageAt } from '../support/environment';
import { AdminPanelPage, StatisticsPage } from '../ui/AdminPanelPage';
import { CatalogAdminPage } from '../ui/CatalogAdminPage';
import { UsersPage } from '../ui/UsersPage';

/** Abre una página y espera a que termine de cargar lo importante. */
export const OpenPage = {
  // La ficha puede terminar en "Celular no encontrado": aquí solo se navega
  // y cada verificación espera lo que le corresponde.
  phoneDetail: (slug: string) => Task.where(`#actor abre la ficha del celular "${ slug }"`,
    Navigate.to(pageAt(`/phones/${ slug }`)),
  ),
  userManagement: () => Task.where('#actor abre la gestión de usuarios',
    Navigate.to(pageAt('/admin/users')),
    Wait.until(UsersPage.searchBox(), isVisible()),
  ),
  adminDashboard: () => Task.where('#actor abre el panel principal',
    Navigate.to(pageAt('/admin')),
    Wait.until(AdminPanelPage.indicator('Usuarios'), isVisible()),
  ),
  statistics: () => Task.where('#actor abre las estadísticas',
    Navigate.to(pageAt('/admin/stats')),
    Wait.until(StatisticsPage.value('Baneados'), isPresent()),
  ),
  catalogManagement: () => Task.where('#actor abre la gestión del catálogo',
    Navigate.to(pageAt('/admin/phones')),
    Wait.until(CatalogAdminPage.table(), isPresent()),
  ),
};

/** Solo navega: sirve cuando se espera que la página no deje entrar. */
export const TryToOpen = {
  page: (path: string, description: string) => Task.where(`#actor intenta abrir ${ description }`,
    Navigate.to(pageAt(path)),
  ),
};
