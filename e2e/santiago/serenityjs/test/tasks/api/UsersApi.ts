import { Ensure, equals } from '@serenity-js/assertions';
import { Interaction, Question, Task } from '@serenity-js/core';
import { GetRequest, LastResponse, PostRequest, PutRequest, Send } from '@serenity-js/rest';

import { Customer } from '../../support/testData';
import { AuthResponse, withTheToken } from './ApiSession';

const idOf = (customer: Customer) => Question.about(`el id de ${ customer.firstName }`, () => {
  if (!customer.id) throw new Error(`${ customer.firstName } todavía no tiene cuenta`);
  return customer.id;
});

const RememberTheNewAccount = {
  of: (customer: Customer) => Interaction.where(`#actor anota el id de ${ customer.firstName }`, async actor => {
    const response = await actor.answer(LastResponse.body<AuthResponse>());
    customer.id = response.data.user.id;
  }),
};

/** Preparar datos por la API (blended testing): crear la cuenta de un cliente. */
export const RegisterAccount = {
  of: (customer: Customer) => Task.where(`#actor crea por la API la cuenta de ${ customer.email }`,
    Send.a(PostRequest.to('auth/register').with({
      name: customer.name,
      email: customer.email,
      password: customer.password,
    })),
    Ensure.that(LastResponse.status(), equals(201)),
    RememberTheNewAccount.of(customer),
  ),
};

/** ESC-26 por la API. Necesita una sesión de API iniciada (StartApiSession). */
export const BanViaApi = {
  user: (customer: Customer) => ({
    because: (reason: string) => Task.where(`#actor banea por la API a ${ customer.firstName }`,
      Send.a(PutRequest.to(Question.about('ruta', async actor => `admin/users/${ await actor.answer(idOf(customer)) }/ban`))
        .with({ reason })
        .using(withTheToken())),
    ),
  }),
};

/** ESC-27 por la API. */
export const UnbanViaApi = {
  user: (customer: Customer) => Task.where(`#actor desbanea por la API a ${ customer.firstName }`,
    Send.a(PutRequest.to(Question.about('ruta', async actor => `admin/users/${ await actor.answer(idOf(customer)) }/unban`))
      .using(withTheToken())),
  ),
  userWithId: (id: string) => Task.where(`#actor intenta desbanear por la API al usuario ${ id }`,
    Send.a(PutRequest.to(`admin/users/${ id }/unban`).using(withTheToken())),
  ),
};

/** ESC-28 por la API. */
export const ListUsersViaApi = {
  page: (page: number, limit: number) => Task.where(`#actor consulta por la API la página ${ page } de usuarios (de a ${ limit })`,
    Send.a(GetRequest.to(`admin/users?page=${ page }&limit=${ limit }`).using(withTheToken())),
  ),
  withoutLoggingIn: () => Task.where('#actor consulta los usuarios por la API sin iniciar sesión',
    Send.a(GetRequest.to('admin/users')),
  ),
};
