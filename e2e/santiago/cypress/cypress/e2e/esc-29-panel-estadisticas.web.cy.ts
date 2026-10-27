import '../support/hooks'
import { lastResponseOf } from '../support/questions/Api'
import { Messages } from '../support/questions/Messages'
import { Statistics } from '../support/questions/Statistics'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { RegisterAccount } from '../support/tasks/api/UsersApi'
import { GetStatistics } from '../support/tasks/api/StatisticsApi'
import { LogIn } from '../support/tasks/LogIn'
import { BanUser } from '../support/tasks/ManageUsers'
import { OpenPage, TryToOpen } from '../support/tasks/OpenPage'

/**
 * Como administradora de CelularPro
 * quiero ver los indicadores de la tienda en un solo lugar
 * para saber cómo va el negocio sin consultar la base de datos.
 */
describe('Panel de estadísticas (ESC-29) — web', () => {
  it('[smoke] El panel muestra los totales reales de la tienda', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(OpenPage.adminDashboard())
    ana.attemptsTo(StartApiSession.asAdministrator(), GetStatistics.viaApi())

    ana
      .sees(Statistics.indicator('Usuarios'))
      .toEqual(() => lastResponseOf(ana).body.data.users.total as number)
    ana
      .sees(Statistics.indicator('Celulares en catálogo'))
      .toEqual(() => lastResponseOf(ana).body.data.phones.total as number)
  })

  it('Banear a un cliente se refleja en las estadísticas', () => {
    const ana = actorCalled('Ana')
    const customer = TestData.customer('Carlos')

    actorCalled('Carlos').attemptsTo(RegisterAccount.of(customer))
    ana.attemptsTo(LogIn.asAdministrator())
    // Anota cuántos baneados muestran las estadísticas antes de banear.
    ana.attemptsTo(OpenPage.statistics())
    ana.reads(Statistics.value('Baneados')).then((banned) => ana.notes.set('bannedBefore', banned))

    ana.attemptsTo(BanUser.called(customer).because('Contracargos repetidos'))

    ana.attemptsTo(OpenPage.statistics())
    ana.sees(Statistics.value('Baneados')).toEqual(() => ana.notes.get<number>('bannedBefore') + 1)
  })

  it('Un cliente no puede ver el panel', () => {
    const carlos = actorCalled('Carlos')
    const customer = TestData.customer('Carlos')

    carlos.attemptsTo(RegisterAccount.of(customer))
    carlos.attemptsTo(LogIn.as(customer))
    carlos.attemptsTo(TryToOpen.page('/admin'))

    carlos.sees(Messages.pageTitle()).toEqual('Acceso no autorizado')
  })
})
