import { test } from '@serenity-js/playwright-test'
import { Ensure, equals } from '@serenity-js/assertions'
import { Text, Page, Select } from '@serenity-js/web'
import { Wait } from '@serenity-js/core'
import { Navegar } from './tasks/Navegar'
import { IniciarSesion } from './tasks/IniciarSesion'
import { AdminOrdersPage } from './ui/AdminOrdersPage'

test.describe('Funcionalidad: Gestión de Pedidos (Admin)', () => {

  test('un administrador puede cancelar un pedido desde la tabla de gestión', async ({ actorCalled }) => {
    await actorCalled('Admin').attemptsTo(
      // 1. Iniciar sesión obligatoriamente con un usuario que tenga rol ADMIN
      Navegar.alLogin(),
      IniciarSesion.conCredenciales('admin@celularpro.co', 'admin1234'),
      Wait.until(Page.current().url().pathname, equals('/dashboard')),

      // 2. Navegar a la pantalla de órdenes
      Navegar.aGestionOrdenes(),
      Ensure.that(Text.of(AdminOrdersPage.titulo), equals('ÓRDENES')),

      // 3. Act: Seleccionar el valor "CANCELLED" en el dropdown del primer pedido
      // Select.value() busca el atributo "value" del <option>, que en tu código es "CANCELLED"
      Select.value('CANCELLED').from(AdminOrdersPage.primerSelectEstado),

      // 4. Assert: Esperamos a que la petición del backend termine y el estado 
      // visual en el badge cambie al texto en español "Cancelado"
      Wait.until(Text.of(AdminOrdersPage.primerBadgeEstado), equals('CANCELADO'))
    )
  })

})