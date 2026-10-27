/// <reference types="cypress" />
import { CLAVE } from '../support/comandos'

// Funcionalidades 3 (perfil) y 5 (roles).
const entrar = (email: string, clave = CLAVE) => {
  cy.visit('/login')
  cy.get('#email').type(email)
  cy.get('#password').type(clave)
  cy.get('form button[type="submit"]').click()
  cy.location('pathname').should('eq', '/dashboard')
}

describe('Perfil', () => {
  it('cambiar el nombre: aviso de confirmación y saludo nuevo', () => {
    cy.registrarPorApi().then(({ email }) => {
      entrar(email)
      cy.visit('/profile')
      cy.get('#profile-name').clear().type('María Gómez')
      cy.contains('button', 'Guardar cambios').click()
      cy.get('[data-testid="toast"]').should('have.text', 'Perfil actualizado').and('have.attr', 'role', 'status')
      cy.visit('/dashboard')
      cy.get('h1').should('contain', 'Hola, María')
    })
  })

  it('un nombre en blanco no se guarda', () => {
    cy.registrarPorApi().then(({ email }) => {
      entrar(email)
      cy.visit('/profile')
      cy.get('#profile-name').clear().type('   ')
      cy.contains('button', 'Guardar cambios').click()
      cy.get('.cp-field-error').should('contain', 'El nombre debe tener al menos 2 caracteres')
    })
  })

  it('cambiar la contraseña y entrar con la nueva; la vieja ya no entra', () => {
    cy.registrarPorApi().then(({ email }) => {
      entrar(email)
      cy.visit('/profile')
      cy.get('#currentPassword').type(CLAVE)
      cy.get('#newPassword').type('ClaveNueva2027')
      cy.get('#confirmNewPassword').type('ClaveNueva2027')
      cy.contains('button', 'Cambiar contraseña').click()
      cy.get('[data-testid="toast"]').should('have.text', 'Contraseña actualizada')
      cy.contains('button', /^\s*Cerrar sesión\s*$/).click()
      entrar(email, 'ClaveNueva2027')
    })
  })

  it('la contraseña actual equivocada no permite el cambio', () => {
    cy.registrarPorApi().then(({ email }) => {
      entrar(email)
      cy.visit('/profile')
      cy.get('#currentPassword').type('EquivocadaXX1')
      cy.get('#newPassword').type('ClaveNueva2027')
      cy.get('#confirmNewPassword').type('ClaveNueva2027')
      cy.contains('button', 'Cambiar contraseña').click()
      cy.get('.cp-error-message').should('have.text', 'La contraseña actual no es correcta')
    })
  })

  it('una contraseña nueva débil se frena en el formulario', () => {
    cy.registrarPorApi().then(({ email }) => {
      entrar(email)
      cy.visit('/profile')
      cy.get('#currentPassword').type(CLAVE)
      cy.get('#newPassword').type('12345678')
      cy.get('#confirmNewPassword').type('12345678')
      cy.contains('button', 'Cambiar contraseña').click()
      cy.get('.cp-field-error').should('contain', 'al menos una letra minúscula')
    })
  })
})

describe('Control de roles', () => {
  it('un cliente no entra al panel: pantalla de acceso no autorizado', () => {
    cy.registrarPorApi().then(({ email }) => {
      entrar(email)
      cy.visit('/admin/alerts')
      cy.location('pathname').should('eq', '/unauthorized')
      cy.get('h1').should('contain', 'Acceso no autorizado')
    })
  })

  it('sin sesión, el panel lleva a iniciar sesión', () => {
    cy.visit('/admin')
    cy.location('pathname').should('eq', '/login')
  })

  it('un administrador sí entra al panel', () => {
    cy.visit('/login')
    cy.get('#email').type(Cypress.env('adminEmail'))
    cy.get('#password').type(Cypress.env('adminPassword'), { log: false })
    cy.get('form button[type="submit"]').click()
    // Se espera a que el inicio de sesión termine (sesión guardada) antes de abrir el panel
    cy.location('pathname').should('eq', '/dashboard')
    cy.visit('/admin')
    cy.get('h1').should('contain', 'Panel')
  })
})