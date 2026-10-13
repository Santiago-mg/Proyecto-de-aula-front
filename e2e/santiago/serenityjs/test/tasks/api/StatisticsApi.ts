import { Task } from '@serenity-js/core';
import { GetRequest, Send } from '@serenity-js/rest';

import { withTheToken } from './ApiSession';

/** ESC-29 por la API. */
export const GetStatistics = {
  viaApi: () => Task.where('#actor consulta las estadísticas por la API',
    Send.a(GetRequest.to('admin/stats').using(withTheToken())),
  ),
};
