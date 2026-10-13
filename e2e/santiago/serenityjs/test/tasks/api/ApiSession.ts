import { Ensure, equals } from '@serenity-js/assertions';
import { notes, q, Task } from '@serenity-js/core';
import { LastResponse, PostRequest, Send } from '@serenity-js/rest';

import { environment } from '../../support/environment';
import { Customer } from '../../support/testData';

/** Lo que el actor anota en su libreta mientras usa la API. */
export interface ApiNotes {
  token: string;
}

export interface AuthResponse {
  data: { token: string; user: { id: string; email: string } };
}

const logInViaApi = (email: string, password: string) => [
  Send.a(PostRequest.to('auth/login').with({ email, password })),
  Ensure.that(LastResponse.status(), equals(200)),
  notes<ApiNotes>().set('token', LastResponse.body<AuthResponse>().data.token),
];

/** Inicia sesión en la API y anota el token para las siguientes peticiones. */
export const StartApiSession = {
  asAdministrator: () => Task.where('#actor inicia sesión en la API como administradora',
    ...logInViaApi(environment.admin.email, environment.admin.password),
  ),
  as: (customer: Customer) => Task.where(`#actor inicia sesión en la API como ${ customer.email }`,
    ...logInViaApi(customer.email, customer.password),
  ),
};

/** Cabecera Authorization con el token que el actor anotó al iniciar sesión. */
export const withTheToken = () => ({
  headers: { Authorization: q`Bearer ${ notes<ApiNotes>().get('token') }` },
});
