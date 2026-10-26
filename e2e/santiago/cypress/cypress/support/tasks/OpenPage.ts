import type { Task } from '../screenplay/actor'
import { AdminPanelPage, CatalogAdminPage, StatisticsPage, UsersPage } from '../ui/pages'

const visit = (path: string) => cy.visit(path, { failOnStatusCode: false })

/** Abre una página y espera a que termine de cargar lo importante. */
export const OpenPage = {
  // La ficha puede terminar en "Celular no encontrado": aquí solo se navega
  // y cada verificación espera lo que le corresponde.
  phoneDetail: (slug: string): Task => (actor) => {
    actor.takesTheBrowser()
    visit(`/phones/${slug}`)
  },
  userManagement: (): Task => (actor) => {
    actor.takesTheBrowser()
    visit('/admin/users')
    UsersPage.searchBox().should('be.visible')
  },
  adminDashboard: (): Task => (actor) => {
    actor.takesTheBrowser()
    visit('/admin')
    AdminPanelPage.indicator('Usuarios').should('be.visible')
  },
  statistics: (): Task => (actor) => {
    actor.takesTheBrowser()
    visit('/admin/stats')
    StatisticsPage.value('Baneados').should('exist')
  },
  catalogManagement: (): Task => (actor) => {
    actor.takesTheBrowser()
    visit('/admin/phones')
    CatalogAdminPage.table().should('exist')
  },
}

/** Solo navega: sirve cuando se espera que la página no deje entrar. */
export const TryToOpen = {
  page:
    (path: string): Task =>
    (actor) => {
      actor.takesTheBrowser()
      visit(path)
    },
}
