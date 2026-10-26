import type { Task } from '../screenplay/actor'
import { PhoneDetailPage } from '../ui/pages'

/** ESC-13 */
export const OpenRecommendation = {
  called:
    (name: string): Task =>
    () => {
      PhoneDetailPage.recommendationCalled(name).click()
      PhoneDetailPage.name().should('be.visible')
    },
}
