import { By, PageElement } from '@serenity-js/web';

/** Lo que se repite en varias páginas. */
export const CommonPage = {
  // "Hola, Carlos": la página "Mi cuenta" a la que se llega al iniciar sesión.
  greeting: () => PageElement.located(By.xpath("//h1[starts-with(normalize-space(), 'Hola,')]"))
    .describedAs('saludo de "Mi cuenta"'),
  mainHeading: () => PageElement.located(By.css('h1')).describedAs('título de la página'),
};
