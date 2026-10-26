import { BanModal, UsersTable } from '../support/questions/Users'
import { Messages } from '../support/questions/Messages'
import { actorCalled } from '../support/screenplay/actor'
import { environment } from '../support/screenplay/environment'
import { TestData } from '../support/screenplay/testData'
import { RegisterAccount } from '../support/tasks/api/UsersApi'
import { LogIn, TryToLogIn } from '../support/tasks/LogIn'
import { BanUser, SearchUsers, StartBanning } from '../support/tasks/ManageUsers'
import { OpenPage } from '../support/tasks/OpenPage'

/**
 * Como administradora de CelularPro
 * quiero suspender la cuenta de un cliente
 * para que no pueda volver a ingresar mientras se revisa su caso.
 */
describe('Banear usuario (ESC-26) — web', () => {
  // Background: Carlos tiene una cuenta de cliente
  beforeEach(() => {
    actorCalled('Carlos').attemptsTo(RegisterAccount.of(TestData.customer('Carlos')))
  })

  it('[smoke] Un cliente baneado ya no puede iniciar sesión', () => {
    const ana = actorCalled('Ana')
    const carlos = actorCalled('Carlos')
    const customer = TestData.customer('Carlos')

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(BanUser.called(customer).because('Fraude en pagos'))
    ana.sees(UsersTable.statusOf(customer)).toEqual('Baneado')
    ana.sees(UsersTable.banReasonOf(customer)).toEqual('Fraude en pagos')

    carlos.attemptsTo(TryToLogIn.as(customer))
    carlos.sees(Messages.loginError()).toEqual('Tu cuenta ha sido suspendida. Motivo: Fraude en pagos')
  })

  it('El motivo del baneo necesita al menos 4 caracteres', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(StartBanning.user(TestData.customer('Carlos')).withReason('abc'))

    ana.sees(BanModal.confirmButton()).toBeDisabled()
  })

  it('La administradora no puede banearse a sí misma', () => {
    const ana = actorCalled('Ana')
    const ownEmail = environment.admin.email

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(OpenPage.userManagement(), SearchUsers.for(ownEmail))

    ana.sees(UsersTable.ownAccountMarkOf(ownEmail)).toBeVisible()
    ana.sees(UsersTable.banButtonOf(ownEmail)).toBeAbsent()
  })
})
