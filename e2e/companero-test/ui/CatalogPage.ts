import { By, PageElement, PageElements } from '@serenity-js/web'

export const CatalogPage = {
  // El h1 principal del catálogo
  titulo: PageElement.located(By.css('.cp-catalog-title'))
    .describedAs('título del catálogo'),

  // El span que muestra "X equipos"
  contadorEquipos: PageElement.located(By.css('.cp-catalog-header span'))
    .describedAs('contador de equipos'),

  // La cuadrícula donde se renderizan los celulares
  contenedorGrid: PageElement.located(By.css('.cp-phones-grid'))
    .describedAs('cuadrícula de celulares'),

  // Una colección (PageElements en plural) para contar cuántas tarjetas (PhoneCard) hay
  tarjetasCelular: PageElements.located(By.css('.cp-phones-grid > div'))
    .describedAs('tarjetas de celulares'),

  // El mensaje cuando no hay resultados (usando XPath o CSS textual si el motor lo soporta, o una clase si se la agregas)
  mensajeVacio: PageElement.located(By.css('.cp-catalog-main p'))
    .describedAs('mensaje de catálogo vacío')
}