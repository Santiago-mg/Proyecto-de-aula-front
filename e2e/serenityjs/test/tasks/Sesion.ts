import { Interaction, Masked, Task, Wait } from '@serenity-js/core';
import { BrowseTheWeb, Clear, Click, Enter, Navigate, Scroll } from '@serenity-js/web';
import { equals, isPresent } from '@serenity-js/assertions';

import { url } from '../support/config';
import { Currently } from '../questions/Preguntas';
import { LoginPage, Menu, ProfilePage, RegisterPage } from '../ui/Pages';

/** Abre una ruta de la aplicación (por ejemplo "/login"). */
export const Visit = {
  path: (ruta: string) => Task.where(`#actor abre ${ ruta }`, Navigate.to(url(ruta))),
};

/** Borra lo que el navegador recuerda de la sesión, para empezar de cero. */
export const ClearSession = Interaction.where('#actor borra la sesión del navegador', async actor => {
  const page = await BrowseTheWeb.as(actor).currentPage();
  await page.executeScript(() => { localStorage.clear(); sessionStorage.clear(); });
});

/** Deja un token inválido guardado: lo que pasaría si la sesión se corrompe o venció. */
export const CorruptSession = Interaction.where('#actor corrompe el token de su sesión', async actor => {
  const page = await BrowseTheWeb.as(actor).currentPage();
  await page.executeScript(() => localStorage.setItem('cp_token', 'token.falso.invalido'));
});

/**
 * Espera a que el campo exista y se desplaza hasta él.
 *
 * No se usa isVisible(): en Serenity exige que el elemento esté DENTRO de la ventana, y los
 * formularios largos (como el de cambiar la contraseña, en la parte baja del perfil) quedan
 * fuera de ella hasta que la persona baja. Una persona baja; la prueba también.
 */
const campoListo = (campo: ReturnType<typeof LoginPage.correo>) => [
  Wait.until(campo, isPresent()),
  Scroll.to(campo),
];

const escribir = (campo: ReturnType<typeof LoginPage.correo>, valor: string, oculto = false) => [
  Clear.theValueOf(campo),
  Enter.theValue(oculto ? Masked.valueOf(valor) : valor).into(campo),
];

export const Register = {
  as: (datos: { nombre: string; correo: string; contrasena: string; confirmacion?: string }) => Task.where(
    `#actor se registra como "${ datos.correo }"`,
    // Con la sesión iniciada, /register redirige a /dashboard (comportamiento correcto de la
    // aplicación): se borra la sesión antes, para que cada escenario empiece de cero.
    Visit.path('/register'),
    ClearSession,
    Visit.path('/register'),
    ...campoListo(RegisterPage.nombre()),
    ...escribir(RegisterPage.nombre(), datos.nombre),
    ...escribir(RegisterPage.correo(), datos.correo),
    ...escribir(RegisterPage.contrasena(), datos.contrasena, true),
    ...escribir(RegisterPage.confirmacion(), datos.confirmacion ?? datos.contrasena, true),
    Click.on(RegisterPage.crearCuenta()),
  ),
};

export const LogIn = {
  with: (correo: string, contrasena: string) => Task.where(
    `#actor inicia sesión con "${ correo }"`,
    // Igual que en el registro: /login también redirige a /dashboard si ya hay sesión.
    Visit.path('/login'),
    ClearSession,
    Visit.path('/login'),
    ...campoListo(LoginPage.correo()),
    ...escribir(LoginPage.correo(), correo),
    ...escribir(LoginPage.contrasena(), contrasena, true),
    Click.on(LoginPage.ingresar()),
  ),
};

export const LogOut = Task.where(
  '#actor cierra sesión',
  Click.on(Menu.salir()),
  Wait.until(Currently.path(), equals('/login')),
);

export const EditProfileName = {
  to: (nombre: string) => Task.where(
    `#actor cambia su nombre a "${ nombre }"`,
    Visit.path('/profile'),
    ...campoListo(ProfilePage.nombre()),
    ...escribir(ProfilePage.nombre(), nombre),
    Click.on(ProfilePage.guardarCambios()),
  ),
};

export const ChangePassword = {
  from: (actual: string) => ({
    to: (nueva: string, confirmacion = nueva) => Task.where(
      '#actor cambia su contraseña',
      Visit.path('/profile'),
      ...campoListo(ProfilePage.contrasenaActual()),
      ...escribir(ProfilePage.contrasenaActual(), actual, true),
      ...escribir(ProfilePage.contrasenaNueva(), nueva, true),
      ...escribir(ProfilePage.confirmacionNueva(), confirmacion, true),
      Click.on(ProfilePage.cambiarContrasena()),
    ),
  }),
};