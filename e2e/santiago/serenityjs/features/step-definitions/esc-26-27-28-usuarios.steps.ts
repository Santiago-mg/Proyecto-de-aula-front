import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, isPresent, not } from '@serenity-js/assertions';
import { Actor, actorInTheSpotlight, Question, Wait } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';
import { isEnabled, isVisible } from '@serenity-js/web';

import { UsersApiResponse, UsersTable } from '../../test/questions/Users';
import { environment } from '../../test/support/environment';
import { Customer } from '../../test/support/testData';
import { StartApiSession } from '../../test/tasks/api/ApiSession';
import { BanViaApi, ListUsersViaApi, UnbanViaApi } from '../../test/tasks/api/UsersApi';
import { BanUser, SearchUsers, StartBanning, UnbanUser } from '../../test/tasks/ManageUsers';
import { OpenPage, TryToOpen } from '../../test/tasks/OpenPage';
import { BanModal, UsersPage } from '../../test/ui/UsersPage';

interface UserResponse {
  data: { banned: boolean; banReason: string | null; bannedAt: string | null };
}

const userInTheResponse = () => Question.about('usuario de la respuesta', async actor => {
  const { banned, banReason, bannedAt } = (await actor.answer(LastResponse.body<UserResponse>())).data;
  return { banned, banReason, bannedAt: bannedAt === null ? null : 'con fecha' };
});

// ── ESC-26: banear ──

When('{pronoun} banea a {customer} con el motivo {string}', async (actor: Actor, customer: Customer, reason: string) => {
  await actor.attemptsTo(BanUser.called(customer).because(reason));
});

Then('{pronoun} ve a {customer} con estado {string} y motivo {string}', async (
  actor: Actor,
  customer: Customer,
  status: string,
  reason: string,
) => {
  await actor.attemptsTo(
    Ensure.eventually(UsersTable.statusOf(customer), equals(status)),
    Ensure.eventually(UsersTable.banReasonOf(customer), equals(reason)),
  );
});

When('{pronoun} empieza a banear a {customer} con el motivo {string}', async (actor: Actor, customer: Customer, reason: string) => {
  await actor.attemptsTo(StartBanning.user(customer).withReason(reason));
});

Then('{pronoun} no puede confirmar el baneo', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(BanModal.confirmButton(), not(isEnabled())));
});

When('{pronoun} busca su propio correo en la gestión de usuarios', async (actor: Actor) => {
  await actor.attemptsTo(
    OpenPage.userManagement(),
    SearchUsers.for(environment.admin.email),
  );
});

Then('{pronoun} ve su propia fila marcada como suya y sin el botón para banear', async (actor: Actor) => {
  await actor.attemptsTo(
    Ensure.eventually(UsersPage.ownAccountMark(environment.admin.email), isVisible()),
    Ensure.that(UsersPage.banButton(environment.admin.email), not(isPresent())),
  );
});

When('{pronoun} banea a {customer} por la API con el motivo {string}', async (actor: Actor, customer: Customer, reason: string) => {
  await actor.attemptsTo(BanViaApi.user(customer).because(reason));
});

Then('la respuesta indica que el usuario quedó baneado por {string}', async (reason: string) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(userInTheResponse(), equals({ banned: true, banReason: reason, bannedAt: 'con fecha' })),
  );
});

// ── ESC-27: desbanear ──

When('{pronoun} desbanea a {customer}', async (actor: Actor, customer: Customer) => {
  await actor.attemptsTo(UnbanUser.called(customer));
});

Then('{pronoun} ve a {customer} con estado {string} y sin motivo de baneo', async (
  actor: Actor,
  customer: Customer,
  status: string,
) => {
  await actor.attemptsTo(
    Ensure.eventually(UsersTable.statusOf(customer), equals(status)),
    Ensure.that(UsersPage.banReason(customer.email), not(isPresent())),
  );
});

When('{pronoun} desbanea a {customer} por la API', async (actor: Actor, customer: Customer) => {
  await actor.attemptsTo(UnbanViaApi.user(customer));
});

When('{pronoun} desbanea por la API al usuario {string}', async (actor: Actor, id: string) => {
  await actor.attemptsTo(UnbanViaApi.userWithId(id));
});

Then('la respuesta indica que el usuario quedó activo y sin motivo de baneo', async () => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(userInTheResponse(), equals({ banned: false, banReason: null, bannedAt: null })),
  );
});

// ── ESC-28: consultar ──

When('{pronoun} abre la gestión de usuarios', async (actor: Actor) => {
  await actor.attemptsTo(OpenPage.userManagement());
});

Then('{pronoun} ve el mismo total de usuarios que reporta la API', async (actor: Actor) => {
  await actor.attemptsTo(
    StartApiSession.asAdministrator(),
    ListUsersViaApi.page(1, 1),
    Ensure.eventually(UsersTable.totalShown(), equals(UsersApiResponse.total())),
  );
});

When('{pronoun} busca el correo de {customer} en la gestión de usuarios', async (actor: Actor, customer: Customer) => {
  await actor.attemptsTo(
    OpenPage.userManagement(),
    SearchUsers.for(customer.email),
  );
});

When('{pronoun} busca {string} en la gestión de usuarios', async (actor: Actor, term: string) => {
  await actor.attemptsTo(
    OpenPage.userManagement(),
    SearchUsers.for(term),
  );
});

Then('{pronoun} ve únicamente a {customer} en la tabla', async (actor: Actor, customer: Customer) => {
  await actor.attemptsTo(
    // Primero se espera a que la tabla termine de filtrar: el buscador espera
    // 400 ms y vuelve a pintar las filas. Si se leen los correos mientras se
    // repinta (con 20 filas en la página), la lectura se queda esperando una
    // fila que ya no existe. Con pocos usuarios en la base el problema no se veía.
    Wait.until(UsersTable.numberOfRows(), equals(1)),
    Ensure.eventually(UsersTable.emails(), equals([customer.email])),
  );
});

Then('{pronoun} ve a {customer} con rol {string} y estado {string}', async (
  actor: Actor,
  customer: Customer,
  role: string,
  status: string,
) => {
  await actor.attemptsTo(
    Ensure.eventually(UsersTable.roleOf(customer), equals(role)),
    Ensure.eventually(UsersTable.statusOf(customer), equals(status)),
  );
});

Then('{pronoun} no ve ningún usuario en la tabla', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.eventually(UsersTable.numberOfRows(), equals(0)));
});

When('{pronoun} intenta abrir la gestión de usuarios', async (actor: Actor) => {
  await actor.attemptsTo(TryToOpen.page('/admin/users', 'la gestión de usuarios'));
});

When('{pronoun} consulta por la API la página {int} de usuarios de a {int}', async (actor: Actor, page: number, limit: number) => {
  await actor.attemptsTo(ListUsersViaApi.page(page, limit));
});

Then('la respuesta trae {int} usuario y tantas páginas como usuarios registrados', async (users: number) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(UsersApiResponse.numberOfUsers(), equals(users)),
    Ensure.that(UsersApiResponse.totalPages(), equals(UsersApiResponse.total())),
  );
});

When('{actor} consulta los usuarios sin iniciar sesión', async (actor: Actor) => {
  await actor.attemptsTo(ListUsersViaApi.withoutLoggingIn());
});
