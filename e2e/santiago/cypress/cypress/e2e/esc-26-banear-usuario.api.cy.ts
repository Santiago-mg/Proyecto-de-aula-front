import '../support/hooks'
import { theResponseTo } from '../support/questions/Api'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { BanViaApi, RegisterAccount } from '../support/tasks/api/UsersApi'

describe('Banear usuario (ESC-26) — API', () => {
  // Background: Carlos tiene una cuenta de cliente
  beforeEach(() => {
    actorCalled('Carlos').attemptsTo(RegisterAccount.of(TestData.customer('Carlos')))
  })

  it('Banear por la API', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(StartApiSession.asAdministrator())
    ana.attemptsTo(BanViaApi.user(TestData.customer('Carlos')).because('Spam'))

    theResponseTo(ana)
      .hasStatus(200)
      .satisfies('el usuario quedó baneado por "Spam"', (body) => {
        const { banned, banReason, bannedAt } = body.data
        expect({ banned, banReason, hasBanDate: bannedAt !== null }).to.deep.equal({
          banned: true,
          banReason: 'Spam',
          hasBanDate: true,
        })
      })
  })

  it('Un cliente no puede banear a otro', () => {
    const carlos = actorCalled('Carlos')
    const bruno = actorCalled('Bruno')

    bruno.attemptsTo(RegisterAccount.of(TestData.customer('Bruno')))
    carlos.attemptsTo(StartApiSession.as(TestData.customer('Carlos')))
    carlos.attemptsTo(BanViaApi.user(TestData.customer('Bruno')).because('No me cae bien'))

    theResponseTo(carlos).hasStatus(403).hasError('Acceso restringido a administradores')
  })
})
