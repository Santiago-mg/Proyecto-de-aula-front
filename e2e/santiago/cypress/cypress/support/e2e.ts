import { resetCast } from './screenplay/actor'
import { TestData } from './screenplay/testData'
import { actorCalled } from './screenplay/actor'
import { StartApiSession } from './tasks/api/ApiSession'
import { DeletePhoneViaApi } from './tasks/api/PhonesApi'

// Cada prueba empieza con su propio reparto y sus propios datos (otro Carlos,
// otro celular). Cypress ya limpia el navegador entre pruebas.
beforeEach(() => {
  resetCast()
  TestData.reset()
})

// Los celulares que publicó la prueba se borran al terminar, pase o falle,
// para no dejar basura en el catálogo ni cambiar lo que ven las otras pruebas.
afterEach(() => {
  const phones = TestData.phonesToRemove()
  if (phones.length === 0) return
  actorCalled('Ana').attemptsTo(
    StartApiSession.asAdministrator(),
    ...phones.map((phone) => DeletePhoneViaApi.called(phone)),
  )
})
