import { environment } from './environment'

/** Llamadas directas a la API para preparar y limpiar datos (no son parte de lo que se prueba). */

async function llamar<T = any>(ruta: string, opciones: { method?: string; token?: string; body?: unknown } = {}): Promise<{ status: number; json: T }> {
  const respuesta = await fetch(`${environment.apiUrl}${ruta}`, {
    method: opciones.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(opciones.token ? { authorization: `Bearer ${opciones.token}` } : {}),
    },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  })
  const texto = await respuesta.text()
  return { status: respuesta.status, json: texto ? JSON.parse(texto) : (undefined as T) }
}

export async function iniciarSesion(email: string, password: string): Promise<string> {
  const r = await llamar('/auth/login', { method: 'POST', body: { email, password } })
  if (r.status !== 200) throw new Error(`No se pudo iniciar sesión como ${email}: HTTP ${r.status}`)
  return r.json.data.token as string
}

/** Crea el cliente de las especificaciones si todavía no existe. */
export async function asegurarCliente(): Promise<string> {
  const { name, email, password } = environment.cliente
  await llamar('/auth/register', { method: 'POST', body: { name, email, password } }) // 409 si ya existe
  return iniciarSesion(email, password)
}

/** Deja un pedido PENDIENTE reciente, para que "el primer pedido de la tabla" sea uno que se pueda cancelar. */
export async function crearPedidoPendiente(tokenCliente: string): Promise<void> {
  const celulares = await llamar('/phones?limit=20')
  const conStock = (celulares.json.data as Array<{ id: string; stock: number }>).find((p) => p.stock > 0)
  if (!conStock) throw new Error('No hay celulares con stock para crear un pedido de prueba')
  const r = await llamar('/orders', {
    method: 'POST',
    token: tokenCliente,
    body: {
      email: environment.cliente.email,
      name: environment.cliente.name,
      phone: '3001234567',
      address: 'Calle 1 # 2-3',
      city: 'Medellín',
      dept: 'Antioquia',
      items: [{ phoneId: conStock.id, qty: 1 }],
    },
  })
  if (r.status !== 201) throw new Error(`No se pudo crear el pedido de prueba: HTTP ${r.status}`)
}

/** Quita todos los baneos (los de corridas anteriores y los que dejó una prueba que falló a la mitad). */
export async function desbanearATodos(): Promise<void> {
  const token = await iniciarSesion(environment.admin.email, environment.admin.password)
  // La API entrega como máximo 50 usuarios por página.
  for (let pagina = 1, totalPaginas = 1; pagina <= totalPaginas; pagina++) {
    const lista = await llamar(`/admin/users?limit=50&page=${pagina}`, { token })
    if (lista.status !== 200) throw new Error(`No se pudo listar los usuarios: HTTP ${lista.status}`)
    totalPaginas = lista.json.meta.totalPages as number
    for (const u of lista.json.data as Array<{ id: string; banned: boolean }>) {
      if (u.banned) await llamar(`/admin/users/${u.id}/unban`, { method: 'PUT', token })
    }
  }
}
