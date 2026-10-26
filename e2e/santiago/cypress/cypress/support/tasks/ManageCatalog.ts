import type { Task } from '../screenplay/actor'
import type { TestPhone } from '../screenplay/testData'
import { CatalogAdminPage, PhoneFormPage } from '../ui/pages'
import { OpenPage } from './OpenPage'

const fillTheForm = (phone: TestPhone): Task => (actor) => {
  actor.takesTheBrowser()
  cy.visit('/admin/phones/new', { failOnStatusCode: false })
  PhoneFormPage.name().clear().type(phone.name)
  PhoneFormPage.slug().clear().type(phone.slug)
  PhoneFormPage.brand().clear().type(phone.brand)
  PhoneFormPage.category().select(phone.categoryLabel)
  PhoneFormPage.price().clear().type(String(phone.price))
  PhoneFormPage.stock().clear().type(String(phone.stock))
  PhoneFormPage.submit().click()
}

/** ESC-30 */
export const PublishPhone = {
  fromTheForm:
    (phone: TestPhone): Task =>
    (actor) => {
      fillTheForm(phone)(actor)
      // Si se guardó, el formulario la devuelve a la tabla del catálogo.
      CatalogAdminPage.row(phone.name).should('exist')
    },
}

/** Solo envía el formulario: sirve cuando se espera que el back lo rechace. */
export const TryToPublishPhone = {
  fromTheForm: (phone: TestPhone): Task => fillTheForm(phone),
}

export const ChangePrice = {
  of: (phone: TestPhone) => ({
    to:
      (newPrice: number): Task =>
      (actor) => {
        OpenPage.catalogManagement()(actor)
        CatalogAdminPage.editButton(phone.name).click()
        // El formulario de edición carga los datos del celular por la API.
        PhoneFormPage.name().should('have.value', phone.name)
        PhoneFormPage.price().clear().type(String(newPrice))
        PhoneFormPage.submit().click()
        CatalogAdminPage.table().should('exist')
      },
  }),
}

export const DeletePhone = {
  called:
    (phone: TestPhone): Task =>
    (actor) => {
      OpenPage.catalogManagement()(actor)
      // La tabla pide confirmar con un diálogo del navegador: Cypress lo acepta solo.
      CatalogAdminPage.deleteButton(phone.name).click()
      CatalogAdminPage.row(phone.name).should('not.exist')
    },
}
