import { actorCalled, resetCast } from './screenplay/actor'
import { TestData } from './screenplay/testData'
import { StartApiSession } from './tasks/api/ApiSession'
import { DeletePhoneViaApi } from './tasks/api/PhonesApi'

/**
 * Lo que se hace antes y después de CADA prueba. Cada archivo de pruebas lo
 * importa en su primera línea (`import '../support/hooks'`).
 *
 * Por qué no vive en `support/e2e.ts`: Cypress empaqueta ese archivo aparte de
 * cada prueba, y cada paquete trae su propia copia de los módulos. Si el
 * reinicio estuviera allá, vaciaría una copia del registro de datos distinta a
 * la que usa la prueba, y todas repetirían el mismo correo (error 409). Aquí,
 * el reinicio y la prueba comparten la misma copia.
 */

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
