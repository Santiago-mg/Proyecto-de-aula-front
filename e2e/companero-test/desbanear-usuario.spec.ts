import { test } from '@serenity-js/playwright-test'
import { Ensure, equals, isPresent } from '@serenity-js/assertions'
import { Text, Page, Click, Enter } from '@serenity-js/web'
import { Wait } from '@serenity-js/core'
import { Navegar } from './tasks/Navegar'
import { IniciarSesion } from './tasks/IniciarSesion'
import { AdminUsersPage } from './ui/AdminUsersPage'
import { desbanearATodos } from './support/api'

test.describe('Funcionalidad: Gestión de Usuarios - Desbanear', () => {

  // Estas pruebas toman "el primer usuario de la tabla": si una deja a alguien
  // baneado, la siguiente cambia de usuario y se confunde. Cada prueba empieza
  // y termina sin baneados.
  test.beforeEach(async () => { await desbanearATodos() })
  test.afterEach(async () => { await desbanearATodos() })

  test('un administrador puede restaurar la cuenta de un usuario baneado', async ({ actorCalled }) => {
    await actorCalled('Admin').attemptsTo(
      // 1. Iniciar sesión como administrador
      Navegar.alLogin(),
      IniciarSesion.conCredenciales('admin@celularpro.co', 'admin1234'), // ¡Cambia por tu admin real!
      Wait.until(Page.current().url().pathname, equals('/dashboard')),

      // 2. Ir a la sección de usuarios
      Navegar.aGestionUsuarios(),
      Wait.until(Text.of(AdminUsersPage.titulo), equals('USUARIOS')),

      // 3. Preparación: Baneamos al primer usuario de la lista para asegurar que tengamos a quién desbanear
      Click.on(AdminUsersPage.primerBotonBanear),
      Wait.until(AdminUsersPage.modalContenedor, isPresent()),
      Enter.theValue('Ban temporal automatizado').into(AdminUsersPage.modalInputMotivo),
      Click.on(AdminUsersPage.modalBotonConfirmar),
      
      // Esperamos que se procese el baneo y aparezca el botón de "Desbanear"
      Wait.until(AdminUsersPage.primerBotonDesbanear, isPresent()),

      // 4. Act (Acción principal): Hacemos clic en Desbanear
      Click.on(AdminUsersPage.primerBotonDesbanear),

      // 5. Assert: Esperamos a que la petición termine y el badge cambie a "Activo"
      // (Buscamos que aparezca de nuevo el botón de "Banear" y el badge verde de Activo)
      Wait.until(AdminUsersPage.primerBotonBanear, isPresent()),
      Wait.until(AdminUsersPage.primerBadgeActivo, isPresent())
    )
  })

})