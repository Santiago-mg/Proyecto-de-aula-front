import { By, PageElement, PageElements } from '@serenity-js/web'

export const AdminUsersPage = {
  titulo: PageElement.located(By.css('.cp-admin-page-title'))
    .describedAs('título de gestión de usuarios'),

  // AGREGAMOS .first() AQUÍ:
  primerBotonBanear: PageElements.located(By.css('button:has-text("Banear")')).first()
    .describedAs('primer botón de banear disponible'),

  primerBotonDesbanear: PageElements.located(By.css('button:has-text("Desbanear")')).first()
    .describedAs('primer botón de desbanear disponible'),

  modalContenedor: PageElement.located(By.css('.cp-modal'))
    .describedAs('ventana modal de confirmación'),

  modalInputMotivo: PageElement.located(By.css('.cp-modal input.cp-input'))
    .describedAs('campo de texto para el motivo del baneo'),

  // Aquí no hace falta .first() porque asumo que solo hay un modal abierto a la vez
  modalBotonConfirmar: PageElement.located(By.css('.cp-modal button:has-text("Confirmar baneo")'))
    .describedAs('botón para confirmar el baneo'),

  // AGREGAMOS .first() AQUÍ TAMBIÉN:
  primerBadgeBaneado: PageElements.located(By.css('span.cp-badge:has-text("Baneado")')).first()
    .describedAs('etiqueta visual de usuario baneado'),

  primerBadgeActivo: PageElements.located(By.css('span.cp-badge:has-text("Activo")')).first()
    .describedAs('etiqueta visual de usuario activo')
}