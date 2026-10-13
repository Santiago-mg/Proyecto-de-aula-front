import { asegurarCliente, crearPedidoPendiente, desbanearATodos } from './api'

/**
 * Se ejecuta una vez antes de todas las pruebas (globalSetup de Playwright).
 * Las especificaciones originales suponían una base ya preparada a mano:
 *  - un cliente test@test.com / password123,
 *  - un pedido que se pueda cancelar,
 *  - ningún usuario baneado.
 */
export default async function prepararDatos(): Promise<void> {
  await desbanearATodos()
  const token = await asegurarCliente()
  await crearPedidoPendiente(token)
}
