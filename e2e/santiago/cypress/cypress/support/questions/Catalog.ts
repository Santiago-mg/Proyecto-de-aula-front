import { textOf } from '../screenplay/question'
import { CatalogAdminPage, PhoneFormPage } from '../ui/pages'

/** ESC-30 */
export const CatalogAdmin = {
  rowOf: (name: string) => textOf(`fila de "${name}"`, () => CatalogAdminPage.row(name)),
  formError: () => textOf('error del formulario', PhoneFormPage.errorMessage),
}
