import { theResponseTo } from '../support/questions/Api'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { ListUsersViaApi, RegisterAccount } from '../support/tasks/api/UsersApi'

describe('Consultar usuarios (ESC-28) — API', () => {
  it('Consultar usuarios por la API, de a uno por página', () => {
    const ana = actorCalled('Ana')

    actorCalled('Carlos').attemptsTo(RegisterAccount.of(TestData.customer('Carlos')))
    ana.attemptsTo(StartApiSession.asAdministrator())
    ana.attemptsTo(ListUsersViaApi.page(1, 1))

    theResponseTo(ana)
      .hasStatus(200)
      .satisfies('trae 1 usuario y tantas páginas como usuarios registrados', (body) => {
        expect(body.data, 'usuarios en la respuesta').to.have.length(1)
        expect(body.meta.totalPages, 'páginas').to.equal(body.meta.total)
      })
  })

  it('Sin iniciar sesión no se pueden consultar los usuarios', () => {
    const api = actorCalled('Api')

    api.attemptsTo(ListUsersViaApi.withoutLoggingIn())

    theResponseTo(api).hasStatus(401).hasError('Token requerido')
  })
})
