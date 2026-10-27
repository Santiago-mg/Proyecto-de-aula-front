import { Attribute, Page, Text, Value } from '@serenity-js/web';

import { Aviso, AdminAlertsPage, Heuristicas, LoginPage, Menu, ProfilePage, RegisterPage } from '../ui/Pages';

/** Preguntas que el actor se hace sobre lo que ve en pantalla. */
export const Currently = {
  /** Ruta actual, sin dominio ni parámetros (por ejemplo "/dashboard"). */
  path: () => Page.current().url().pathname,
};

export const Screen = {
  heading: () => Text.of(Menu.encabezado()),
  /**
   * El título en minúsculas. Varios títulos del panel se MUESTRAN en mayúsculas
   * (text-transform del CSS) y Serenity lee el texto tal como se ve, así que
   * "Panel" llega como "PANEL". Se compara sin distinguir mayúsculas.
   */
  headingLower: () => Text.of(Menu.encabezado()).toLowerCase(),
  loginError: () => Text.of(LoginPage.error()),
  registerError: () => Text.of(RegisterPage.error()),
  profileError: () => Text.of(ProfilePage.error()),
  sessionNotice: () => Text.of(LoginPage.avisoDeSesion()),
  confirmation: () => Text.of(Aviso.confirmacion()),
  /** El aviso se MUESTRA en mayúsculas (textTransform en línea): se compara en minúsculas. */
  confirmationLower: () => Text.of(Aviso.confirmacion()).toLowerCase(),
  fieldErrors: () => Text.ofAll(Aviso.erroresDeCampo()),
};

export const Alerts = {
  of: (celular: string) => Text.of(AdminAlertsPage.alertaDe(celular)),
  badge: () => Text.of(AdminAlertsPage.insignia()),
  emptyMessage: () => Text.of(AdminAlertsPage.vacio()),
};

/** Preguntas de la refactorización por heurísticas. */
export const Usability = {
  /** H1: título de la pestaña del navegador. */
  tabTitle: () => Page.current().title(),
  /** H3: lo que muestra el campo de nombre del perfil. */
  profileName: () => Value.of(ProfilePage.nombre()),
  /** H5/H8: "true" si el requisito de contraseña ya se cumple. */
  requirementMet: (id: string) => Attribute.called('data-cumple').of(Heuristicas.requisito(id)),
};
