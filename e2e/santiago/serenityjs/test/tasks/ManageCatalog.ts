import { equals, isPresent, not } from '@serenity-js/assertions';
import { Task, Wait } from '@serenity-js/core';
import { Clear, Click, Enter, ModalDialog, Navigate, Select, Value } from '@serenity-js/web';

import { pageAt } from '../support/environment';
import { TestPhone } from '../support/testData';
import { CatalogAdminPage, PhoneForm } from '../ui/CatalogAdminPage';
import { OpenPage } from './OpenPage';

const fillTheForm = (phone: TestPhone) => [
  Navigate.to(pageAt('/admin/phones/new')),
  Enter.theValue(phone.name).into(PhoneForm.name()),
  Enter.theValue(phone.slug).into(PhoneForm.slug()),
  Enter.theValue(phone.brand).into(PhoneForm.brand()),
  Select.option(phone.categoryLabel).from(PhoneForm.category()),
  Enter.theValue(String(phone.price)).into(PhoneForm.price()),
  Enter.theValue(String(phone.stock)).into(PhoneForm.stock()),
  Click.on(PhoneForm.submit()),
];

/** ESC-30 */
export const PublishPhone = {
  fromTheForm: (phone: TestPhone) => Task.where(`#actor publica "${ phone.name }" desde el formulario`,
    ...fillTheForm(phone),
    // Si se guardó, el formulario la devuelve a la tabla del catálogo.
    Wait.until(CatalogAdminPage.row(phone.name), isPresent()),
  ),
};

/** Solo envía el formulario: sirve cuando se espera que el back lo rechace. */
export const TryToPublishPhone = {
  fromTheForm: (phone: TestPhone) => Task.where(`#actor intenta publicar "${ phone.name }" con el slug "${ phone.slug }"`,
    ...fillTheForm(phone),
  ),
};

export const ChangePrice = {
  of: (phone: TestPhone) => ({
    to: (newPrice: number) => Task.where(`#actor cambia el precio de "${ phone.name }" a ${ newPrice }`,
      OpenPage.catalogManagement(),
      Click.on(CatalogAdminPage.editButton(phone.name)),
      // El formulario de edición carga los datos del celular por la API.
      Wait.until(Value.of(PhoneForm.name()), equals(phone.name)),
      Clear.theValueOf(PhoneForm.price()),
      Enter.theValue(String(newPrice)).into(PhoneForm.price()),
      Click.on(PhoneForm.submit()),
      Wait.until(CatalogAdminPage.table(), isPresent()),
    ),
  }),
};

export const DeletePhone = {
  called: (phone: TestPhone) => Task.where(`#actor elimina "${ phone.name }"`,
    OpenPage.catalogManagement(),
    // La tabla pide confirmar con un diálogo del navegador: se acepta.
    ModalDialog.acceptNext(),
    Click.on(CatalogAdminPage.deleteButton(phone.name)),
    Wait.until(CatalogAdminPage.row(phone.name), not(isPresent())),
  ),
};
