import { By, PageElement } from '@serenity-js/web';

const rowOf = (name: string) =>
  `//table[contains(@class, 'cp-admin-table')]/tbody/tr[td[1]//span[normalize-space()='${ name }']]`;

/** /admin/phones — ESC-30 */
export const CatalogAdminPage = {
  title: () => PageElement.located(By.xpath("//h1[normalize-space()='Gestión de celulares']"))
    .describedAs('título "Gestión de celulares"'),
  // El título sale enseguida; la tabla, cuando terminan de cargar los celulares.
  table: () => PageElement.located(By.css('table.cp-admin-table')).describedAs('tabla del catálogo'),
  row: (name: string) => PageElement.located(By.xpath(rowOf(name))).describedAs(`fila de "${ name }"`),
  editButton: (name: string) => PageElement.located(By.xpath(`${ rowOf(name) }//a[@title='Editar']`))
    .describedAs(`botón Editar de "${ name }"`),
  deleteButton: (name: string) => PageElement.located(By.xpath(`${ rowOf(name) }//button[@title='Eliminar']`))
    .describedAs(`botón Eliminar de "${ name }"`),
};

/** /admin/phones/new y /admin/phones/:id/edit */
export const PhoneForm = {
  name: () => PageElement.located(By.css('#name')).describedAs('campo Nombre'),
  slug: () => PageElement.located(By.css('#slug')).describedAs('campo Slug'),
  brand: () => PageElement.located(By.css('#brand')).describedAs('campo Marca'),
  category: () => PageElement.located(By.css('#categoryId')).describedAs('selector de Categoría'),
  price: () => PageElement.located(By.css('#price')).describedAs('campo Precio'),
  stock: () => PageElement.located(By.css('#stock')).describedAs('campo Stock'),
  submit: () => PageElement.located(By.css('form button[type="submit"]')).describedAs('botón del formulario'),
  errorMessage: () => PageElement.located(By.css('form > p:not(.cp-field-error)'))
    .describedAs('mensaje de error del formulario'),
};
