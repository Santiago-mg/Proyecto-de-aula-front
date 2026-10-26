import { Recommendations, PhoneDetail } from '../support/questions/Recommendations'
import { actorCalled } from '../support/screenplay/actor'
import { TestData } from '../support/screenplay/testData'
import { StartApiSession } from '../support/tasks/api/ApiSession'
import { PublishPhoneViaApi } from '../support/tasks/api/PhonesApi'
import { OpenPage } from '../support/tasks/OpenPage'
import { OpenRecommendation } from '../support/tasks/Recommendations'

/**
 * Como cliente que está mirando un celular
 * quiero ver otros celulares parecidos
 * para comparar antes de decidir mi compra.
 */
describe('Recomendación de productos (ESC-13) — web', () => {
  it('[smoke] Ver celulares parecidos al que se está mirando', () => {
    const valeria = actorCalled('Valeria')

    valeria.attemptsTo(OpenPage.phoneDetail('iphone-15-pro-max'))

    valeria
      .sees(Recommendations.names())
      .toEqual(['iPhone 14', 'iPhone 13 (Usado)', 'Samsung Galaxy S24 Ultra'])
  })

  it('Abrir una recomendación lleva a la ficha de ese celular', () => {
    const valeria = actorCalled('Valeria')

    valeria.attemptsTo(OpenPage.phoneDetail('iphone-15-pro-max'))
    valeria.attemptsTo(OpenRecommendation.called('iPhone 14'))

    valeria.sees(PhoneDetail.name()).toEqual('iPhone 14')
    valeria.sees(Recommendations.names()).toInclude('iPhone 15 Pro Max')
    // Primero que la sección esté en pantalla, para no dar por buena una lista que no llegó.
    valeria.sees(Recommendations.section()).toBePresent()
    valeria.sees(Recommendations.names()).toNotInclude('iPhone 14')
  })

  // Scenario Outline del .feature: la misma prueba con dos ejemplos.
  const stockExamples = [
    { stock: 3, appears: true },
    { stock: 0, appears: false },
  ]

  for (const { stock, appears } of stockExamples) {
    it(`Solo se recomiendan celulares que tienen stock (stock ${stock}: ${appears ? 'aparece' : 'no aparece'})`, () => {
      const ana = actorCalled('Ana')
      const valeria = actorCalled('Valeria')
      const published = TestData.phoneSimilarToTheIphone15ProMax(stock)

      ana.attemptsTo(StartApiSession.asAdministrator(), PublishPhoneViaApi.forTheScenario(published))
      valeria.attemptsTo(OpenPage.phoneDetail('iphone-15-pro-max'))

      if (appears) {
        valeria.sees(Recommendations.names()).toInclude(published.name)
      } else {
        valeria.sees(Recommendations.section()).toBePresent()
        valeria.sees(Recommendations.names()).toNotInclude(published.name)
      }
    })
  }
})
