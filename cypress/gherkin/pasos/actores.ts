/// <reference types="cypress" />
import { Before } from '@badeball/cypress-cucumber-preprocessor'
import { Actor } from '../screenplay/actor'
import { LlamarALaApi, NavegarLaWeb } from '../screenplay/habilidades'

// Elenco: cada escenario empieza con actores nuevos (sin datos recordados).
let elenco = new Map<string, Actor>()
let enFoco: Actor | undefined

Before(() => {
  elenco = new Map()
  enFoco = undefined
})

/** El actor con ese nombre (se crea la primera vez) pasa a estar en foco. */
export function actor(nombre: string): Actor {
  let a = elenco.get(nombre)
  if (!a) {
    a = Actor.llamado(nombre).puede(NavegarLaWeb.conCypress(), LlamarALaApi.en(Cypress.env('apiUrl') as string))
    elenco.set(nombre, a)
  }
  enFoco = a
  return a
}

/** Para pasos sin nombre ("Y ve el mensaje…"): el último actor que actuó. */
export function actorEnFoco(): Actor {
  if (!enFoco) throw new Error('Ningún actor ha actuado todavía en este escenario')
  return enFoco
}
