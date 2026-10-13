import { By, PageElement, PageElements } from '@serenity-js/web';

const RECOMMENDATIONS = "//section[@aria-labelledby='titulo-similares']";

export const PhoneDetailPage = {
  name: () => PageElement.located(By.css('h1.cp-detail-name')).describedAs('nombre del celular'),
  price: () => PageElement.located(By.css('.cp-detail-price')).describedAs('precio del celular'),
  notice: (text: string) => PageElement.located(By.xpath(`//h2[normalize-space()='${ text }']`))
    .describedAs(`aviso "${ text }"`),

  // ESC-13: sección "También te puede interesar"
  recommendations: () => PageElement.located(By.xpath(RECOMMENDATIONS))
    .describedAs('sección "También te puede interesar"'),
  recommendedNames: () => PageElements.located(By.xpath(`${ RECOMMENDATIONS }//h3[contains(@class, 'cp-phone-card-name')]`))
    .describedAs('nombres de los celulares recomendados'),
  recommendationCalled: (name: string) => PageElement.located(
    By.xpath(`${ RECOMMENDATIONS }//a[.//h3[normalize-space()='${ name }']]`),
  ).describedAs(`recomendación "${ name }"`),
};
