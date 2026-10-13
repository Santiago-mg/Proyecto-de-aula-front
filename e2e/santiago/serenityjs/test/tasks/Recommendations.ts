import { Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';

import { PhoneDetailPage } from '../ui/PhoneDetailPage';

/** ESC-13 */
export const OpenRecommendation = {
  called: (name: string) => Task.where(`#actor abre la recomendación "${ name }"`,
    Click.on(PhoneDetailPage.recommendationCalled(name)),
    Wait.until(PhoneDetailPage.name(), isVisible()),
  ),
};
