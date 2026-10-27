/// <reference types="cypress" />
import type { Actor, Pregunta } from './actor'

const pregunta = <T>(descripcion: string, fn: (actor: Actor) => Cypress.Chainable<T>): Pregunta<T> => ({
  descripcion,
  respondidaPor: fn,
})

export const LaRutaActual = () => pregunta('la ruta actual', () => cy.location('pathname'))

export const ElTitulo = () => pregunta('el título principal', () => cy.get('h1').first().invoke('text'))

export const ElErrorDelCampo = (id: string) =>
  pregunta(`el error del campo ${id}`, () => cy.get(`#${id}-error`).invoke('text'))

export const ElMensajeDeError = () => pregunta('el mensaje de error', () => cy.get('[role="alert"]').first().invoke('text'))

export const ElAvisoDeSesion = () => pregunta('el aviso de sesión en Ingresar', () => cy.get('p.cp-flash[role="status"]').invoke('text'))

export const ElValorDelCampo = (selector: string) =>
  pregunta(`el valor de ${selector}`, () => cy.get(selector).invoke('val') as Cypress.Chainable<string>)

export const ElRequisito = (id: string) =>
  pregunta(`el requisito ${id}`, () => cy.get(`[data-regla="${id}"]`).invoke('attr', 'data-cumple') as Cypress.Chainable<string>)

export const ElAviso = () => pregunta('la notificación', () => cy.get('[data-testid="toast"]').invoke('text'))

export const LaRespuestaDeLaApi = () =>
  pregunta('la última respuesta de la API', (actor) => actor.recordado<Cypress.Response<{ data?: unknown; error?: string }>>('respuesta'))

/** Cuántas alertas muestra la pantalla (0 si aparece el aviso de que no hay). */
export const LasAlertasEnPantalla = () =>
  pregunta('las alertas en pantalla', () =>
    cy.get('#alertas-lista, #alertas-vacio').then(($el) => ($el.is('#alertas-vacio') ? 0 : $el.find('[data-testid="alerta"]').length)),
  )
