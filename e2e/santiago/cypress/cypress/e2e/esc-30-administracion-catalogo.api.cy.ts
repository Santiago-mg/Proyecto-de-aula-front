import { theResponseTo } from '../support/questions/Api'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { DeletePhoneViaApi, FindPhoneViaApi, PublishPhoneViaApi } from '../support/tasks/api/PhonesApi'

describe('Administración del catálogo (ESC-30) — API', () => {
  it('Publicar y retirar un celular por la API', () => {
    const ana = actorCalled('Ana')
    const phone = TestData.phone()

    ana.attemptsTo(StartApiSession.asAdministrator())
    ana.attemptsTo(PublishPhoneViaApi.called(phone))
    theResponseTo(ana).hasStatus(201)

    ana.attemptsTo(DeletePhoneViaApi.called(phone))
    theResponseTo(ana).hasStatus(204)

    ana.attemptsTo(FindPhoneViaApi.withSlug(phone.slug))
    theResponseTo(ana).hasStatus(404)
  })

  it('Sin iniciar sesión no se puede publicar un celular', () => {
    const api = actorCalled('Api')

    api.attemptsTo(PublishPhoneViaApi.withoutLoggingIn(TestData.phone()))

    theResponseTo(api).hasStatus(401).hasError('Token requerido')
  })
})
