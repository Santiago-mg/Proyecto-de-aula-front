import { By, PageElement, PageElements } from '@serenity-js/web'

export const FavoritesPage = {
  // El h1 que cambia dependiendo de si hay favoritos o no
  titulo: PageElement.located(By.css('.cp-catalog-title'))
    .describedAs('título de la página de favoritos'),

  // El botón para ir al catálogo cuando la lista está vacía
  botonExplorar: PageElement.located(By.css('a.cp-btn-primary'))
    .describedAs('botón de explorar catálogo'),

  // La cuadrícula y las tarjetas (por si luego pruebas agregar un favorito)
  contenedorGrid: PageElement.located(By.css('.cp-phones-grid'))
    .describedAs('cuadrícula de favoritos'),

  tarjetasCelular: PageElements.located(By.css('.cp-phones-grid > div'))
    .describedAs('tarjetas de celulares favoritos'),

  // El h2 que sale cuando buscas algo en los filtros y no hay coincidencias
  mensajeSinCoincidencias: PageElement.located(By.css('.cp-catalog-main h2'))
    .describedAs('mensaje de sin coincidencias de filtro')
}