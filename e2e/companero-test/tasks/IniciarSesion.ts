import { Task } from '@serenity-js/core'
import { Click, Enter } from '@serenity-js/web'
import { LoginPage } from '../ui/LoginPage'

export const IniciarSesion = {
  conCredenciales: (email: string, password: string) => 
    Task.where(`#actor inicia sesión con ${email}`,
      Enter.theValue(email).into(LoginPage.emailInput),
      Enter.theValue(password).into(LoginPage.passwordInput),
      Click.on(LoginPage.botonIngresar)
    ),

  // Una tarea extra para probar los errores dejando todo en blanco
  intentarSinDatos: () => 
    Task.where(`#actor intenta iniciar sesión sin llenar datos`,
      Click.on(LoginPage.botonIngresar)
    )
}