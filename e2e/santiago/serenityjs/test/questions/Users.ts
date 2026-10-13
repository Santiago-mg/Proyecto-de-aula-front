import { Question } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';
import { Text } from '@serenity-js/web';

import { Customer } from '../support/testData';
import { UsersPage } from '../ui/UsersPage';
import { TextAsWritten } from './TextAsWritten';

interface UsersResponse {
  data: Array<{ email: string }>;
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const toNumber = (text: string) => Number.parseInt(text, 10);

/** ESC-26, 27 y 28: lo que muestra la tabla de /admin/users */
export const UsersTable = {
  emails: () => Text.ofAll(UsersPage.emails()).describedAs('correos de la tabla'),
  statusOf: (customer: Customer) => TextAsWritten.of(UsersPage.status(customer.email)),
  banReasonOf: (customer: Customer) => Text.of(UsersPage.banReason(customer.email)).trim(),
  roleOf: (customer: Customer) => TextAsWritten.of(UsersPage.role(customer.email)),
  // Mientras busca, la página cambia la tabla por "Cargando usuarios...". Ese
  // momento se cuenta como -1 para no confundir "cargando" con "sin resultados".
  numberOfRows: () => Question.about('cantidad de filas de la tabla', async actor => {
    const tableIsShown = await actor.answer(UsersPage.table().isPresent());
    return tableIsShown ? actor.answer(UsersPage.rows().count()) : -1;
  }),
  // "12 usuarios registrados" → 12
  totalShown: () => Text.of(UsersPage.total()).as(toNumber).describedAs('total de usuarios en pantalla'),
};

/** Lo que respondió la API en la última consulta de usuarios. */
export const UsersApiResponse = {
  total: () => LastResponse.body<UsersResponse>().meta.total,
  totalPages: () => LastResponse.body<UsersResponse>().meta.totalPages,
  numberOfUsers: () => Question.about('usuarios en la respuesta',
    async actor => (await actor.answer(LastResponse.body<UsersResponse>())).data.length),
};
