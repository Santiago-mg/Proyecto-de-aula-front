import { Messages } from '../support/questions/Messages'
import { theResponseTo } from '../support/questions/Api'
import { UsersTable } from '../support/questions/Users'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { BanViaApi, RegisterAccount } from '../support/tasks/api/UsersApi'
import { LogIn, TryToLogIn } from '../support/tasks/LogIn'
import { UnbanUser } from '../support/tasks/ManageUsers'

/**
 * Como administradora de CelularPro
 * quiero reactivar la cuenta de un cliente suspendido
 * para que pueda volver a comprar cuando se resuelva su caso.
 */
describe('Desbanear usuario (ESC-27) — web', () => {
  // Background: Carlos tiene una cuenta de cliente suspendida por "Spam"
  beforeEach(() => {
    const ana = actorCalled('Ana')
    const customer = TestData.customer('Carlos')

    actorCalled('Carlos').attemptsTo(RegisterAccount.of(customer))
    ana.attemptsTo(StartApiSession.asAdministrator(), BanViaApi.user(customer).because('Spam'))
    theResponseTo(ana).hasStatus(200)
  })

  it('Mientras está suspendido, el cliente no puede ingresar', () => {
    const carlos = actorCalled('Carlos')

    carlos.attemptsTo(TryToLogIn.as(TestData.customer('Carlos')))

    carlos.sees(Messages.loginError()).toEqual('Tu cuenta ha sido suspendida. Motivo: Spam')
  })

  it('[smoke] Un cliente reactivado vuelve a iniciar sesión', () => {
    const ana = actorCalled('Ana')
    const carlos = actorCalled('Carlos')
    const customer = TestData.customer('Carlos')

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(UnbanUser.called(customer))
    ana.sees(UsersTable.statusOf(customer)).toEqual('Activo')
    ana.sees(UsersTable.banReasonOf(customer)).toBeAbsent()

    carlos.attemptsTo(LogIn.as(customer))
    carlos.sees(Messages.greeting()).toEqual('Hola, Carlos')
  })
})
