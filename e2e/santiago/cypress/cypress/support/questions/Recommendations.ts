import { textOf, textsOf } from '../screenplay/question'
import { PhoneDetailPage } from '../ui/pages'

/** ESC-13 */
export const Recommendations = {
  names: () => textsOf('celulares recomendados', PhoneDetailPage.recommendedNames),
  section: () => textOf('sección "También te puede interesar"', PhoneDetailPage.recommendations),
}

/** ESC-13 y ESC-30: la ficha de un celular */
export const PhoneDetail = {
  name: () => textOf('nombre del celular', PhoneDetailPage.name),
  price: () => textOf('precio del celular', PhoneDetailPage.price),
  notice: (text: string) => textOf(`aviso "${text}"`, () => PhoneDetailPage.notice(text)),
}
