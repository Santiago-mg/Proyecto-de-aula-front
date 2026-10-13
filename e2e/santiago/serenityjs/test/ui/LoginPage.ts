import { By, PageElement } from '@serenity-js/web';

export const LoginPage = {
  email: () => PageElement.located(By.css('#email')).describedAs('campo de correo'),
  password: () => PageElement.located(By.css('#password')).describedAs('campo de contraseña'),
  submit: () => PageElement.located(By.css('form button[type="submit"]')).describedAs('botón Ingresar'),
  // El error del servidor es el párrafo suelto del formulario; los errores de
  // cada campo llevan la clase cp-field-error.
  errorMessage: () => PageElement.located(By.css('form > p:not(.cp-field-error)'))
    .describedAs('mensaje de error del inicio de sesión'),
};
