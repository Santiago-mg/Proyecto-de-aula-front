import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { Actor, actorInTheSpotlight, notes, Question } from '@serenity-js/core';

import { Statistics } from '../../test/questions/Statistics';
import { StartApiSession } from '../../test/tasks/api/ApiSession';
import { GetStatistics } from '../../test/tasks/api/StatisticsApi';
import { OpenPage, TryToOpen } from '../../test/tasks/OpenPage';

interface StatisticsNotes {
  bannedBefore: number;
}

When('{pronoun} abre el panel principal', async (actor: Actor) => {
  await actor.attemptsTo(OpenPage.adminDashboard());
});

Then('el indicador {string} muestra el total de usuarios de la API', async (label: string) => {
  await actorInTheSpotlight().attemptsTo(
    StartApiSession.asAdministrator(),
    GetStatistics.viaApi(),
    Ensure.eventually(Statistics.indicator(label), equals(Statistics.fromTheApi().users.total)),
  );
});

Then('el indicador {string} muestra el total de celulares de la API', async (label: string) => {
  await actorInTheSpotlight().attemptsTo(
    StartApiSession.asAdministrator(),
    GetStatistics.viaApi(),
    Ensure.eventually(Statistics.indicator(label), equals(Statistics.fromTheApi().phones.total)),
  );
});

Given('{pronoun} anota cuántos usuarios baneados muestran las estadísticas', async (actor: Actor) => {
  await actor.attemptsTo(
    OpenPage.statistics(),
    notes<StatisticsNotes>().set('bannedBefore', Statistics.value('Baneados')),
  );
});

Then('las estadísticas muestran un usuario baneado más', async () => {
  const oneMoreThanBefore = Question.about('los baneados de antes más uno', async actor =>
    (await actor.answer(notes<StatisticsNotes>().get('bannedBefore'))) + 1);

  await actorInTheSpotlight().attemptsTo(
    OpenPage.statistics(),
    Ensure.eventually(Statistics.value('Baneados'), equals(oneMoreThanBefore)),
  );
});

When('{pronoun} intenta abrir el panel de administración', async (actor: Actor) => {
  await actor.attemptsTo(TryToOpen.page('/admin', 'el panel de administración'));
});

When('{pronoun} consulta las estadísticas por la API', async (actor: Actor) => {
  await actor.attemptsTo(GetStatistics.viaApi());
});

Then('la respuesta trae los ingresos de 7 días', async () => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(Statistics.fromTheApi().revenueByDay.length, equals(7)),
  );
});
