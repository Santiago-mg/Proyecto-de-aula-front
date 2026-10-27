/// <reference types="cypress" />

// Accesibilidad (WCAG 2.1 A y AA) con axe-core en un navegador real, sobre las
// pantallas de las 6 funcionalidades. A diferencia de la prueba con jsdom
// (test/escenarios/accesibilidad-axe.test.tsx), aquí axe SÍ evalúa el contraste
// de color, porque el navegador calcula los estilos.

interface Violacion {
  id: string
  impact: string | null
  help: string
  nodes: Array<{ target: string[] }>
}

/** Inyecta axe-core (la copia instalada en node_modules) y audita la página. */
function auditar(pantalla: string) {
  cy.readFile('node_modules/axe-core/axe.min.js', { log: false }).then((fuente: string) => {
    cy.window({ log: false }).then((w) => {
      ;(w as unknown as { eval(codigo: string): void }).eval(fuente)
    })
  })
  cy.window({ log: false })
    .then((w) =>
      (w as unknown as { axe: { run(ctx: Document, opts: object): Promise<{ violations: Violacion[] }> } }).axe.run(w.document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      }),
    )
    .then(({ violations }) => {
      // Evidencia legible en el log y en la consola de Cypress
      violations.forEach((v) =>
        Cypress.log({ name: 'axe', message: `${v.impact ?? ''} ${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}` }),
      )
      expect(violations.map((v) => `${v.id} (${v.nodes.length})`), `violaciones WCAG en ${pantalla}`).to.deep.equal([])
    })
}

describe('Accesibilidad — Registro de usuario', () => {
  it('formulario vacío', () => {
    cy.visit('/register')
    cy.get('#name').should('be.visible')
    auditar('registro')
  })

  it('formulario con errores y requisitos de contraseña a medias', () => {
    cy.visit('/register')
    cy.get('#email').type('ana@empresa.com')
    cy.get('#password').type('medellin2026')
    cy.contains('button', 'Crear cuenta gratis').click()
    cy.get('#email-error').should('be.visible')
    auditar('registro con errores')
  })
})

describe('Accesibilidad — Inicio de sesión', () => {
  it('formulario', () => {
    cy.visit('/login')
    cy.get('#email').should('be.visible')
    auditar('login')
  })

  it('con el error de credenciales', () => {
    cy.visit('/login')
    cy.get('#email').type(Cypress.env('adminEmail'))
    cy.get('#password').type('NoEsLaClave1')
    cy.get('form button[type="submit"]').click()
    cy.get('[role="alert"]').should('contain', 'Credenciales inválidas')
    auditar('login con error')
  })
})

describe('Accesibilidad — Gestión de perfil y cuenta', () => {
  beforeEach(() => {
    cy.registrarPorApi({ nombre: 'Ana Pérez' }).then((sesion) => {
      cy.visit('/login')
      cy.iniciarSesionEnNavegador(sesion)
    })
  })

  it('Mi cuenta', () => {
    cy.visit('/dashboard')
    cy.contains('h1', 'Hola, Ana').should('be.visible')
    auditar('mi cuenta')
  })

  it('Mi perfil, con la contraseña nueva a medio escribir', () => {
    cy.visit('/profile')
    cy.get('#newPassword').type('Abc')
    auditar('mi perfil')
  })
})

describe('Accesibilidad — Control de roles', () => {
  it('Acceso no autorizado', () => {
    cy.registrarPorApi().then((sesion) => {
      cy.visit('/login')
      cy.iniciarSesionEnNavegador(sesion)
    })
    cy.visit('/admin')
    cy.contains('h1', 'Acceso no autorizado').should('be.visible')
    auditar('no autorizado')
  })
})

describe('Accesibilidad — Alertas de stock bajo', () => {
  it('panel de alertas del administrador', () => {
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
      email: Cypress.env('adminEmail'),
      password: Cypress.env('adminPassword'),
    }).then(({ body }) => {
      cy.visit('/login')
      cy.window().then((w) => {
        w.localStorage.setItem('cp_token', body.data.token)
        w.localStorage.setItem('cp_user', JSON.stringify(body.data.user))
      })
    })
    cy.visit('/admin/alerts')
    cy.get('#alertas-lista, #alertas-vacio').should('be.visible')
    auditar('alertas de stock')
  })
})

