import { Task } from '@serenity-js/core'
import { Navigate } from '@serenity-js/web'
import { pageAt } from '../support/environment'

export const Navegar = {
  // Asegúrate de usar la ruta correcta configurada en tu React Router
  alCatalogo: () => Task.where(`#actor navega al catálogo de celulares`,
    Navigate.to(pageAt('/catalog')) 
  ),
  // Añade esta nueva tarea:
  aFavoritos: () => Task.where(`#actor navega a su lista de favoritos`,
    // Ajusta '/favorites' si tu ruta en react-router es distinta (ej. '/favoritos')
    Navigate.to(pageAt('/favoritos')) 
  ),
  alLogin: () => Task.where(`#actor navega al login`,
    Navigate.to(pageAt('/login'))),
  aGestionOrdenes: () => Task.where(`#actor navega a la gestión de órdenes`, 
    Navigate.to(pageAt('/admin/orders'))),
  aGestionUsuarios: () => Task.where(`#actor navega a la gestión de usuarios`, Navigate.to(pageAt('/admin/users')))
}