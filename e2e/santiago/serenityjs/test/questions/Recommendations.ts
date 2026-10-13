import { Text } from '@serenity-js/web';

import { PhoneDetailPage } from '../ui/PhoneDetailPage';
import { TextAsWritten } from './TextAsWritten';

/** ESC-13 */
export const Recommendations = {
  names: () => TextAsWritten.ofAll(PhoneDetailPage.recommendedNames()).describedAs('celulares recomendados'),
};

export const PhoneDetail = {
  name: () => TextAsWritten.of(PhoneDetailPage.name()).describedAs('nombre del celular'),
  price: () => Text.of(PhoneDetailPage.price()).describedAs('precio del celular'),
};
