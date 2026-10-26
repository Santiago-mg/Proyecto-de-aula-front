import type { Actor } from '../screenplay/actor'

/** Lo que respondió la API la última vez que este actor le preguntó algo. */
export interface ApiResponse {
  status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
}

export const lastResponseOf = (actor: Actor): ApiResponse => actor.notes.get<ApiResponse>('lastResponse')

/**
 * Verificaciones sobre la última respuesta de la API. Se anotan en la misma
 * cola de Cypress, así que corren después de la petición que las precede.
 */
export const theResponseTo = (actor: Actor) => {
  const verifier = {
    hasStatus(status: number) {
      cy.wrap(null, { log: false }).then(() => {
        expect(lastResponseOf(actor).status, 'estado HTTP de la respuesta').to.equal(status)
      })
      return verifier
    },
    hasError(message: string) {
      cy.wrap(null, { log: false }).then(() => {
        expect(lastResponseOf(actor).body.error, 'error de la API').to.equal(message)
      })
      return verifier
    },
    satisfies(description: string, check: (body: ApiResponse['body']) => void) {
      cy.wrap(null, { log: false }).then(() => {
        try {
          check(lastResponseOf(actor).body)
        } catch (error) {
          throw new Error(`${description}: ${(error as Error).message}`)
        }
      })
      return verifier
    },
  }
  return verifier
}
