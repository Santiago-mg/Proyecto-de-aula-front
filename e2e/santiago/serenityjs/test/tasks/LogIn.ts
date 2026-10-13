import { Masked, Task, Wait } from '@serenity-js/core';
import { Click, Enter, isVisible, Navigate } from '@serenity-js/web';

import { environment, pageAt } from '../support/environment';
import { Customer } from '../support/testData';
import { CommonPage } from '../ui/CommonPage';
import { LoginPage } from '../ui/LoginPage';

const submitCredentials = (email: string, password: string) => [
  Navigate.to(pageAt('/login')),
  Enter.theValue(email).into(LoginPage.email()),
  Enter.theValue(Masked.valueOf(password)).into(LoginPage.password()),
  Click.on(LoginPage.submit()),
];

/** Inicia sesión y espera a llegar a "Mi cuenta". */
export const LogIn = {
  asAdministrator: () => Task.where('#actor inicia sesión como administradora',
    ...submitCredentials(environment.admin.email, environment.admin.password),
    Wait.until(CommonPage.greeting(), isVisible()),
  ),
  as: (customer: Customer) => Task.where(`#actor inicia sesión como ${ customer.email }`,
    ...submitCredentials(customer.email, customer.password),
    Wait.until(CommonPage.greeting(), isVisible()),
  ),
};

/** Solo envía el formulario: sirve cuando se espera que el ingreso falle. */
export const TryToLogIn = {
  as: (customer: Customer) => Task.where(`#actor intenta iniciar sesión como ${ customer.email }`,
    ...submitCredentials(customer.email, customer.password),
  ),
};
