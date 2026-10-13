import { By, PageElement } from '@serenity-js/web'

export const LoginForm = {
  emailInput: PageElement.located(By.css('input[type="email"]'))
    .describedAs('campo de correo'),
  passwordInput: PageElement.located(By.css('input[type="password"]'))
    .describedAs('campo de contraseña'),
  loginButton: PageElement.located(By.css('button[type="submit"]'))
    .describedAs('botón de iniciar sesión')
}