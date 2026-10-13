import { LastResponse } from '@serenity-js/rest';
import { Text } from '@serenity-js/web';

import { CommonPage } from '../ui/CommonPage';
import { LoginPage } from '../ui/LoginPage';

/** Mensajes que ve el usuario o que devuelve la API. */
export const Messages = {
  loginError: () => Text.of(LoginPage.errorMessage()).describedAs('mensaje del inicio de sesión'),
  greeting: () => Text.of(CommonPage.greeting()).describedAs('saludo'),
  pageTitle: () => Text.of(CommonPage.mainHeading()).describedAs('título de la página'),
  apiError: () => LastResponse.body<{ error: string }>().error,
};
