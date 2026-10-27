import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, contain, equals, includes, isPresent, not } from '@serenity-js/assertions';
import { Actor, Duration, Wait, actorInTheSpotlight } from '@serenity-js/core';
import { isVisible } from '@serenity-js/web';

import { config } from '../../test/support/config';
import { contexto } from '../../test/support/contexto';
import { Alerts, Currently, Screen, Usability } from '../../test/questions/Preguntas';
import {
  DiscardProfileChanges, FollowLink, TypeProfileNameWithoutSaving, TypeRegisterPassword,
} from '../../test/tasks/Heuristicas';
import { CreatePhone, RestockFromAlert } from '../../test/tasks/Inventario';
import {
  ChangePassword, ClearSession, CorruptSession, EditProfileName, LogIn, LogOut, Register, Visit,
} from '../../test/tasks/Sesion';
import { AdminAlertsPage } from '../../test/ui/Pages';

const hasta = (segundos = 10) => Wait.upTo(Duration.ofSeconds(segundos));

// ───────────────────────── Navegación y estado de la sesión ─────────────────────────
Given('{persona} abre la página {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(Visit.path(ruta));
});

When('{persona} borra la sesión del navegador', async (actor: Actor) => {
  await actor.attemptsTo(ClearSession);
});

Given('{persona} tiene una cuenta registrada', async (actor: Actor) => {
  await actor.attemptsTo(
    Visit.path('/login'),
    ClearSession,
    Register.as({ nombre: contexto.nombre, correo: contexto.correo, contrasena: contexto.contrasena }),
    hasta().until(Currently.path(), equals('/dashboard')),
    LogOut,
  );
});

Given('{persona} tiene la sesión iniciada', async (actor: Actor) => {
  await actor.attemptsTo(
    Visit.path('/login'),
    ClearSession,
    Register.as({ nombre: contexto.nombre, correo: contexto.correo, contrasena: contexto.contrasena }),
    hasta().until(Currently.path(), equals('/dashboard')),
  );
});

Given('{persona} es administradora y ha iniciado sesión', async (actor: Actor) => {
  await actor.attemptsTo(
    Visit.path('/login'),
    ClearSession,
    LogIn.with(config.adminEmail, config.adminPassword),
    hasta().until(Currently.path(), equals('/dashboard')),
  );
});

Given('su sesión se corrompe', async () => {
  await actorInTheSpotlight().attemptsTo(CorruptSession);
});

When('{persona} cierra sesión', async (actor: Actor) => {
  await actor.attemptsTo(LogOut);
});

// ───────────────────────────────── Registro ─────────────────────────────────
When('{persona} se registra con una contraseña válida', async (actor: Actor) => {
  await actor.attemptsTo(
    ClearSession,
    Register.as({ nombre: contexto.nombre, correo: contexto.correo, contrasena: contexto.contrasena }),
  );
});

When('{persona} se registra con la contraseña {string}', async (actor: Actor, contrasena: string) => {
  await actor.attemptsTo(
    Register.as({ nombre: contexto.nombre, correo: contexto.correo, contrasena }),
  );
});

When('{persona} se registra con el correo {string}', async (actor: Actor, correo: string) => {
  await actor.attemptsTo(
    Register.as({ nombre: contexto.nombre, correo, contrasena: contexto.contrasena }),
  );
});

When('{persona} se registra confirmando con {string}', async (actor: Actor, confirmacion: string) => {
  await actor.attemptsTo(
    Register.as({ nombre: contexto.nombre, correo: contexto.correo, contrasena: contexto.contrasena, confirmacion }),
  );
});

When('{persona} intenta registrarse otra vez con el mismo correo', async (actor: Actor) => {
  await actor.attemptsTo(
    Register.as({ nombre: contexto.nombre, correo: contexto.correo, contrasena: contexto.contrasena }),
  );
});

// ─────────────────────────────── Inicio de sesión ───────────────────────────────
When('{persona} inicia sesión con su correo y su contraseña', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.with(contexto.correo, contexto.contrasena));
});

When('{persona} inicia sesión con su correo y la contraseña {string}', async (actor: Actor, contrasena: string) => {
  await actor.attemptsTo(LogIn.with(contexto.correo, contrasena));
});

When('{persona} inicia sesión con el correo {string} y su contraseña', async (actor: Actor, correo: string) => {
  await actor.attemptsTo(LogIn.with(correo, contexto.contrasena));
});

When('{persona} inicia sesión con su correo en mayúsculas y su contraseña', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.with(contexto.correo.toUpperCase(), contexto.contrasena));
});

// Límite del backend: LOGIN_MAX_INTENTOS (5 por defecto, login-limiter.middleware.ts). Antes el paso
// suponía 10, que era el límite de otra versión del backend: se detectó al ejecutar la suite.
const MAX_INTENTOS_LOGIN = Number(process.env.LOGIN_MAX_INTENTOS ?? 5);

// Cada intento fallido abre /login y espera la respuesta (el hash cuesta ~0,25 s).
When('{persona} falla {int} veces al iniciar sesión con su correo', { timeout: 180_000 }, async (actor: Actor, veces: number) => {
  for (let i = 0; i < veces; i++) {
    await actor.attemptsTo(
      LogIn.with(contexto.correo, `Equivocada${ i }Clave`),
      hasta().until(Screen.loginError(), includes(i < MAX_INTENTOS_LOGIN ? 'Credenciales inválidas' : 'Demasiados intentos')),
    );
  }
});

