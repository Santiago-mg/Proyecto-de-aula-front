import { Ensure, equals } from '@serenity-js/assertions';
import { Check, Interaction, Question, Task } from '@serenity-js/core';
import { DeleteRequest, GetRequest, LastResponse, PostRequest, Send } from '@serenity-js/rest';

import { TestPhone } from '../../support/testData';
import { withTheToken } from './ApiSession';

interface PhoneResponse {
  data: { id: string; slug: string; name: string };
}

const bodyOf = (phone: TestPhone) => ({
  name: phone.name,
  slug: phone.slug,
  brand: phone.brand,
  categoryId: phone.categoryId,
  price: phone.price,
  stock: phone.stock,
  condition: 'NEW',
});

const RememberThePublishedPhone = {
  of: (phone: TestPhone) => Interaction.where(`#actor anota el id de "${ phone.name }"`, async actor => {
    const response = await actor.answer(LastResponse.body<PhoneResponse>());
    phone.id = response.data.id;
  }),
};

/** ESC-30 por la API. Necesita una sesión de API iniciada (StartApiSession). */
export const PublishPhoneViaApi = {
  called: (phone: TestPhone) => Task.where(`#actor publica por la API "${ phone.name }"`,
    Send.a(PostRequest.to('phones').with(bodyOf(phone)).using(withTheToken())),
  ),
  // Para preparar datos: además comprueba que quedó publicado.
  forTheScenario: (phone: TestPhone) => Task.where(`#actor deja publicado por la API "${ phone.name }"`,
    Send.a(PostRequest.to('phones').with(bodyOf(phone)).using(withTheToken())),
    Ensure.that(LastResponse.status(), equals(201)),
    RememberThePublishedPhone.of(phone),
  ),
  withoutLoggingIn: (phone: TestPhone) => Task.where(`#actor intenta publicar "${ phone.name }" sin iniciar sesión`,
    Send.a(PostRequest.to('phones').with(bodyOf(phone))),
  ),
};

export const FindPhoneViaApi = {
  withSlug: (slug: string) => Task.where(`#actor busca por la API el celular "${ slug }"`,
    Send.a(GetRequest.to(`phones/${ slug }`)),
  ),
};

/** Borra el celular si existe. Lo usa la limpieza después de cada escenario. */
export const DeletePhoneViaApi = {
  called: (phone: TestPhone) => Task.where(`#actor elimina por la API "${ phone.name }"`,
    FindPhoneViaApi.withSlug(phone.slug),
    Check.whether(LastResponse.status(), equals(200)).andIfSo(
      Send.a(DeleteRequest
        .to(Question.about('ruta', async actor =>
          `phones/${ (await actor.answer(LastResponse.body<PhoneResponse>())).data.id }`))
        .using(withTheToken())),
    ),
  ),
};

/** ESC-13 por la API (es pública: no necesita sesión). */
export const GetRecommendations = {
  for: (slug: string) => Task.where(`#actor consulta las recomendaciones de "${ slug }"`,
    Send.a(GetRequest.to(`phones/${ slug }/similares`)),
  ),
  forWithLimit: (slug: string, limit: number) => Task.where(`#actor consulta ${ limit } recomendaciones de "${ slug }"`,
    Send.a(GetRequest.to(`phones/${ slug }/similares?limit=${ limit }`)),
  ),
};
