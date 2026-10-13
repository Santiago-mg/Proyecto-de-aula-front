import { Answerable, Question } from '@serenity-js/core';
import { PageElement, PageElements } from '@serenity-js/web';
import { Locator } from 'playwright';

/**
 * El texto tal como está escrito en el HTML.
 *
 * Text.of devuelve el texto como se ve en pantalla, con el CSS aplicado, y
 * CelularPro muestra en mayúsculas los nombres de los celulares y las
 * insignias ("IPHONE 14", "BANEADO"). Para comparar con el nombre real
 * ("iPhone 14") se lee el textContent del elemento, que no depende del estilo.
 */
const writtenTextOf = async (element: PageElement): Promise<string> => {
  const locator = await element.nativeElement() as Locator;
  return (await locator.textContent() ?? '').trim();
};

export const TextAsWritten = {
  of: (element: Answerable<PageElement>) =>
    Question.about(`el texto de ${ element }`, async actor =>
      writtenTextOf(await actor.answer(element))),

  ofAll: (elements: PageElements) =>
    Question.about(`los textos de ${ elements }`, async actor => {
      const found = await actor.answer(elements);
      return Promise.all(found.map(writtenTextOf));
    }),
};
