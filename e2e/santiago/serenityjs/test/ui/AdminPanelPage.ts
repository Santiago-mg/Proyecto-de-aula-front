import { By, PageElement } from '@serenity-js/web';

/** /admin (panel principal) y /admin/stats — ESC-29 */
export const AdminPanelPage = {
  // Tarjeta del panel principal, por su etiqueta: "Usuarios", "Celulares en catálogo"...
  indicator: (label: string) => PageElement.located(By.xpath(
    `//div[contains(@class, 'cp-kpi-card')][div[contains(@class, 'cp-kpi-label')][normalize-space()='${ label }']]` +
    "/div[contains(@class, 'cp-kpi-value')]",
  )).describedAs(`indicador "${ label }"`),
};

export const StatisticsPage = {
  // Fila de la página de estadísticas, por su etiqueta: "Baneados", "Sin stock"...
  value: (label: string) => PageElement.located(By.xpath(
    `//div[contains(@class, 'cp-stats-detail-row')][span[normalize-space()='${ label }']]` +
    "/span[contains(@class, 'cp-stats-detail-value')]",
  )).describedAs(`valor de "${ label }" en estadísticas`),
};
