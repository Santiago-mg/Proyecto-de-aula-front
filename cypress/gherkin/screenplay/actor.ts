/// <reference types="cypress" />
// Patrón Screenplay sobre Cypress.
//
//   Actor        quién usa el sistema (Ana, cliente; Admin, administrador)
//   Habilidad    lo que el actor puede usar: navegar la web, llamar a la API
//   Interacción  una acción mínima: visitar, escribir, pulsar, pedir a la API
//   Tarea        una meta de negocio hecha de interacciones: crear cuenta, iniciar sesión
//   Pregunta     lo que el actor consulta para verificar: ruta, saludo, error, alertas
//
// Cypress encola comandos, así que ejecutarComo() solo los programa en orden y
// las preguntas devuelven un Chainable sobre el que los pasos Entonces afirman.

export interface Actividad {
  ejecutarComo(actor: Actor): void
}

export interface Pregunta<T> {
  descripcion: string
  respondidaPor(actor: Actor): Cypress.Chainable<T>
}

export interface Habilidad {
  readonly nombreHabilidad: string
}

// Basta con el prototype: las habilidades usan constructores privados y fábricas estáticas
type ClaseDeHabilidad<H extends Habilidad> = Function & { prototype: H }

export class Actor {
  private readonly habilidades: Habilidad[] = []

  private constructor(readonly nombre: string) {}

  static llamado(nombre: string): Actor {
    return new Actor(nombre)
  }

  puede(...habilidades: Habilidad[]): Actor {
    this.habilidades.push(...habilidades)
    return this
  }

  usar<H extends Habilidad>(clase: ClaseDeHabilidad<H>): H {
    const h = this.habilidades.find((x) => x instanceof clase)
    if (!h) throw new Error(`${this.nombre} no tiene la habilidad ${clase.name}`)
    return h as H
  }

  intentaQue(...actividades: Actividad[]): Actor {
    for (const a of actividades) a.ejecutarComo(this)
    return this
  }

  pregunta<T>(pregunta: Pregunta<T>): Cypress.Chainable<T> {
    return pregunta.respondidaPor(this)
  }

  /** Guarda un dato para pasos posteriores (alias de Cypress con el nombre del actor). */
  recuerda(clave: string, valor: unknown): void {
    cy.wrap(valor, { log: false }).as(`${this.nombre}-${clave}`)
  }

  recordado<T>(clave: string): Cypress.Chainable<T> {
    return cy.get<T>(`@${this.nombre}-${clave}`)
  }
}
