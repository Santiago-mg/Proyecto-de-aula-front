import { test } from '@serenity-js/playwright-test'
import { Ensure, equals, isPresent } from '@serenity-js/assertions'
import { Text, Page, Click, Enter } from '@serenity-js/web'
import { Wait } from '@serenity-js/core'
import { Navegar } from './tasks/Navegar'
import { IniciarSesion } from './tasks/IniciarSesion'
import { AdminUsersPage } from './ui/AdminUsersPage'
import { desbanearATodos } from './support/api'

test.describe('Funcionalidad: Gestión de Usuarios (Admin)', () => {

  // Estas pruebas toman "el primer usuario de la tabla": si una deja a alguien
  // baneado, la siguiente cambia de usuario y se confunde. Cada prueba empieza
  // y termina sin baneados.
  test.beforeEach(async () => { await desbanearATodos() })
  test.afterEach(async () => { await desbanearATodos() })

  test('un administrador puede banear a un usuario por fraude', async ({ actorCalled }) => {
    await actorCalled('Admin').attemptsTo(
      // 1. Iniciar sesión obligatoriamente con el ADMIN
      Navegar.alLogin(),
      IniciarSesion.conCredenciales('admin@celularpro.co', 'admin1234'), // Usa tus credenciales reales
      Wait.until(Page.current().url().pathname, equals('/dashboard')),

      // 2. Navegar a la pantalla de usuarios
      Navegar.aGestionUsuarios(),
      Wait.until(Text.of(AdminUsersPage.titulo), equals('USUARIOS')),

      // 3. Abrir el modal haciendo clic en "Banear"
      Click.on(AdminUsersPage.primerBotonBanear),
      
      // Asegurarnos de que la animación del modal termine y sea visible
      Wait.until(AdminUsersPage.modalContenedor, isPresent()),

      // 4. Llenar el motivo (tu código exige mínimo 4 caracteres para habilitar el botón)
      Enter.theValue('Comportamiento fraudulento detectado').into(AdminUsersPage.modalInputMotivo),

      // 5. Confirmar el baneo
      Click.on(AdminUsersPage.modalBotonConfirmar),

      // 6. Assert: El modal se cierra, la petición termina y en la tabla ahora vemos la etiqueta "Baneado"
      Wait.until(AdminUsersPage.primerBadgeBaneado, isPresent())
    )
  })

})