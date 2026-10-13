import { defineParameterType } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';

import { Customer, TestData } from '../../test/support/testData';

// Quien hace la acción: "Ana inició sesión...", "Carlos intenta...".
defineParameterType({
  name: 'actor',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
  transformer: (name: string) => actorCalled(name),
});

// "él" / "ella": el último actor que habló en el escenario.
defineParameterType({
  name: 'pronoun',
  regexp: /él|ella|ellos|ellas/,
  transformer: () => actorInTheSpotlight(),
});

// A quién se le hace la acción: "ella banea a Carlos". Es el cliente de prueba
// de ese nombre en este escenario (correo único, ver test/support/testData.ts).
defineParameterType({
  name: 'customer',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
  transformer: (name: string): Customer => TestData.customer(name),
  useForSnippets: false,
});
