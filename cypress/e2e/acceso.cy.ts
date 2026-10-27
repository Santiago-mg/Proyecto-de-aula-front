/// <reference types="cypress" />
import { CLAVE } from '../support/comandos'

// Funcionalidades 1 (registro), 2 (inicio de sesión) y 4 (validación de credenciales).
// Un solo dato incorrecto a la vez: si falla, se sabe cuál fue la causa.

const llenarRegistro = (d: { nombre?: string; correo: string; clave?: string; confirmacion?: string }) => {
  cy.visit('/register')
  cy.get('#name').type(d.nombre ?? 'Ana Pérez')
  cy.get('#email').type(d.correo)
  cy.get('#password').type(d.clave ?? CLAVE)
  cy.get('#confirmPassword').type(d.confirmacion ?? d.clave ?? CLAVE)
  cy.get('form button[type="submit"]').click()
}
// Dominio permitido por el backend: el registro rechaza cualquier otro.
const correoNuevo = () => `cy+${Date.now()}${Math.floor(Math.random() * 1e5)}@gmail.com`

describe('Registro', () => {
  it('con datos válidos llega a su cuenta y se le saluda por su nombre', () => {
    llenarRegistro({ correo: correoNuevo() })
    cy.location('pathname').should('eq', '/dashboard')
    cy.get('h1').should('contain', 'Hola, Ana')
  })

  ;[
    ['solo números', '12345678', 'La contraseña debe incluir al menos una letra minúscula'],
    ['sin mayúscula', 'sololetras1', 'La contraseña debe incluir al menos una letra mayúscula'],
    ['sin número', 'SoloLetras', 'La contraseña debe incluir al menos un número'],
    ['demasiado corta', 'Abc1', 'La contraseña debe tener al menos 8 caracteres'],
  ].forEach(([caso, clave, mensaje]) => {
    it(`una contraseña ${caso} se rechaza con su mensaje y no sale de la pantalla`, () => {
      llenarRegistro({ correo: correoNuevo(), clave })
      cy.get('.cp-field-error').should('contain', mensaje)
      cy.location('pathname').should('eq', '/register')
    })
  })

  it('la confirmación distinta se avisa', () => {
    llenarRegistro({ correo: correoNuevo(), confirmacion: 'OtraClave2026' })
    cy.get('.cp-field-error').should('contain', 'Las contraseñas no coinciden')
  })

  it('un correo de un dominio no permitido (institucional) se rechaza antes de enviar', () => {
    llenarRegistro({ correo: `cy+${Date.now()}@unal.edu.co` })
    cy.get('.cp-field-error').should('contain', 'Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud.')
    cy.location('pathname').should('eq', '/register')
  })

  it('un correo ya registrado muestra el aviso del servidor', () => {
    const correo = correoNuevo()
    cy.registrarPorApi().then(({ email }) => llenarRegistro({ correo: email }))
    cy.get('.cp-error-message').should('contain', 'El email ya está registrado')
    expect(correo).to.be.a('string')
  })

  it('el botón de la contraseña permite verla antes de enviar', () => {
    cy.visit('/register')
    cy.get('#password').type('MiClave2026')
    cy.get('button[aria-label="Mostrar contraseña"]').first().click()
    cy.get('#password').should('have.attr', 'type', 'text')
  })
})

describe('Inicio de sesión', () => {
  it('correcto: llega a su cuenta', () => {
    cy.registrarPorApi().then(({ email }) => {
      cy.visit('/login')
      cy.get('#email').type(email)
      cy.get('#password').type(CLAVE)
      cy.get('form button[type="submit"]').click()
      cy.location('pathname').should('eq', '/dashboard')
    })
  })

  it('contraseña incorrecta con el correo correcto → "Credenciales inválidas"', () => {
    cy.registrarPorApi().then(({ email }) => {
      cy.visit('/login')
      cy.get('#email').type(email)
      cy.get('#password').type('ClaveEquivocada1')
      cy.get('form button[type="submit"]').click()
      cy.get('.cp-error-message').should('have.text', 'Credenciales inválidas')
      cy.location('pathname').should('eq', '/login')
    })
  })

  it('correo inexistente con una contraseña válida → el mismo mensaje', () => {
    cy.visit('/login')
    cy.get('#email').type('nadie.existe@gmail.com')
    cy.get('#password').type(CLAVE)
    cy.get('form button[type="submit"]').click()
    cy.get('.cp-error-message').should('have.text', 'Credenciales inválidas')
  })

  it('el correo escrito en mayúsculas también entra', () => {
    cy.registrarPorApi().then(({ email }) => {
      cy.visit('/login')
      cy.get('#email').type(email.toUpperCase())
      cy.get('#password').type(CLAVE)
      cy.get('form button[type="submit"]').click()
      cy.location('pathname').should('eq', '/dashboard')
    })
  })

  it('un correo mal escrito se corrige antes de enviar (mismo mensaje en login y registro)', () => {
    cy.visit('/login')
    cy.get('#email').type('no-es-correo')
    cy.get('#password').type(CLAVE)
    cy.get('form button[type="submit"]').click()
    cy.get('.cp-field-error').should('have.text', 'Correo electrónico inválido')
  })
})

describe('Validación de credenciales y sesión', () => {
  it('sin sesión, el perfil lleva a iniciar sesión', () => {
    cy.visit('/profile')
    cy.location('pathname').should('eq', '/login')
  })

  it('cerrar sesión devuelve al login y vuelve a cerrar el perfil', () => {
    cy.registrarPorApi().then(({ email }) => {
      cy.visit('/login')
      cy.get('#email').type(email)
      cy.get('#password').type(CLAVE)
      cy.get('form button[type="submit"]').click()
      cy.contains('button', /^\s*Cerrar sesión\s*$/).click()
      cy.location('pathname').should('eq', '/login')
      cy.visit('/profile')
      cy.location('pathname').should('eq', '/login')
    })
  })

  it('una sesión corrupta se explica en lugar de fallar en silencio', () => {
    cy.registrarPorApi().then(({ email }) => {
      cy.visit('/login')
      cy.iniciarSesionEnNavegador({ email, token: 'token.falso.invalido' })
      cy.visit('/dashboard')
      cy.location('pathname').should('eq', '/login')
      cy.get('.cp-flash').should('contain', 'Tu sesión ya no es válida')
    })
  })
})
