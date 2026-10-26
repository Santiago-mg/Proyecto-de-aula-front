import { theResponseTo } from '../support/questions/Api'
import { actorCalled } from '../support/screenplay/actor'
import { GetRecommendations } from '../support/tasks/api/PhonesApi'

describe('Recomendación de productos (ESC-13) — API', () => {
  it('Consultar las recomendaciones por la API', () => {
    const api = actorCalled('Api')

    api.attemptsTo(GetRecommendations.for('iphone-15-pro-max'))

    theResponseTo(api)
      .hasStatus(200)
      .satisfies('la respuesta trae los celulares recomendados', (body) => {
        const names = (body.data as Array<{ name: string }>).map((phone) => phone.name)
        expect(names).to.deep.equal(['iPhone 14', 'iPhone 13 (Usado)', 'Samsung Galaxy S24 Ultra'])
      })
  })

  it('Pedir recomendaciones de un celular que no existe', () => {
    const api = actorCalled('Api')

    api.attemptsTo(GetRecommendations.for('celular-que-no-existe'))

    theResponseTo(api).hasStatus(404).hasError('Celular no encontrado')
  })

  it('Pedir más recomendaciones de las permitidas', () => {
    const api = actorCalled('Api')

    api.attemptsTo(GetRecommendations.forWithLimit('iphone-15-pro-max', 13))

    theResponseTo(api).hasStatus(400).hasError('Datos inválidos')
  })
})
