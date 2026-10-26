import { textOf } from '../screenplay/question'
import { AdminPanelPage, StatisticsPage } from '../ui/pages'

const toNumber = (text: string): number => Number.parseInt(text.replace(/\D/g, ''), 10)

/** ESC-29 */
export const Statistics = {
  // Tarjetas del panel principal (/admin)
  indicator: (label: string) => textOf(`indicador "${label}"`, () => AdminPanelPage.indicator(label), toNumber),
  // Filas de /admin/stats
  value: (label: string) => textOf(`"${label}" en estadísticas`, () => StatisticsPage.value(label), toNumber),
}
