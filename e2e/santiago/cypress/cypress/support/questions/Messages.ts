import { textOf } from '../screenplay/question'
import { CommonPage, LoginPage } from '../ui/pages'

/** Mensajes que ve el usuario. */
export const Messages = {
  loginError: () => textOf('mensaje del inicio de sesión', LoginPage.errorMessage),
  greeting: () => textOf('saludo', CommonPage.greeting),
  pageTitle: () => textOf('título de la página', CommonPage.mainHeading),
}
