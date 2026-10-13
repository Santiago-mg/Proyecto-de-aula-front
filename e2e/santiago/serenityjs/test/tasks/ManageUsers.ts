import { Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Clear, Click, Enter } from '@serenity-js/web';

import { Customer } from '../support/testData';
import { BanModal, UsersPage } from '../ui/UsersPage';
import { OpenPage } from './OpenPage';

/** ESC-28: el buscador espera 400 ms a que se deje de escribir y filtra. */
export const SearchUsers = {
  for: (term: string) => Task.where(`#actor busca "${ term }" en la gestión de usuarios`,
    Clear.theValueOf(UsersPage.searchBox()),
    Enter.theValue(term).into(UsersPage.searchBox()),
  ),
};

/** Busca al cliente por su correo y abre el modal de baneo de su fila. */
const openBanModalFor = (customer: Customer) => [
  OpenPage.userManagement(),
  SearchUsers.for(customer.email),
  Click.on(UsersPage.banButton(customer.email)),
];

/** ESC-26 */
export const BanUser = {
  called: (customer: Customer) => ({
    because: (reason: string) => Task.where(`#actor banea a ${ customer.firstName } por "${ reason }"`,
      ...openBanModalFor(customer),
      Enter.theValue(reason).into(BanModal.reason()),
      Click.on(BanModal.confirmButton()),
      // Al quedar baneado, el botón de su fila pasa a decir "Desbanear".
      Wait.until(UsersPage.unbanButton(customer.email), isPresent()),
    ),
  }),
};

/** ESC-26: abre el modal y escribe el motivo, pero no confirma. */
export const StartBanning = {
  user: (customer: Customer) => ({
    withReason: (reason: string) => Task.where(`#actor empieza a banear a ${ customer.firstName } con el motivo "${ reason }"`,
      ...openBanModalFor(customer),
      Enter.theValue(reason).into(BanModal.reason()),
    ),
  }),
};

/** ESC-27 */
export const UnbanUser = {
  called: (customer: Customer) => Task.where(`#actor desbanea a ${ customer.firstName }`,
    OpenPage.userManagement(),
    SearchUsers.for(customer.email),
    Click.on(UsersPage.unbanButton(customer.email)),
    // Al quedar activo, el botón de su fila vuelve a decir "Banear".
    Wait.until(UsersPage.banButton(customer.email), isPresent()),
  ),
};
