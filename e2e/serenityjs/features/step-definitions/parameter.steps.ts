import { defineParameterType } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';

defineParameterType({
  name: 'actor',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
  transformer: (name: string) => actorCalled(name),
});

defineParameterType({
  name: 'pronoun',
  regexp: /él|ella|ellos|ellas/,
  transformer: () => actorInTheSpotlight(),
});

// "Alicia" la primera vez que se nombra; "ella" después. Ambos son el mismo actor
// en el foco, así que un solo paso sirve para las dos formas de escribirlo.
defineParameterType({
  name: 'persona',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|él|ella|ellos|ellas/,
  transformer: (texto: string) => /^(él|ella|ellos|ellas)$/.test(texto) ? actorInTheSpotlight() : actorCalled(texto),
});
