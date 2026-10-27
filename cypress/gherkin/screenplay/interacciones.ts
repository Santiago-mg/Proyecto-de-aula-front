/// <reference types="cypress" />
import type { Actividad, Actor } from './actor'
import { LlamarALaApi, NavegarLaWeb } from './habilidades'

const actividad = (fn: (actor: Actor) => void): Actividad => ({ ejecutarComo: fn })

export const Visitar = {
  la: (ruta: string) => actividad((actor) => void actor.usar(NavegarLaWeb).visitar(ruta)),
}

export const Escribir = {
  elTexto: (texto: string) => ({
    en: (selector: string) =>
      actividad(() => {
        cy.get(selector).clear()
        if (texto) cy.get(selector).type(texto, { delay: 0 })
      }),
  }),
}

export const Pulsar = {
  elBoton: (texto: string) => actividad(() => void cy.contains('button', new RegExp(`^\\s*${texto}\\s*$`)).click()),
  elEnlace: (texto: string) => actividad(() => void cy.contains('a', texto).click()),
}

/** Petición a la API; la respuesta queda recordada por el actor con `clave`. */
export const PedirALaApi = {
  con: (metodo: string, ruta: string, clave: string, opciones: { cuerpo?: Cypress.RequestBody; tokenRecordado?: string } = {}) =>
    actividad((actor) => {
      const enviar = (token?: string) =>
        actor
          .usar(LlamarALaApi)
          .pedir(metodo, ruta, { cuerpo: opciones.cuerpo, token })
          .then((r) => actor.recuerda(clave, r))
      if (opciones.tokenRecordado) actor.recordado<string>(opciones.tokenRecordado).then((t) => enviar(t))
      else enviar()
    }),
}
