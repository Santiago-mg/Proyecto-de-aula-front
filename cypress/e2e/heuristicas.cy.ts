/// <reference types="cypress" />
import { CLAVE } from '../support/comandos'

// Correcciones de la evaluación heurística consolidada (Nielsen + Tognazzini).
// Cada bloque nombra la heurística y el hallazgo que verifica.

describe('H10 — Ayuda donde se necesita', () => {
  it('Ingresar enlaza a la guía "No puedo ingresar"', () => {
    cy.visit('/login')
    cy.contains('a', 'Centro de ayuda').click()
    cy.location('pathname').should('eq', '/ayuda')
    cy.location('hash').should('eq', '#guia-no-puedo-ingresar')
    cy.contains('h3', 'No puedo ingresar').should('be.visible')
  })

  it('el centro de ayuda tiene FAQ con ejemplos, guías, garantías, atajos y contacto', () => {
    cy.visit('/ayuda')
    ;['Preguntas frecuentes', 'Resolver problemas', 'Garantías', 'Atajos de teclado', 'Contacto'].forEach((t) =>
      cy.contains('h2', t).should('exist'),
    )
    cy.contains('summary', '¿Cómo debe ser mi contraseña?').click()
    cy.contains('li', 'Medellin2026 — cumple').should('be.visible')
  })

  it('H4: "Garantías" del pie lleva a las garantías, no al catálogo', () => {
    cy.visit('/catalog')
    cy.get('footer').contains('a', 'Garantías').click()
    cy.location('pathname').should('eq', '/ayuda')
    cy.location('hash').should('eq', '#garantias')
  })
})

describe('H1 — Visibilidad del estado', () => {
  it('cada pantalla nombra su pestaña', () => {
    cy.visit('/login')
    cy.title().should('eq', 'Ingresar · CelularPro')
    cy.visit('/register')
    cy.title().should('eq', 'Crear cuenta · CelularPro')
  })

  it('"Mi cuenta" queda marcado en el menú dentro del perfil', () => {
    cy.registrarPorApi().then(({ email, token }) => {
      cy.visit('/login')
      cy.iniciarSesionEnNavegador({ email, token })
      cy.visit('/profile')
      cy.contains('a', 'Mi cuenta').should('have.attr', 'aria-current', 'page')
    })
  })

  it('desde Ingresar hay salida visible a la tienda', () => {
    cy.visit('/login')
    cy.contains('a', '← Volver a la tienda').click()
    cy.location('pathname').should('eq', '/')
  })
})

describe('H5 / H8 — Prevención de errores en el registro', () => {
  it('los requisitos de la contraseña se marcan mientras se escribe', () => {
    cy.visit('/register')
    cy.get('[data-regla="mayuscula"]').should('have.attr', 'data-cumple', 'false')
    cy.get('#password').type('Medellin2026')
    ;['largo', 'mayuscula', 'minuscula', 'numero'].forEach((id) =>
      cy.get(`[data-regla="${id}"]`).should('have.attr', 'data-cumple', 'true'),
    )
  })

  it('el campo de correo dice qué dominios se aceptan antes de enviar', () => {
    cy.visit('/register')
    cy.get('#email-hint').should('contain', 'Gmail, Outlook, Hotmail, Yahoo o iCloud')
  })
})

describe('H3 — Control y libertad en Mi perfil', () => {
  it('"Descartar cambios" devuelve el nombre guardado sin llamar al servidor', () => {
    cy.registrarPorApi({ nombre: 'Ana Pérez' }).then(({ email }) => {
      cy.visit('/login')
      cy.get('#email').type(email)
      cy.get('#password').type(CLAVE)
      cy.get('form button[type="submit"]').click()
      cy.location('pathname').should('eq', '/dashboard')
      cy.visit('/profile')
      cy.intercept('PATCH', '**/auth/me').as('guardar')
      cy.contains('button', 'Descartar cambios').should('be.disabled')
      cy.get('#profile-name').clear().type('Otro Nombre')
      cy.contains('button', 'Descartar cambios').should('be.enabled').click()
      cy.get('#profile-name').should('have.value', 'Ana Pérez')
      cy.get('@guardar.all').should('have.length', 0)
    })
  })
})

describe('H6 — Atajos de teclado', () => {
  // Se espera a que el catálogo termine de montarse antes de pulsar la tecla: con el servidor de
  // desarrollo de Vite, cy.visit puede terminar antes de que React registre el atajo.
  const abrirCatalogo = () => {
    cy.visit('/catalog')
    cy.get('#filtro-buscar').should('be.visible')
    cy.focused().should('not.exist')
  }

  it('"?" abre la ayuda en la sección de atajos', () => {
    abrirCatalogo()
    cy.get('body').type('?')
    cy.location('pathname').should('eq', '/ayuda')
    cy.location('hash').should('eq', '#atajos')
  })

  it('"/" lleva el foco a la búsqueda del catálogo', () => {
    abrirCatalogo()
    cy.get('body').type('/')
    cy.focused().should('have.id', 'filtro-buscar')
  })
})

describe('H11 — Fallos ajenos', () => {
  it('si los pedidos no cargan, Mi cuenta lo dice y ofrece "Reintentar"', () => {
    cy.registrarPorApi().then(({ email, token }) => {
      cy.intercept('GET', '**/orders/my', { forceNetworkError: true }).as('pedidos')
      cy.visit('/login')
      cy.iniciarSesionEnNavegador({ email, token })
      cy.visit('/dashboard')
      cy.get('[role="alert"]').should('contain', 'No hay conexión con el servidor')
      cy.contains('Todavía no tienes pedidos').should('not.exist')
      cy.intercept('GET', '**/orders/my', { body: { data: [] } })
      cy.contains('button', 'Reintentar').click()
      cy.contains('Todavía no tienes pedidos').should('be.visible')
    })
  })
})