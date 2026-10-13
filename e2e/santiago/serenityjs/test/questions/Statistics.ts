import { LastResponse } from '@serenity-js/rest';
import { Text } from '@serenity-js/web';

import { AdminPanelPage, StatisticsPage } from '../ui/AdminPanelPage';

export interface StatsResponse {
  data: {
    users: { total: number; banned: number };
    phones: { total: number };
    revenueByDay: Array<{ date: string; amount: number; count: number }>;
  };
}

const toNumber = (text: string) => Number.parseInt(text.replace(/\D/g, ''), 10);

/** ESC-29 */
export const Statistics = {
  // Tarjetas del panel principal (/admin)
  indicator: (label: string) => Text.of(AdminPanelPage.indicator(label)).as(toNumber)
    .describedAs(`indicador "${ label }"`),
  // Filas de /admin/stats
  value: (label: string) => Text.of(StatisticsPage.value(label)).as(toNumber)
    .describedAs(`"${ label }" en estadísticas`),
  // Lo que respondió GET /admin/stats
  fromTheApi: () => LastResponse.body<StatsResponse>().data,
};
