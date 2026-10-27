/// <reference types="cypress" />
import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { Pulsar, Visitar } from '../screenplay/interacciones'
import { Escribir } from '../screenplay/interacciones'
import {
  CambiarSuContrasena,
  CambiarSuNombre,
  ConsultarLasAlertasPorApi,
  CrearCuenta,
  EditarSuNombreSinGuardar,
  IniciarSesion,
  TenerSesionDeAdministrador,
  TenerUnaCuentaDeCliente,
  TenerUnaSesionInvalida,
} from '../screenplay/tareas'
import {
  ElAviso,
  ElAvisoDeSesion,
  ElErrorDelCampo,
  ElMensajeDeError,
  ElRequisito,
  ElTitulo,
  ElValorDelCampo,
  LaRespuestaDeLaApi,
  LaRutaActual,
  LasAlertasEnPantalla,
} from '../screenplay/preguntas'
import { actor, actorEnFoco } from './actores'

// ── Dado ─────────────────────────────────────────────────────────────────────
Given('que {word} visita la tienda', (nombre: string) => {
  actor(nombre).intentaQue(Visitar.la('/'))
})

Given('que {word} tiene una cuenta de cliente', (nombre: string) => {
  actor(nombre).intentaQue(TenerUnaCuentaDeCliente.llamada('Ana Pérez'))
})

Given('que {word} tiene sesión de administrador', (nombre: string) => {
  actor(nombre).intentaQue(TenerSesionDeAdministrador)
})

Given('que {word} tiene una sesión con un token inválido', (nombre: string) => {
  actor(nombre).intentaQue(TenerUnaSesionInvalida)
})

// ── Cuando ───────────────────────────────────────────────────────────────────
When('{word} crea una cuenta con un correo nuevo de {string} y la contraseña {string}', (nombre: string, dominio: string, clave: string) => {
  const correo = `gherkin+${Date.now()}@${dominio}`
  actor(nombre).intentaQue(CrearCuenta.con({ nombre: 'Ana Pérez', correo, clave }))
})

When(
  '{word} intenta registrarse con el correo {string}, la contraseña {string} y la confirmación {string}',
  (nombre: string, correo: string, clave: string, confirmacion: string) => {
    actor(nombre).intentaQue(CrearCuenta.con({ nombre: 'Ana Pérez', correo, clave, confirmacion }))
  },
)

When('{word} inicia sesión con las credenciales del administrador', (nombre: string) => {
  actor(nombre).intentaQue(IniciarSesion.con(Cypress.env('adminEmail'), Cypress.env('adminPassword')))
})

When('{word} inicia sesión con su correo en mayúsculas', (nombre: string) => {
  actor(nombre).intentaQue(IniciarSesion.con(String(Cypress.env('adminEmail')).toUpperCase(), Cypress.env('adminPassword')))
})

When('{word} inicia sesión con la contraseña {string}', (nombre: string, clave: string) => {
  actor(nombre).intentaQue(IniciarSesion.con(Cypress.env('adminEmail'), clave))
})

When('{word} cambia su nombre a {string}', (nombre: string, nuevo: string) => {
  actor(nombre).intentaQue(CambiarSuNombre.a(nuevo))
})

When('{word} edita su nombre a {string} sin guardar', (nombre: string, nuevo: string) => {
  actor(nombre).intentaQue(EditarSuNombreSinGuardar.a(nuevo))
})

When('{word} pulsa {string}', (nombre: string, boton: string) => {
  actor(nombre).intentaQue(Pulsar.elBoton(boton))
})

When('{word} cambia su contraseña de {string} a {string}', (nombre: string, actual: string, nueva: string) => {
  actor(nombre).intentaQue(CambiarSuContrasena.de(actual).a(nueva))
})

When('{word} escribe la contraseña {string} en el registro', (nombre: string, clave: string) => {
  actor(nombre).intentaQue(Visitar.la('/register'), Escribir.elTexto(clave).en('#password'))
})

When('{word} abre {string}', (nombre: string, ruta: string) => {
  actor(nombre).intentaQue(Visitar.la(ruta))
})

When('{word} abre el panel de alertas', (nombre: string) => {
  actor(nombre).intentaQue(Visitar.la('/admin/alerts'))
})

When('{word} consulta las alertas de stock por la API', (nombre: string) => {
  actor(nombre).intentaQue(ConsultarLasAlertasPorApi)
})

// ── Entonces ─────────────────────────────────────────────────────────────────
Then('{word} llega a {string}', (nombre: string, ruta: string) => {
  actor(nombre).pregunta(LaRutaActual()).should('eq', ruta)
})

Then('{word} sigue en {string}', (nombre: string, ruta: string) => {
  actor(nombre).pregunta(LaRutaActual()).should('eq', ruta)
})

Then('el título dice {string}', (titulo: string) => {
  actorEnFoco().pregunta(ElTitulo()).should('eq', titulo)
})

Then('el campo {string} muestra el error {string}', (campo: string, mensaje: string) => {
  actorEnFoco().pregunta(ElErrorDelCampo(campo)).should('eq', mensaje)
})

Then('ve el mensaje de error {string}', (mensaje: string) => {
  actorEnFoco().pregunta(ElMensajeDeError()).should('contain', mensaje)
})

Then('ve la notificación {string}', (mensaje: string) => {
  actorEnFoco().pregunta(ElAviso()).should('contain', mensaje)
})

Then('ve el aviso {string}', (mensaje: string) => {
  actorEnFoco().pregunta(ElAvisoDeSesion()).should('contain', mensaje)
})

Then('el campo {string} vale {string}', (selector: string, valor: string) => {
  actorEnFoco().pregunta(ElValorDelCampo(selector)).should('eq', valor)
})

Then('el requisito {string} está {string}', (id: string, estado: string) => {
  actorEnFoco().pregunta(ElRequisito(id)).should('eq', estado === 'cumplido' ? 'true' : 'false')
})

Then('la API responde {int} con {string}', (codigo: number, mensaje: string) => {
  actorEnFoco()
    .pregunta(LaRespuestaDeLaApi())
    .then((r) => {
      expect(r.status).to.eq(codigo)
      expect(r.body.error).to.eq(mensaje)
    })
})

Then('la pantalla muestra tantas alertas como devuelve la API', () => {
  const a = actorEnFoco()
  a.pregunta(LaRespuestaDeLaApi()).then((r) => {
    expect(r.status).to.eq(200)
    const total = (r.body.data as unknown[]).length
    a.pregunta(LasAlertasEnPantalla()).should('eq', total)
  })
})

Then('todas las alertas son de tipo {string} u {string}', (tipo1: string, tipo2: string) => {
  actorEnFoco()
    .pregunta(LaRespuestaDeLaApi())
    .then((r) => {
      for (const alerta of r.body.data as Array<{ type: string }>) expect([tipo1, tipo2]).to.include(alerta.type)
    })
})
