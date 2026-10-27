/// <reference types="cypress" />
import type { Actividad, Actor } from './actor'
import { Escribir, PedirALaApi, Pulsar, Visitar } from './interacciones'

const tarea = (fn: (actor: Actor) => void): Actividad => ({ ejecutarComo: fn })

export interface DatosDeCuenta {
  nombre: string
  correo: string
  clave: string
  confirmacion?: string
}

export const CrearCuenta = {
  con: (d: DatosDeCuenta) =>
    tarea((actor) =>
      actor.intentaQue(
        Visitar.la('/register'),
        Escribir.elTexto(d.nombre).en('#name'),
        Escribir.elTexto(d.correo).en('#email'),
        Escribir.elTexto(d.clave).en('#password'),
        Escribir.elTexto(d.confirmacion ?? d.clave).en('#confirmPassword'),
        Pulsar.elBoton('Crear cuenta gratis'),
      ),
    ),
}

export const IniciarSesion = {
  con: (correo: string, clave: string) =>
    tarea((actor) =>
      actor.intentaQue(
        Visitar.la('/login'),
        Escribir.elTexto(correo).en('#email'),
        Escribir.elTexto(clave).en('#password'),
        Pulsar.elBoton('Ingresar'),
      ),
    ),
}

/** Cuenta nueva creada por API y sesión puesta en el navegador (preparación rápida). */
export const TenerUnaCuentaDeCliente = {
  llamada: (nombre: string) =>
    tarea((actor) => {
      cy.registrarPorApi({ nombre }).then((sesion) => {
        actor.recuerda('cuenta', sesion)
        actor.recuerda('token', sesion.token)
        cy.visit('/login')
        cy.iniciarSesionEnNavegador({ ...sesion, nombre })
      })
    }),
}

/** Login real por API como administrador; usuario y token quedan en el navegador. */
export const TenerSesionDeAdministrador = tarea((actor) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
    email: Cypress.env('adminEmail'),
    password: Cypress.env('adminPassword'),
  }).then(({ body }) => {
    const { token, user } = body.data as { token: string; user: unknown }
    actor.recuerda('token', token)
    cy.visit('/login')
    cy.window().then((w) => {
      w.localStorage.setItem('cp_token', token)
      w.localStorage.setItem('cp_user', JSON.stringify(user))
    })
  })
})

/** Sesión guardada con un token que el backend no acepta (expirado o alterado). */
export const TenerUnaSesionInvalida = tarea(() => {
  cy.visit('/login')
  cy.window().then((w) => {
    w.localStorage.setItem('cp_token', 'token.alterado.invalido')
    w.localStorage.setItem('cp_user', JSON.stringify({ id: 'x', name: 'Ana', email: 'ana@gmail.com', role: 'USER' }))
  })
})

export const CambiarSuNombre = {
  a: (nombre: string) =>
    tarea((actor) =>
      actor.intentaQue(Visitar.la('/profile'), Escribir.elTexto(nombre).en('#profile-name'), Pulsar.elBoton('Guardar cambios')),
    ),
}

export const EditarSuNombreSinGuardar = {
  a: (nombre: string) => tarea((actor) => actor.intentaQue(Visitar.la('/profile'), Escribir.elTexto(nombre).en('#profile-name'))),
}

export const CambiarSuContrasena = {
  de: (actual: string) => ({
    a: (nueva: string) =>
      tarea((actor) =>
        actor.intentaQue(
          Visitar.la('/profile'),
          Escribir.elTexto(actual).en('#currentPassword'),
          Escribir.elTexto(nueva).en('#newPassword'),
          Escribir.elTexto(nueva).en('#confirmNewPassword'),
          Pulsar.elBoton('Cambiar contraseña'),
        ),
      ),
  }),
}

export const ConsultarLasAlertasPorApi = tarea((actor) =>
  actor.intentaQue(PedirALaApi.con('GET', '/admin/alerts', 'respuesta', { tokenRecordado: 'token' })),
)
