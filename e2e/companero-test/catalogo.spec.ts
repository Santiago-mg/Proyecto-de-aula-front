import { test } from '@serenity-js/playwright-test'
import { Ensure, equals, isGreaterThan, isPresent } from '@serenity-js/assertions'
import { Text } from '@serenity-js/web'
import { Navegar } from './tasks/Navegar'
import { CatalogPage } from './ui/CatalogPage'

test.describe('Funcionalidad: Ver Catálogo', () => {

  test('el cliente puede ver los celulares disponibles en la tienda', async ({ actorCalled }) => {
    
    // Arrange & Act
    await actorCalled('Cliente').attemptsTo(
      Navegar.alCatalogo(),

      // Assert 1: Verifica que cargó la página correcta
      Ensure.that(Text.of(CatalogPage.titulo), equals('CATÁLOGO')),

      // Assert 2: Verifica que el backend respondió y se renderizaron tarjetas.
      // (Serenity esperará automáticamente hasta que desaparezca tu componente <Loading />
      // y aparezcan los elementos en el DOM).
      Ensure.that(CatalogPage.tarjetasCelular.count(), isGreaterThan(0)),

      // Assert 3: Verifica que el contador de equipos se esté renderizando en pantalla
      Ensure.that(CatalogPage.contadorEquipos, isPresent())
    )
  })
})