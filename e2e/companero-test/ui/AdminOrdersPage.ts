import { By, PageElement } from '@serenity-js/web'

export const AdminOrdersPage = {
  // Título de la vista para verificar que cargó
  titulo: PageElement.located(By.css('.cp-admin-page-title'))
    .describedAs('título de gestión de órdenes'),

  // El <select> de la primera fila de la tabla
  primerSelectEstado: PageElement.located(By.css('tbody tr:first-child select.cp-select'))
    .describedAs('selector de estado del primer pedido'),

  // El badge visual (span) de la primera fila de la tabla
  primerBadgeEstado: PageElement.located(By.css('tbody tr:first-child .cp-badge'))
    .describedAs('etiqueta visual de estado del primer pedido')
}