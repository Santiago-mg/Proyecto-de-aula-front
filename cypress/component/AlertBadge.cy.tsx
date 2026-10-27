import { AlertBadge } from '../../src/components/admin/AlertBadge'

// El estado se dice con TEXTO e ícono, no solo con color.
describe('AlertBadge', () => {
  it('OUT_OF_STOCK dice "Sin stock" y usa la variante roja', () => {
    cy.mount(<AlertBadge type="OUT_OF_STOCK" />)
    cy.contains('Sin stock').should('have.class', 'cp-alert-badge-out')
  })

  it('LOW_STOCK dice "Stock bajo" y usa la variante naranja', () => {
    cy.mount(<AlertBadge type="LOW_STOCK" />)
    cy.contains('Stock bajo').should('have.class', 'cp-alert-badge-low')
  })

  it('el ícono es decorativo: no lo anuncian los lectores de pantalla', () => {
    cy.mount(<AlertBadge type="LOW_STOCK" />)
    cy.get('svg').should('have.attr', 'aria-hidden', 'true')
  })
})
