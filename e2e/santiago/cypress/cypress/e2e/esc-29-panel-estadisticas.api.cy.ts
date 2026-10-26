import { theResponseTo } from '../support/questions/Api'
import { actorCalled } from '../support/screenplay/actor'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { GetStatistics } from '../support/tasks/api/StatisticsApi'

describe('Panel de estadísticas (ESC-29) — API', () => {
  it('Las estadísticas traen los ingresos de los últimos 7 días', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(StartApiSession.asAdministrator())
    ana.attemptsTo(GetStatistics.viaApi())

    theResponseTo(ana)
      .hasStatus(200)
      .satisfies('trae los ingresos de 7 días', (body) => {
        expect(body.data.revenueByDay, 'ingresos por día').to.have.length(7)
      })
  })
})
