/**
 * Preguntas (Questions) del patrón Screenplay: lo que un actor MIRA en la
 * pantalla. Una pregunta sabe dónde buscar (`locate`) y cómo leer lo que
 * encontró (`read`); la verificación (`actor.sees(pregunta).toEqual(...)`) se
 * repite sola hasta que se cumple o se acaba el tiempo, igual que
 * `Ensure.eventually` en Serenity/JS.
 */

type Located = Cypress.Chainable<JQuery<HTMLElement>>

export interface Question<T> {
  readonly description: string
  locate(): Located
  read($elements: JQuery<HTMLElement>): T
}

/** El texto tal como está escrito en el HTML, con los espacios normalizados. */
export const norm = (text: string | null | undefined): string => (text ?? '').replace(/\s+/g, ' ').trim()

/** El texto del primer elemento que encuentra. */
export function textOf(description: string, locate: () => Located): Question<string>
export function textOf<T>(description: string, locate: () => Located, convert: (text: string) => T): Question<T>
export function textOf<T>(description: string, locate: () => Located, convert?: (text: string) => T): Question<T | string> {
  return {
    description,
    locate,
    read: ($elements) => {
      const text = norm($elements.first().text())
      return convert ? convert(text) : text
    },
  }
}

/** Los textos de todos los elementos que encuentra, en orden. */
export const textsOf = (description: string, locate: () => Located): Question<string[]> => ({
  description,
  locate,
  read: ($elements) => $elements.toArray().map((element) => norm(element.textContent)),
})

/** Cuántas filas tiene el cuerpo de una tabla (la tabla tiene que existir). */
export const rowsInTable = (description: string, locateTable: () => Located): Question<number> => ({
  description,
  locate: locateTable,
  read: ($table) => $table.find('tbody tr').length,
})

/** Lo que se espera de una pregunta; se reintenta hasta que se cumple. */
export class Expectation<T> {
  constructor(private readonly question: Question<T>) {}

  toEqual(expected: T | (() => T)): void {
    const { question } = this
    question.locate().should(($elements) => {
      const wanted = typeof expected === 'function' ? (expected as () => T)() : expected
      expect(question.read($elements), question.description).to.deep.equal(wanted)
    })
  }

  toInclude(item: unknown): void {
    const { question } = this
    question.locate().should(($elements) => {
      expect(question.read($elements), question.description).to.include(item)
    })
  }

  toNotInclude(item: unknown): void {
    const { question } = this
    question.locate().should(($elements) => {
      expect(question.read($elements), question.description).to.not.include(item)
    })
  }

  toBePresent(): void {
    this.question.locate().should('exist')
  }

  toBeVisible(): void {
    this.question.locate().should('be.visible')
  }

  toBeAbsent(): void {
    this.question.locate().should('not.exist')
  }

  toBeDisabled(): void {
    this.question.locate().should('be.disabled')
  }
}
