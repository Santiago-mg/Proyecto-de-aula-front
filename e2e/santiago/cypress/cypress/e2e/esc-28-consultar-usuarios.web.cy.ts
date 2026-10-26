import { lastResponseOf } from '../support/questions/Api'
import { Messages } from '../support/questions/Messages'
import { UsersTable } from '../support/questions/Users'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { ListUsersViaApi, RegisterAccount } from '../support/tasks/api/UsersApi'
import { LogIn } from '../support/tasks/LogIn'
import { SearchUsers } from '../support/tasks/ManageUsers'
import { OpenPage, TryToOpen } from '../support/tasks/OpenPage'

/**
 * Como administradora de CelularPro
 * quiero ver y buscar las cuentas registradas
 * para encontrar rápido a un cliente.
 */
describe('Consultar usuarios (ESC-28) — web', () => {
  it('[smoke] La administradora ve cuántos usuarios hay registrados', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(OpenPage.userManagement())
    ana.attemptsTo(StartApiSession.asAdministrator(), ListUsersViaApi.page(1, 1))

    ana.sees(UsersTable.totalShown()).toEqual(() => lastResponseOf(ana).body.meta.total as number)
  })

  it('Buscar a un cliente por su correo', () => {
    const ana = actorCalled('Ana')
    const customer = TestData.customer('Carlos')

    actorCalled('Carlos').attemptsTo(RegisterAccount.of(customer))
    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(OpenPage.userManagement(), SearchUsers.for(customer.email))

    // Primero se espera a que la tabla termine de filtrar: el buscador espera
    // 400 ms y vuelve a pintar las filas.
    ana.sees(UsersTable.numberOfRows()).toEqual(1)
    ana.sees(UsersTable.emails()).toEqual([customer.email])
    ana.sees(UsersTable.roleOf(customer)).toEqual('Usuario')
    ana.sees(UsersTable.statusOf(customer)).toEqual('Activo')
  })

  it('Una búsqueda sin coincidencias deja la tabla vacía', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(OpenPage.userManagement(), SearchUsers.for('nadie-se-llama-asi'))

    ana.sees(UsersTable.numberOfRows()).toEqual(0)
  })

  it('Un cliente no puede entrar a la gestión de usuarios', () => {
    const carlos = actorCalled('Carlos')
    const customer = TestData.customer('Carlos')

    carlos.attemptsTo(RegisterAccount.of(customer))
    carlos.attemptsTo(LogIn.as(customer))
    carlos.attemptsTo(TryToOpen.page('/admin/users'))

    carlos.sees(Messages.pageTitle()).toEqual('Acceso no autorizado')
  })
})
