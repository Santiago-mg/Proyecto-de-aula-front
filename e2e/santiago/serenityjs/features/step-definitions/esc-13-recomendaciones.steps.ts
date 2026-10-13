import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, isPresent, not } from '@serenity-js/assertions';
import { Actor, actorInTheSpotlight, Question, Wait } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';

import { PhoneDetail, Recommendations } from '../../test/questions/Recommendations';
import { TestData } from '../../test/support/testData';
import { StartApiSession } from '../../test/tasks/api/ApiSession';
import { GetRecommendations, PublishPhoneViaApi } from '../../test/tasks/api/PhonesApi';
import { OpenPage } from '../../test/tasks/OpenPage';
import { OpenRecommendation } from '../../test/tasks/Recommendations';
import { PhoneDetailPage } from '../../test/ui/PhoneDetailPage';

// ── Web ──

Given('{actor} abre la ficha del celular {string}', async (actor: Actor, slug: string) => {
  await actor.attemptsTo(OpenPage.phoneDetail(slug));
});

Then('{pronoun} ve en {string} los celulares:', async (actor: Actor, _section: string, table: DataTable) => {
  await actor.attemptsTo(
    Ensure.eventually(Recommendations.names(), equals(table.raw().flat())),
  );
});

When('{pronoun} abre la recomendación {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(OpenRecommendation.called(name));
});

Then('{pronoun} ve la ficha del {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(Ensure.eventually(PhoneDetail.name(), equals(name)));
});

Then('entre las recomendaciones aparece {string}', async (name: string) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.eventually(Recommendations.names(), contain(name)),
  );
});

Then('entre las recomendaciones no aparece {string}', async (name: string) => {
  await actorInTheSpotlight().attemptsTo(
    // Primero que carguen, para no dar por buena una lista que todavía no llegó.
    // (isPresent y no isVisible: la sección queda más abajo del borde de la
    // pantalla, y para Serenity/JS "visible" es "a la vista sin hacer scroll").
    Wait.until(PhoneDetailPage.recommendations(), isPresent()),
    Ensure.that(Recommendations.names(), not(contain(name))),
  );
});

Given('{actor} publicó por la API un celular parecido al {string} con stock {int}', async (
  actor: Actor,
  _model: string,
  stock: number,
) => {
  await actor.attemptsTo(
    StartApiSession.asAdministrator(),
    PublishPhoneViaApi.forTheScenario(TestData.phoneSimilarToTheIphone15ProMax(stock)),
  );
});

Then('el celular publicado aparece entre las recomendaciones', async () => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.eventually(Recommendations.names(), contain(TestData.phone().name)),
  );
});

Then('el celular publicado no aparece entre las recomendaciones', async () => {
  await actorInTheSpotlight().attemptsTo(
    Wait.until(PhoneDetailPage.recommendations(), isPresent()),
    Ensure.that(Recommendations.names(), not(contain(TestData.phone().name))),
  );
});

// ── API ──

When('{actor} consulta las recomendaciones del celular {string}', async (actor: Actor, slug: string) => {
  await actor.attemptsTo(GetRecommendations.for(slug));
});

When('{actor} consulta {int} recomendaciones del celular {string}', async (actor: Actor, limit: number, slug: string) => {
  await actor.attemptsTo(GetRecommendations.forWithLimit(slug, limit));
});

Then('la respuesta trae los celulares {string}', async (names: string) => {
  const namesInTheResponse = Question.about('celulares de la respuesta', async actor =>
    (await actor.answer(LastResponse.body<{ data: Array<{ name: string }> }>())).data.map(phone => phone.name));

  await actorInTheSpotlight().attemptsTo(
    Ensure.that(namesInTheResponse, equals(names.split(', '))),
  );
});
