import { PasswordInput } from '../../src/components/ui/PasswordInput'

// Componente aislado: el campo de contraseña con botón para mostrarla.
describe('PasswordInput', () => {
  beforeEach(() => cy.mount(<PasswordInput aria-label="clave" />))

  it('empieza oculta y el botón ofrece mostrarla', () => {
    cy.get('input').should('have.attr', 'type', 'password')
    cy.findByRoleOrAttr('button', 'Mostrar contraseña')
  })

  it('al pulsar el botón se ve el texto y el botón pasa a ofrecer ocultarla', () => {
    cy.get('input').type('abc123')
    cy.get('button').click()
    cy.get('input').should('have.attr', 'type', 'text').and('have.value', 'abc123')
    cy.get('button').should('have.attr', 'aria-label', 'Ocultar contraseña').and('have.attr', 'aria-pressed', 'true')
  })

  it('pulsarlo otra vez la vuelve a ocultar', () => {
    cy.get('button').click().click()
    cy.get('input').should('have.attr', 'type', 'password')
  })

  it('el botón no envía el formulario que lo contiene', () => {
    cy.get('button').should('have.attr', 'type', 'button')
  })
})

// Pequeña ayuda local para no depender de una librería extra de consultas por rol.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      findByRoleOrAttr(rol: string, nombreAccesible: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
Cypress.Commands.add('findByRoleOrAttr', (rol, nombreAccesible) => cy.get(`${rol}[aria-label="${nombreAccesible}"]`))
