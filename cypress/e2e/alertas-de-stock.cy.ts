/// <reference types="cypress" />

// Funcionalidad 14: el administrador se entera cuando un celular llega a su mínimo.
// La tabla de bordes: justo en el mínimo SÍ avisa, un punto por encima no.
const entrarComoAdmin = () => {
  cy.visit('/login')
  cy.get('#email').type(Cypress.env('adminEmail'))
  cy.get('#password').type(Cypress.env('adminPassword'), { log: false })
  cy.get('form button[type="submit"]').click()
  cy.location('pathname').should('eq', '/dashboard')
}

const crearCelular = (nombre: string, stock: number, minimo: number) => {
  cy.visit('/admin/phones/new')
  cy.get('#name').type(nombre)
  cy.get('#slug').type(nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  cy.get('#brand').type('Samsung')
  cy.get('#categoryId').select('samsung')
  cy.get('#price').type('2500000')
  cy.get('#stock').type(String(stock))
  cy.get('#minStock').clear().type(String(minimo))
  cy.contains('button', 'Crear celular').click()
  cy.location('pathname').should('eq', '/admin/phones')
}

describe('Alertas de stock bajo', () => {
  beforeEach(entrarComoAdmin)

  ;[
    [3, 5, 'Stock bajo'],
    [5, 5, 'Stock bajo'],     // borde: justo en el mínimo
    [0, 5, 'Sin stock'],
    [10, 12, 'Stock bajo'],   // umbral propio
  ].forEach(([stock, minimo, texto]) => {
    it(`stock ${stock} con mínimo ${minimo} → alerta "${texto}"`, () => {
      const nombre = `QA Cy ${Date.now()}`
      crearCelular(nombre, stock as number, minimo as number)
      cy.visit('/admin/alerts')
      cy.contains('[data-testid="alerta"]', nombre).should('contain', texto as string)
      cy.get('[data-testid="insignia-alertas"]').should('be.visible')
    })
  })

  it('stock 6 con mínimo 5 → NO hay alerta de ese celular', () => {
    const nombre = `QA Cy ${Date.now()}`
    crearCelular(nombre, 6, 5)
    cy.visit('/admin/alerts')
    cy.get('#alertas-lista, #alertas-vacio').should('exist')
    cy.contains('[data-testid="alerta"]', nombre).should('not.exist')
  })

  it('reponer desde la alerta cierra la alerta', () => {
    const nombre = `QA Cy ${Date.now()}`
    crearCelular(nombre, 2, 5)
    cy.visit('/admin/alerts')
    cy.get(`a[aria-label="Reponer ${nombre}"]`).click()
    cy.get('#stock').clear().type('50')
    cy.contains('button', 'Guardar cambios').click()
    cy.visit('/admin/alerts')
    cy.get('#alertas-lista, #alertas-vacio').should('exist')
    cy.contains('[data-testid="alerta"]', nombre).should('not.exist')
  })

  it('el dashboard avisa cuántas alertas hay y enlaza a la lista', () => {
    cy.visit('/admin')
    cy.get('#banner-alertas').should('contain', 'de inventario sin atender').find('a').click()
    cy.location('pathname').should('eq', '/admin/alerts')
  })

  it('un umbral negativo o un stock gigante se frenan en el formulario', () => {
    cy.visit('/admin/phones/new')
    cy.get('#minStock').clear().type('-1')
    cy.get('#stock').type('3000000000')
    cy.contains('button', 'Crear celular').click()
    cy.get('.cp-field-error').should('contain', 'No puede ser negativo').and('contain', 'No puede superar 1.000.000')
  })
})
