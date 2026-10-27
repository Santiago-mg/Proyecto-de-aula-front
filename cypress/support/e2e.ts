import './comandos'

// Cada prueba empieza sin sesión guardada.
beforeEach(() => {
  cy.clearAllLocalStorage()
  cy.clearAllSessionStorage()
})
