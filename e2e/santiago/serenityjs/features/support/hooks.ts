import { After, Before } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';

import { StartApiSession } from '../../test/tasks/api/ApiSession';
import { DeletePhoneViaApi } from '../../test/tasks/api/PhonesApi';
import { TestData } from '../../test/support/testData';

// Cada escenario empieza con sus propios datos (otro Carlos, otro celular).
Before(() => TestData.reset());

// Los celulares que publicó el escenario se borran al terminar, pase o falle,
// para no dejar basura en el catálogo ni cambiar lo que ven otros escenarios.
After(async () => {
  const phones = TestData.phonesToRemove();
  if (phones.length === 0) return;
  await actorCalled('Ana').attemptsTo(
    StartApiSession.asAdministrator(),
    ...phones.map(phone => DeletePhoneViaApi.called(phone)),
  );
});
