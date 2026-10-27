import { MemoryRouter } from 'react-router-dom'
import { AdminAlerts } from '../../src/pages/admin/AdminAlerts'

// La página de alertas con la red simulada (cy.intercept): se prueban sus tres estados sin backend.
const alerta = (id: string, type: string, name: string, stock: number) => ({
  id, phoneId: `p-${id}`, type, message: `"${name}" tiene ${stock} unidades.`, isResolved: false,
  createdAt: '2026-10-07T14:30:00.000Z',
  phone: { id: `p-${id}`, name, slug: id, stock, minStock: 5, heroImage: null },
})
const montar = () => cy.mount(<MemoryRouter><AdminAlerts /></MemoryRouter>)

describe('AdminAlerts — estados de la página', () => {
  it('lista cada alerta con su tipo, el stock frente al mínimo y el enlace para reponer', () => {
    cy.intercept('GET', '**/admin/alerts', { body: { data: [alerta('1', 'OUT_OF_STOCK', 'Pixel 8', 0), alerta('2', 'LOW_STOCK', 'Galaxy S24', 3)] } })
    montar()
    cy.get('[data-testid="alerta"]').should('have.length', 2)
    cy.get('[data-testid="alerta"]').first().should('have.attr', 'data-alert-type', 'OUT_OF_STOCK').and('contain', 'Sin stock')
    cy.get('[data-testid="alerta"]').last().should('contain', 'Stock 3 · Mínimo 5')
    cy.get('a[aria-label="Reponer Pixel 8"]').should('have.attr', 'href', '/admin/phones/p-1/edit')
    cy.get('#alertas-resumen').should('have.text', '1 sin stock · 1 con poco stock')
  })

  it('sin alertas explica que el inventario está sano', () => {
    cy.intercept('GET', '**/admin/alerts', { body: { data: [] } })
    montar()
    cy.get('#alertas-vacio').should('contain', 'No hay alertas abiertas').and('have.attr', 'role', 'status')
    cy.get('#alertas-lista').should('not.exist')
  })

  it('si el servidor falla muestra el error y "Reintentar" las vuelve a pedir', () => {
    let llamadas = 0
    cy.intercept('GET', '**/admin/alerts', (req) => {
      llamadas += 1
      if (llamadas === 1) req.reply({ statusCode: 500, body: { error: 'Error interno del servidor' } })
      else req.reply({ body: { data: [alerta('1', 'LOW_STOCK', 'Pixel 8', 2)] } })
    })
    montar()
    // El mensaje técnico del servidor se muestra en lenguaje cotidiano (heurística H2)
    cy.get('[role="alert"]').should('have.text', 'Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.')
    cy.contains('button', 'Reintentar').click()
    cy.get('[data-testid="alerta"]').should('have.length', 1)
    cy.get('[role="alert"]').should('not.exist')
  })

  it('un nombre con HTML se muestra como texto y no se interpreta', () => {
    cy.intercept('GET', '**/admin/alerts', { body: { data: [alerta('1', 'LOW_STOCK', '<img src=x onerror=alert(1)>Pixel', 2)] } })
    montar()
    cy.get('[data-testid="alerta"]').should('contain.text', '<img src=x onerror=alert(1)>Pixel')
    cy.get('[data-testid="alerta"] img').should('not.exist')
  })
})