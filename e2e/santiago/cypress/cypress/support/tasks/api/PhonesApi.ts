import type { Task } from '../../screenplay/actor'
import type { TestPhone } from '../../screenplay/testData'
import { lastResponseOf } from '../../questions/Api'
import { send } from './ApiSession'

const bodyOf = (phone: TestPhone) => ({
  name: phone.name,
  slug: phone.slug,
  brand: phone.brand,
  categoryId: phone.categoryId,
  price: phone.price,
  stock: phone.stock,
  condition: 'NEW',
})

/** ESC-30 por la API. Necesita una sesión de API iniciada (StartApiSession). */
export const PublishPhoneViaApi = {
  called:
    (phone: TestPhone): Task =>
    (actor) => {
      send(actor, 'POST', 'phones', { body: bodyOf(phone), authenticated: true })
    },
  // Para preparar datos: además comprueba que quedó publicado.
  forTheScenario:
    (phone: TestPhone): Task =>
    (actor) => {
      send(actor, 'POST', 'phones', { body: bodyOf(phone), authenticated: true }).then(() => {
        expect(lastResponseOf(actor).status, 'estado HTTP al publicar').to.equal(201)
        phone.id = lastResponseOf(actor).body.data.id as string
      })
    },
  withoutLoggingIn:
    (phone: TestPhone): Task =>
    (actor) => {
      send(actor, 'POST', 'phones', { body: bodyOf(phone) })
    },
}

export const FindPhoneViaApi = {
  withSlug:
    (slug: string): Task =>
    (actor) => {
      send(actor, 'GET', `phones/${slug}`)
    },
}

/** Borra el celular si existe. Lo usa la limpieza después de cada prueba. */
export const DeletePhoneViaApi = {
  called:
    (phone: TestPhone): Task =>
    (actor) => {
      FindPhoneViaApi.withSlug(phone.slug)(actor)
      cy.wrap(null, { log: false }).then(() => {
        const found = lastResponseOf(actor)
        if (found.status === 200) {
          return send(actor, 'DELETE', `phones/${found.body.data.id as string}`, { authenticated: true })
        }
        return undefined
      })
    },
}

/** ESC-13 por la API (es pública: no necesita sesión). */
export const GetRecommendations = {
  for:
    (slug: string): Task =>
    (actor) => {
      send(actor, 'GET', `phones/${slug}/similares`)
    },
  forWithLimit:
    (slug: string, limit: number): Task =>
    (actor) => {
      send(actor, 'GET', `phones/${slug}/similares?limit=${limit}`)
    },
}
