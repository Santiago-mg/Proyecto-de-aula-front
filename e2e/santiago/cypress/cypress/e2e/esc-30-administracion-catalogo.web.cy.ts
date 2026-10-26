import { CatalogAdmin } from '../support/questions/Catalog'
import { PhoneDetail } from '../support/questions/Recommendations'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { PublishPhoneViaApi } from '../support/tasks/api/PhonesApi'
import { LogIn } from '../support/tasks/LogIn'
import { ChangePrice, DeletePhone, PublishPhone, TryToPublishPhone } from '../support/tasks/ManageCatalog'
import { OpenPage } from '../support/tasks/OpenPage'

/**
 * Como administradora de CelularPro
 * quiero publicar, editar y retirar celulares
 * para que la tienda muestre siempre el inventario real.
 */
describe('Administración del catálogo (ESC-30) — web', () => {
  it('[smoke] Publicar un celular y verlo en la tienda', () => {
    const ana = actorCalled('Ana')
    const valeria = actorCalled('Valeria')
    const phone = TestData.phone()

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(PublishPhone.fromTheForm(phone))
    ana.attemptsTo(OpenPage.catalogManagement())
    ana.sees(CatalogAdmin.rowOf(phone.name)).toBePresent()

    valeria.attemptsTo(OpenPage.phoneDetail(phone.slug))
    valeria.sees(PhoneDetail.name()).toEqual(phone.name)
    valeria.sees(PhoneDetail.price()).toEqual('$199.000 COP')
  })

  it('Cambiar el precio de un celular', () => {
    const ana = actorCalled('Ana')
    const valeria = actorCalled('Valeria')
    const phone = TestData.phone()

    ana.attemptsTo(StartApiSession.asAdministrator(), PublishPhoneViaApi.forTheScenario(phone))
    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(ChangePrice.of(phone).to(179000))

    valeria.attemptsTo(OpenPage.phoneDetail(phone.slug))
    valeria.sees(PhoneDetail.name()).toEqual(phone.name)
    valeria.sees(PhoneDetail.price()).toEqual('$179.000 COP')
  })

  it('Retirar un celular del catálogo', () => {
    const ana = actorCalled('Ana')
    const valeria = actorCalled('Valeria')
    const phone = TestData.phone()

    ana.attemptsTo(StartApiSession.asAdministrator(), PublishPhoneViaApi.forTheScenario(phone))
    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(DeletePhone.called(phone))
    ana.attemptsTo(OpenPage.catalogManagement())
    ana.sees(CatalogAdmin.rowOf(phone.name)).toBeAbsent()

    valeria.attemptsTo(OpenPage.phoneDetail(phone.slug))
    valeria.sees(PhoneDetail.notice('Celular no encontrado')).toBeVisible()
  })

  it('No se puede repetir el slug de otro celular', () => {
    const ana = actorCalled('Ana')

    ana.attemptsTo(LogIn.asAdministrator())
    ana.attemptsTo(TryToPublishPhone.fromTheForm({ ...TestData.phone(), slug: 'iphone-14' }))

    ana.sees(CatalogAdmin.formError()).toEqual('Ya existe un celular con ese slug')
  })
})
