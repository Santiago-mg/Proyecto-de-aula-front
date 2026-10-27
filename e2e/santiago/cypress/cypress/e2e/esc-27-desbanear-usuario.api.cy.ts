import '../support/hooks'
import { theResponseTo } from '../support/questions/Api'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { BanViaApi, RegisterAccount, UnbanViaApi } from '../support/tasks/api/UsersApi'

describe('Desbanear usuario (ESC-27) — API', () => {
  // Background: Carlos tiene una cuenta de cliente suspendida por "Spam"
  beforeEach(() => {
    const ana = actorCalled('Ana')
    const customer = TestData.customer('Carlos')

    actorCalled('Carlos').attemptsTo(RegisterAccount.of(customer))
    ana.attemptsTo(StartApiSession.asAdministrator(), BanViaApi.user(customer).because('Spam'))
    theResponseTo(ana).hasStatus(200)
  })

  it('Desbanear por la API deja la cuenta limpia', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(StartApiSession.asAdministrator())
    ana.attemptsTo(UnbanViaApi.user(TestData.customer('Carlos')))

    theResponseTo(ana)
      .hasStatus(200)
      .satisfies('el usuario quedó activo y sin motivo de baneo', (body) => {
        const { banned, banReason, bannedAt } = body.data
        expect({ banned, banReason, bannedAt }).to.deep.equal({ banned: false, banReason: null, bannedAt: null })
      })
  })

  it('Desbanear a un usuario que no existe', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(StartApiSession.asAdministrator())
    ana.attemptsTo(UnbanViaApi.userWithId('00000000-0000-0000-0000-000000000000'))

    theResponseTo(ana).hasStatus(404).hasError('Usuario no encontrado')
  })
})
