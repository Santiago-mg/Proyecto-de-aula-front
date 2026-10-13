import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, isPresent, not } from '@serenity-js/assertions';
import { Actor, actorInTheSpotlight } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';
import { isVisible } from '@serenity-js/web';

import { CatalogAdmin } from '../../test/questions/Catalog';
import { PhoneDetail } from '../../test/questions/Recommendations';
import { TestData } from '../../test/support/testData';
import { StartApiSession } from '../../test/tasks/api/ApiSession';
import { DeletePhoneViaApi, FindPhoneViaApi, PublishPhoneViaApi } from '../../test/tasks/api/PhonesApi';
import { ChangePrice, DeletePhone, PublishPhone, TryToPublishPhone } from '../../test/tasks/ManageCatalog';
import { OpenPage } from '../../test/tasks/OpenPage';
import { PhoneDetailPage } from '../../test/ui/PhoneDetailPage';

// ── Web ──

When('{pronoun} publica el celular de prueba desde el formulario', async (actor: Actor) => {
  await actor.attemptsTo(PublishPhone.fromTheForm(TestData.phone()));
});

Then('{pronoun} ve el celular de prueba en la gestión del catálogo', async (actor: Actor) => {
  await actor.attemptsTo(
    OpenPage.catalogManagement(),
    Ensure.eventually(CatalogAdmin.rowOf(TestData.phone().name), isPresent()),
  );
});

Then('{actor} ve el celular de prueba en la tienda con el precio {string}', async (actor: Actor, price: string) => {
  const phone = TestData.phone();
  await actor.attemptsTo(
    OpenPage.phoneDetail(phone.slug),
    Ensure.eventually(PhoneDetail.name(), equals(phone.name)),
    Ensure.eventually(PhoneDetail.price(), equals(price)),
  );
});

Given('{actor} publicó por la API el celular de prueba', async (actor: Actor) => {
  await actor.attemptsTo(
    StartApiSession.asAdministrator(),
    PublishPhoneViaApi.forTheScenario(TestData.phone()),
  );
});

When('{pronoun} cambia el precio del celular de prueba a {int}', async (actor: Actor, price: number) => {
  await actor.attemptsTo(ChangePrice.of(TestData.phone()).to(price));
});

When('{pronoun} elimina el celular de prueba', async (actor: Actor) => {
  await actor.attemptsTo(DeletePhone.called(TestData.phone()));
});

Then('{pronoun} ya no ve el celular de prueba en la gestión del catálogo', async (actor: Actor) => {
  await actor.attemptsTo(
    OpenPage.catalogManagement(),
    Ensure.that(CatalogAdmin.rowOf(TestData.phone().name), not(isPresent())),
  );
});

Then('{actor} ve {string} al abrir la ficha del celular de prueba', async (actor: Actor, notice: string) => {
  await actor.attemptsTo(
    OpenPage.phoneDetail(TestData.phone().slug),
    Ensure.eventually(PhoneDetailPage.notice(notice), isVisible()),
  );
});

When('{pronoun} intenta publicar el celular de prueba con el slug {string}', async (actor: Actor, slug: string) => {
  await actor.attemptsTo(TryToPublishPhone.fromTheForm({ ...TestData.phone(), slug }));
});

Then('{pronoun} ve el error {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(Ensure.eventually(CatalogAdmin.formError(), equals(message)));
});

// ── API ──

When('{pronoun} publica el celular de prueba por la API', async (actor: Actor) => {
  await actor.attemptsTo(PublishPhoneViaApi.called(TestData.phone()));
});

When('{pronoun} elimina el celular de prueba por la API', async (actor: Actor) => {
  await actor.attemptsTo(DeletePhoneViaApi.called(TestData.phone()));
});

Then('el celular de prueba ya no existe en la API', async () => {
  await actorInTheSpotlight().attemptsTo(
    FindPhoneViaApi.withSlug(TestData.phone().slug),
    Ensure.that(LastResponse.status(), equals(404)),
  );
});

When('{actor} intenta publicar el celular de prueba sin iniciar sesión', async (actor: Actor) => {
  await actor.attemptsTo(PublishPhoneViaApi.withoutLoggingIn(TestData.phone()));
});
