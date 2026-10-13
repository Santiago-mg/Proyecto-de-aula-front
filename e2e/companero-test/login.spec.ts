import { test } from '@serenity-js/playwright-test'
import { Ensure, equals, includes, contain } from '@serenity-js/assertions'
import { Text, Page } from '@serenity-js/web'
import { Navegar } from './tasks/Navegar'
import { Wait } from '@serenity-js/core'
import { IniciarSesion } from './tasks/IniciarSesion'
import { LoginPage } from './ui/LoginPage'

test.describe('Funcionalidad: Iniciar Sesión', () => {

  test('muestra errores de validación si el email es inválido', async ({ actorCalled }) => {
    await actorCalled('Cliente').attemptsTo(
      Navegar.alLogin(),
      
      // Intentamos con un correo que no tiene "@" ni ".com"
      IniciarSesion.conCredenciales('correo-malo', '123'),

      // Verificamos que el esquema de Zod detenga el formulario y muestre el error exacto
      Ensure.that(
        Text.ofAll(LoginPage.mensajesValidacion), 
        contain('Email inválido') // Este texto viene directo de tu schema de Zod
      )
    )
  })

  test('redirige al dashboard con credenciales correctas', async ({ actorCalled }) => {
    await actorCalled('Cliente').attemptsTo(
      Navegar.alLogin(),
      
      // IMPORTANTE: Asegúrate de usar un usuario que sí exista en tu base de datos de pruebas
      IniciarSesion.conCredenciales('test@test.com', 'password123'),

      // Como tu componente hace `navigate('/dashboard')`, verificamos que la URL del navegador haya cambiado
      Wait.until(Page.current().url().pathname, equals('/dashboard'))
    )
  })

})