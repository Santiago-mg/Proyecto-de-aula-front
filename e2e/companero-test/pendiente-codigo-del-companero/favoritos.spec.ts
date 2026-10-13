import { test } from '@serenity-js/playwright-test'
import { Ensure, equals, isPresent } from '@serenity-js/assertions'
import { Text } from '@serenity-js/web'
import { Navegar } from '../tasks/Navegar'
import { Page } from '@serenity-js/web'
import { Wait } from '@serenity-js/core'
import { IniciarSesion } from '../tasks/IniciarSesion'
import { FavoritesPage } from '../ui/FavoritesPage'

test.describe('Funcionalidad: Lista de Favoritos', () => {

  test('muestra el estado vacío cuando el cliente entra por primera vez', async ({ actorCalled }) => {
    
    await actorCalled('Cliente').attemptsTo(
      // 1. Navegar al Login
      Navegar.alLogin(),

      // 2. Iniciar sesión con credenciales válidas
      IniciarSesion.conCredenciales('test@test.com', 'password123'),
      Wait.until(Page.current().url().pathname, equals('/dashboard')),
      // 3. Navegar a favoritos una vez iniciada la sesión
      Navegar.aFavoritos(),

      // 4. Verificaciones
      Ensure.that(Text.of(FavoritesPage.titulo), equals('AÚN NO TIENES FAVORITOS')),
      Ensure.that(FavoritesPage.botonExplorar, isPresent()),
      Ensure.that(Text.of(FavoritesPage.botonExplorar), equals('Explorar catálogo'))
    )
  })
})