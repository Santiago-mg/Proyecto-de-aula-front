import { Task, Wait } from '@serenity-js/core';
import { Clear, Click, Enter, Scroll } from '@serenity-js/web';
import { isPresent } from '@serenity-js/assertions';

import { Heuristicas, ProfilePage, RegisterPage } from '../ui/Pages';

/** Tareas que ejercitan las correcciones de la evaluación heurística. */

/** H4/H10: seguir un enlace por su texto visible. */
export const FollowLink = {
  called: (texto: string) => Task.where(
    `#actor sigue el enlace "${ texto }"`,
    Wait.until(Heuristicas.enlace(texto), isPresent()),
    Scroll.to(Heuristicas.enlace(texto)),
    Click.on(Heuristicas.enlace(texto)),
  ),
};

/** H5/H8: escribir la contraseña del registro sin enviar el formulario. */
export const TypeRegisterPassword = {
  as: (valor: string) => Task.where(
    `#actor escribe una contraseña sin enviar`,
    Wait.until(RegisterPage.contrasena(), isPresent()),
    Clear.theValueOf(RegisterPage.contrasena()),
    Enter.theValue(valor).into(RegisterPage.contrasena()),
  ),
};

/** H3: editar el nombre sin guardar y luego descartar. */
export const TypeProfileNameWithoutSaving = {
  as: (nombre: string) => Task.where(
    `#actor escribe el nombre "${ nombre }" sin guardar`,
    Wait.until(ProfilePage.nombre(), isPresent()),
    Clear.theValueOf(ProfilePage.nombre()),
    Enter.theValue(nombre).into(ProfilePage.nombre()),
  ),
};

export const DiscardProfileChanges = Task.where(
  '#actor descarta los cambios del perfil',
  Click.on(ProfilePage.descartarCambios()),
);