// ──────────────────────────────────── Perfil ────────────────────────────────────
When('{persona} cambia su nombre a {string}', async (actor: Actor, nombre: string) => {
  await actor.attemptsTo(EditProfileName.to(nombre));
});

When('{persona} cambia su contraseña por {string}', async (actor: Actor, nueva: string) => {
  await actor.attemptsTo(ChangePassword.from(contexto.contrasena).to(nueva));
  contexto.contrasena = nueva;
});

When('{persona} intenta cambiar su contraseña usando como actual {string}', async (actor: Actor, actual: string) => {
  await actor.attemptsTo(ChangePassword.from(actual).to('ClaveNueva2027'));
});

// ─────────────────────────────── Lo que la persona ve ───────────────────────────────
Then('{persona} llega a {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(hasta().until(Currently.path(), equals(ruta)));
});

Then('{persona} sigue en {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(Ensure.that(Currently.path(), equals(ruta)));
});

Then('{persona} ve el saludo {string}', async (actor: Actor, saludo: string) => {
  await actor.attemptsTo(hasta().until(Screen.headingLower(), includes(saludo.toLowerCase())));
});

Then('{persona} ve el título {string}', async (actor: Actor, titulo: string) => {
  await actor.attemptsTo(hasta().until(Screen.headingLower(), includes(titulo.toLowerCase())));
});

Then('{persona} observa el error de campo {string}', async (actor: Actor, mensaje: string) => {
  await actor.attemptsTo(hasta().until(Screen.fieldErrors(), contain(mensaje)));
});

Then('{persona} observa el mensaje de error {string}', async (actor: Actor, mensaje: string) => {
  await actor.attemptsTo(hasta().until(Screen.loginError(), includes(mensaje)));
});

Then('{persona} ve la confirmación {string}', async (actor: Actor, mensaje: string) => {
  await actor.attemptsTo(hasta().until(Screen.confirmationLower(), equals(mensaje.toLowerCase())));
});

Then('{persona} ve el aviso de sesión {string}', async (actor: Actor, mensaje: string) => {
  await actor.attemptsTo(hasta().until(Screen.sessionNotice(), equals(mensaje)));
});

// ─────────────────────────────── Alertas de stock ───────────────────────────────
function nuevoCelular(): string {
  contexto.celular = `QA Celular ${ Date.now() }`;
  return contexto.celular;
}

When('{persona} crea un celular con stock {int} y mínimo {int}', async (actor: Actor, stock: number, minimo: number) => {
  await actor.attemptsTo(CreatePhone.named(nuevoCelular()).withStock(stock).andMinimum(minimo));
});

Given('{persona} creó un celular con stock {int} y mínimo {int}', async (actor: Actor, stock: number, minimo: number) => {
  await actor.attemptsTo(CreatePhone.named(nuevoCelular()).withStock(stock).andMinimum(minimo));
});

When('{persona} repone ese celular a {int} unidades desde la alerta', async (actor: Actor, unidades: number) => {
  await actor.attemptsTo(RestockFromAlert.of(contexto.celular, unidades));
});

Then('{persona} ve que la alerta del celular es {string}', async (actor: Actor, resultado: string) => {
  // Primero se espera a que la página termine de cargar (lista o aviso de "sin alertas").
  // El título se muestra en mayúsculas (CSS): se compara sin distinguirlas.
  await actor.attemptsTo(hasta().until(Screen.headingLower(), includes('alertas de inventario')));
  await actor.attemptsTo(
    resultado === 'ninguna'
      ? Ensure.that(AdminAlertsPage.alertaDe(contexto.celular), not(isPresent()))
      : hasta().until(Alerts.of(contexto.celular), includes(resultado)),
  );
});

Then('{persona} ve la insignia de alertas en el menú', async (actor: Actor) => {
  await actor.attemptsTo(hasta().until(AdminAlertsPage.insignia(), isVisible()));
});

// ─────────────────────── Correcciones de la evaluación heurística ───────────────────────
When('{persona} sigue el enlace {string}', async (actor: Actor, texto: string) => {
  await actor.attemptsTo(FollowLink.called(texto));
});

When('{persona} escribe la contraseña {string} sin enviar', async (actor: Actor, valor: string) => {
  await actor.attemptsTo(TypeRegisterPassword.as(valor));
});

When('{persona} escribe el nombre {string} sin guardar', async (actor: Actor, nombre: string) => {
  await actor.attemptsTo(TypeProfileNameWithoutSaving.as(nombre));
});

When('{persona} descarta los cambios', async (actor: Actor) => {
  await actor.attemptsTo(DiscardProfileChanges);
});

Then('la pestaña del navegador dice {string}', async (titulo: string) => {
  await actorInTheSpotlight().attemptsTo(hasta().until(Usability.tabTitle(), equals(titulo)));
});

Then('el requisito {string} aparece {word}', async (id: string, estado: string) => {
  const esperado = estado === 'cumplido' ? 'true' : 'false';
  await actorInTheSpotlight().attemptsTo(hasta().until(Usability.requirementMet(id), equals(esperado)));
});

Then('el campo de nombre muestra {string}', async (nombre: string) => {
  await actorInTheSpotlight().attemptsTo(hasta().until(Usability.profileName(), equals(nombre)));
});
