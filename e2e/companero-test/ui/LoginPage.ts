import { By, PageElement, PageElements } from '@serenity-js/web'

export const LoginPage = {
  // Los inputs por su ID
  emailInput: PageElement.located(By.id('email'))
    .describedAs('campo de email'),
    
  passwordInput: PageElement.located(By.id('password'))
    .describedAs('campo de contraseña'),
    
  // El botón por su tipo
  botonIngresar: PageElement.located(By.css('button[type="submit"]'))
    .describedAs('botón de ingresar'),

  // Las etiquetas rojas de Zod (pueden haber varias, por eso usamos PageElements en plural)
  mensajesValidacion: PageElements.located(By.css('.cp-field-error'))
    .describedAs('mensajes de error del formulario')
}