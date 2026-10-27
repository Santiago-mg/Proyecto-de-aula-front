/// <reference types="cypress" />
import type { Habilidad } from './actor'

/** Navegar el frontend (baseUrl de Cypress). */
export class NavegarLaWeb implements Habilidad {
  readonly nombreHabilidad = 'navegar la web'
  static conCypress() {
    return new NavegarLaWeb()
  }
  visitar(ruta: string) {
    return cy.visit(ruta)
  }
}

/** Llamar a la API REST del backend (env apiUrl). */
export class LlamarALaApi implements Habilidad {
  readonly nombreHabilidad = 'llamar a la API'
  private constructor(private readonly base: string) {}
  static en(base: string) {
    return new LlamarALaApi(base)
  }
  pedir(metodo: string, ruta: string, opciones: { cuerpo?: Cypress.RequestBody; token?: string } = {}) {
    return cy.request({
      method: metodo,
      url: `${this.base}${ruta}`,
      body: opciones.cuerpo,
      headers: opciones.token ? { Authorization: `Bearer ${opciones.token}` } : undefined,
      failOnStatusCode: false,
    })
  }
}
