import { By, PageElement, PageElements } from '@serenity-js/web';

/**
 * Mapa de la interfaz de CelularPro. Cada localizador existe en el código del
 * frontend (ids, data-testid o textos exactos): si alguien los cambia, el
 * script verificar-localizadores.py lo avisa antes de correr los escenarios.
 */
const css = (selector: string, nombre: string) => PageElement.located(By.css(selector)).describedAs(nombre);
const boton = (texto: string) => PageElement.located(By.xpath(`//button[normalize-space()="${ texto }"]`)).describedAs(`botón "${ texto }"`);

export const LoginPage = {
  correo: () => css('#email', 'campo de correo'),
  contrasena: () => css('#password', 'campo de contraseña'),
  ingresar: () => css('form button[type="submit"]', 'botón Ingresar'),
  error: () => css('.cp-error-message', 'mensaje de error del formulario'),
  avisoDeSesion: () => css('.cp-flash', 'aviso de sesión'),
};

export const RegisterPage = {
  nombre: () => css('#name', 'campo de nombre'),
  correo: () => css('#email', 'campo de correo'),
  contrasena: () => css('#password', 'campo de contraseña'),
  confirmacion: () => css('#confirmPassword', 'campo de confirmación'),
  crearCuenta: () => css('form button[type="submit"]', 'botón Crear cuenta'),
  error: () => css('.cp-error-message', 'mensaje de error del formulario'),
};

export const Aviso = {
  erroresDeCampo: () => PageElements.located(By.css('.cp-field-error')).describedAs('errores de campo'),
  confirmacion: () => css('[data-testid="toast"]', 'aviso de confirmación'),
};

export const Menu = {
  // H2: "Cerrar sesión" en escritorio y en móvil (antes "Salir" / "Cerrar sesión")
  salir: () => boton('Cerrar sesión'),
  encabezado: () => css('h1', 'título de la página'),
};

export const ProfilePage = {
  nombre: () => css('#profile-name', 'campo de nombre'),
  contrasenaActual: () => css('#currentPassword', 'campo de contraseña actual'),
  contrasenaNueva: () => css('#newPassword', 'campo de contraseña nueva'),
  confirmacionNueva: () => css('#confirmNewPassword', 'campo de confirmación'),
  guardarCambios: () => boton('Guardar cambios'),
  descartarCambios: () => boton('Descartar cambios'),
  cambiarContrasena: () => boton('Cambiar contraseña'),
  error: () => css('.cp-error-message', 'mensaje de error'),
};

export const AdminAlertsPage = {
  lista: () => css('#alertas-lista', 'lista de alertas'),
  vacio: () => css('#alertas-vacio', 'aviso de "sin alertas"'),
  insignia: () => css('[data-testid="insignia-alertas"]', 'insignia de alertas del menú'),
  alertaDe: (celular: string) =>
    PageElement.located(By.xpath(`//li[@data-testid="alerta"][contains(., "${ celular }")]`)).describedAs(`alerta de "${ celular }"`),
  reponer: (celular: string) =>
    PageElement.located(By.xpath(`//a[@aria-label="Reponer ${ celular }"]`)).describedAs(`enlace Reponer de "${ celular }"`),
};

export const PhoneForm = {
  nombre: () => css('#name', 'campo Nombre'),
  slug: () => css('#slug', 'campo Slug'),
  marca: () => css('#brand', 'campo Marca'),
  categoria: () => css('#categoryId', 'selector de categoría'),
  precio: () => css('#price', 'campo Precio'),
  stock: () => css('#stock', 'campo Stock'),
  stockMinimo: () => css('#minStock', 'campo Stock mínimo (umbral de alerta)'),
  crear: () => boton('Crear celular'),
  guardar: () => boton('Guardar cambios'),
};

/** Elementos que se agregaron con la refactorización por heurísticas. */
export const Heuristicas = {
  enlace: (texto: string) =>
    PageElement.located(By.xpath(`//a[normalize-space()="${ texto }"]`)).describedAs(`enlace "${ texto }"`),
  requisito: (id: string) => css(`[data-regla="${ id }"]`, `requisito de contraseña "${ id }"`),
};
