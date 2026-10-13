import { By, PageElement, PageElements } from '@serenity-js/web';

const TABLE_ROWS = "//table[contains(@class, 'cp-admin-table')]/tbody/tr";
// La fila de un usuario se reconoce por su correo, que es único.
const rowOf = (email: string) => `${ TABLE_ROWS }[td[1]//div[normalize-space()='${ email }']]`;

/** /admin/users — ESC-26, ESC-27 y ESC-28 */
export const UsersPage = {
  searchBox: () => PageElement.located(By.css('input[placeholder="Buscar por nombre o email..."]'))
    .describedAs('buscador de usuarios'),
  total: () => PageElement.located(By.xpath("//div[contains(normalize-space(), 'usuarios registrados') and not(*)]"))
    .describedAs('total de usuarios registrados'),
  table: () => PageElement.located(By.css('table.cp-admin-table')).describedAs('tabla de usuarios'),
  rows: () => PageElements.located(By.xpath(TABLE_ROWS)).describedAs('filas de la tabla de usuarios'),
  // Cada fila: avatar | (nombre, correo)
  emails: () => PageElements.located(By.xpath(`${ TABLE_ROWS }/td[1]/div/div[2]/div[2]`))
    .describedAs('correos de la tabla de usuarios'),

  row: (email: string) => PageElement.located(By.xpath(rowOf(email))).describedAs(`fila de ${ email }`),
  role: (email: string) => PageElement.located(By.xpath(`${ rowOf(email) }/td[2]/span`))
    .describedAs(`rol de ${ email }`),
  status: (email: string) => PageElement.located(By.xpath(`${ rowOf(email) }/td[5]//span[contains(@class, 'cp-badge')]`))
    .describedAs(`estado de ${ email }`),
  banReason: (email: string) => PageElement.located(By.xpath(`${ rowOf(email) }/td[5]/div/div`))
    .describedAs(`motivo del baneo de ${ email }`),
  ownAccountMark: (email: string) => PageElement.located(By.xpath(`${ rowOf(email) }//span[normalize-space()='(tú)']`))
    .describedAs(`marca "(tú)" en la fila de ${ email }`),
  banButton: (email: string) => PageElement.located(By.xpath(`${ rowOf(email) }//button[normalize-space()='Banear']`))
    .describedAs(`botón Banear de ${ email }`),
  unbanButton: (email: string) => PageElement.located(By.xpath(`${ rowOf(email) }//button[normalize-space()='Desbanear']`))
    .describedAs(`botón Desbanear de ${ email }`),
};

/** El modal que se abre al pulsar "Banear" */
export const BanModal = {
  reason: () => PageElement.located(By.css('#motivo-baneo')).describedAs('motivo del baneo'),
  confirmButton: () => PageElement.located(By.xpath("//div[contains(@class, 'cp-modal')]//button[normalize-space()='Confirmar baneo']"))
    .describedAs('botón Confirmar baneo'),
};
