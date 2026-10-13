import { Text } from '@serenity-js/web';

import { CatalogAdminPage, PhoneForm } from '../ui/CatalogAdminPage';

/** ESC-30 */
export const CatalogAdmin = {
  rowOf: (name: string) => CatalogAdminPage.row(name),
  formError: () => Text.of(PhoneForm.errorMessage()).describedAs('error del formulario'),
};
