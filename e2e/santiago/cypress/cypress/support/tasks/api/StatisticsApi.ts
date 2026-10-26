import type { Task } from '../../screenplay/actor'
import { send } from './ApiSession'

/** ESC-29 por la API. */
export const GetStatistics = {
  viaApi:
    (): Task =>
    (actor) => {
      send(actor, 'GET', 'admin/stats', { authenticated: true })
    },
}
