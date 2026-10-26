import { Expectation, type Question } from './question'

/** Una tarea (Task): lo que un actor HACE. Agrupa varios pasos con nombre propio. */
export type Task = (actor: Actor) => void

/** La libreta del actor: lo que anota para usarlo después (el token, la última respuesta...). */
class Notes {
  private readonly values = new Map<string, unknown>()

  set(key: string, value: unknown): void {
    this.values.set(key, value)
  }

  get<T>(key: string): T {
    if (!this.values.has(key)) throw new Error(`El actor no tiene anotado "${key}"`)
    return this.values.get(key) as T
  }
}

// Cypress tiene un solo navegador por prueba. Para que dos actores no
// compartan sesión (Ana, administradora, y Carlos, un cliente), cuando el
// navegador pasa de uno a otro se borra lo que guardó el anterior, como si
// fueran dos personas en dos computadores.
let personAtTheBrowser: string | undefined
const cast = new Map<string, Actor>()

export class Actor {
  readonly notes = new Notes()

  constructor(readonly name: string) {}

  attemptsTo(...tasks: Task[]): this {
    for (const task of tasks) task(this)
    return this
  }

  sees<T>(question: Question<T>): Expectation<T> {
    return new Expectation(question)
  }

  /** Lee ahora lo que muestra la pantalla (por ejemplo, para anotarlo y comparar después). */
  reads<T>(question: Question<T>): Cypress.Chainable<T> {
    return question.locate().then(($elements) => question.read($elements)) as unknown as Cypress.Chainable<T>
  }

  /** Se llama antes de usar el navegador: si lo tenía otro actor, se limpia su sesión. */
  takesTheBrowser(): void {
    cy.wrap(null, { log: false }).then(() => {
      if (personAtTheBrowser !== undefined && personAtTheBrowser !== this.name) {
        cy.clearAllLocalStorage()
        cy.clearAllSessionStorage()
        cy.clearAllCookies()
      }
      personAtTheBrowser = this.name
    })
  }
}

/** El actor con ese nombre (el mismo en toda la prueba). */
export const actorCalled = (name: string): Actor => {
  let actor = cast.get(name)
  if (!actor) {
    actor = new Actor(name)
    cast.set(name, actor)
  }
  return actor
}

/** Se llama antes de cada prueba: empieza un reparto nuevo y nadie tiene el navegador. */
export const resetCast = (): void => {
  cast.clear()
  personAtTheBrowser = undefined
}
