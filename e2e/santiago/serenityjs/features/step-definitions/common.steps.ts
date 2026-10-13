import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { Actor, actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';

import { Messages } from '../../test/questions/Messages';
import { Customer, TestData } from '../../test/support/testData';
import { StartApiSession } from '../../test/tasks/api/ApiSession';
import { BanViaApi, RegisterAccount } from '../../test/tasks/api/UsersApi';
import { LogIn, TryToLogIn } from '../../test/tasks/LogIn';

// ── Preparar datos por la API (más rápido y estable que por la interfaz) ──

Given('{customer} tiene una cuenta de cliente', async (customer: Customer) => {
  await actorCalled(customer.firstName).attemptsTo(
    RegisterAccount.of(customer),
  );
});

Given('{customer} tiene una cuenta de cliente suspendida por {string}', async (customer: Customer, reason: string) => {
  await actorCalled(customer.firstName).attemptsTo(
    RegisterAccount.of(customer),
  );
  await actorCalled('Ana').attemptsTo(
    StartApiSession.asAdministrator(),
    BanViaApi.user(customer).because(reason),
    Ensure.that(LastResponse.status(), equals(200)),
  );
});

// ── Iniciar sesión por la interfaz ──

Given('{actor} inició sesión como administradora', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.asAdministrator());
});

Given('{actor} inició sesión', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.as(TestData.customer(actor.name)));
});

When('{actor} inicia sesión', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.as(TestData.customer(actor.name)));
});

When('{actor} intenta iniciar sesión', async (actor: Actor) => {
  await actor.attemptsTo(TryToLogIn.as(TestData.customer(actor.name)));
});

Then('{pronoun} ve el mensaje {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(Ensure.eventually(Messages.loginError(), equals(message)));
});

Then('{pronoun} ve el saludo {string}', async (actor: Actor, greeting: string) => {
  await actor.attemptsTo(Ensure.eventually(Messages.greeting(), equals(greeting)));
});

Then('{pronoun} ve la página {string}', async (actor: Actor, title: string) => {
  await actor.attemptsTo(Ensure.eventually(Messages.pageTitle(), equals(title)));
});

// ── API ──

Given('{actor} inició sesión en la API como administradora', async (actor: Actor) => {
  await actor.attemptsTo(StartApiSession.asAdministrator());
});

Given('{actor} inició sesión en la API', async (actor: Actor) => {
  await actor.attemptsTo(StartApiSession.as(TestData.customer(actor.name)));
});

Then('la respuesta HTTP tiene estado {int}', async (status: number) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(LastResponse.status(), equals(status)),
  );
});

Then('el error de la API dice {string}', async (message: string) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(Messages.apiError(), equals(message)),
  );
});
