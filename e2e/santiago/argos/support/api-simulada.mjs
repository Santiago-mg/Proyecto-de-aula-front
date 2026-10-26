// API simulada de CelularPro: datos fijos para que las capturas sean siempre iguales
// (una regresión visual solo sirve si lo único que cambia entre corridas es la interfaz).
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

const marcas = ['Apple', 'Samsung', 'Xiaomi', 'Motorola']
const condiciones = ['NEW', 'CERTIFIED', 'USED']

export function celular(i, extra = {}) {
  const marca = marcas[i % marcas.length]
  const cond = condiciones[i % condiciones.length]
  const nombres = ['iPhone 15 Pro', 'Galaxy S24', 'Redmi Note 13', 'Moto G84', 'iPhone 13', 'Galaxy A54', 'Poco X6', 'Edge 40']
  const nombre = nombres[i % nombres.length]
  return {
    id: `phone-${i}`,
    slug: nombre.toLowerCase().replace(/\s+/g, '-') + (i >= nombres.length ? `-${i}` : ''),
    name: nombre,
    brand: marca,
    price: 1_200_000 + i * 310_000,
    compareAt: i % 3 === 0 ? 1_900_000 + i * 310_000 : null,
    badge: i % 4 === 0 ? 'Oferta' : null,
    stock: i % 5 === 0 ? 0 : i % 5 === 1 ? 2 : 8,
    condition: cond,
    verified: cond !== 'NEW',
    batteryHealth: cond === 'NEW' ? null : 88 + (i % 10),
    storage: '128GB',
    ram: '6GB',
    shortDesc: 'Equipo revisado por el equipo técnico, con garantía.',
    heroImage: 'https://img.test/hero.png',
    category: marca.toLowerCase(),
    ...extra,
  }
}

export function telefonos(n = 8) {
  return Array.from({ length: n }, (_, i) => celular(i))
}

export function telefonoDetalle(slug) {
  const base = celular(1, { slug })
  return {
    ...base,
    categoryId: 'cat-1',
    camera: '50 MP + 12 MP',
    battery: '5000 mAh',
    screen: '6.1" OLED 120 Hz',
    chip: 'A17 Pro',
    longDesc: 'Equipo con inspección técnica de 40 puntos. Incluye cargador y garantía de 6 meses.',
    images: [
      { url: 'https://img.test/1.png', position: 0 },
      { url: 'https://img.test/2.png', position: 1 },
      { url: 'https://img.test/3.png', position: 2 },
    ],
    colors: [
      { colorId: 'c1', name: 'Negro', hex: '#111111' },
      { colorId: 'c2', name: 'Azul', hex: '#2244aa' },
    ],
    features: ['Face ID', 'USB-C', '5G'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

export const usuario = {
  id: 'u1', email: 'ana@gmail.com', name: 'Ana Pérez', role: 'USER', createdAt: '2026-01-01T00:00:00Z',
}
export const admin = {
  id: 'a1', email: 'admin@celularpro.co', name: 'Admin Root', role: 'ADMIN', createdAt: '2026-01-01T00:00:00Z',
}

export function pedido(i, estado = 'PENDING') {
  return {
    id: `o${i}`, orderRef: `CP-100${i}`, userId: 'u1', email: 'ana@gmail.com', name: 'Ana Pérez',
    phone: '3001234567', address: 'Calle 10 # 20-30', city: 'Medellín', dept: 'Antioquia',
    subtotal: 2_000_000, shipping: 0, total: 2_000_000, status: estado,
    items: [{ id: i, phoneId: 'phone-1', name: 'Galaxy S24', heroImage: null, price: 2_000_000, qty: 1, colorId: null, colorName: null }],
    createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z',
  }
}

export const estadisticas = {
  users: { total: 120, banned: 4, newThisWeek: 9, admins: 2 },
  phones: { total: 48, inStock: 40, outOfStock: 8, verified: 30 },
  orders: { total: 77, pending: 6, confirmed: 20, shipped: 11, delivered: 38, cancelled: 2, revenue: 98_000_000, revenueThisMonth: 12_000_000 },
  revenueByDay: Array.from({ length: 7 }, (_, d) => ({ date: `2026-10-${String(d + 19).padStart(2, "0")}`, amount: 400_000 + d * 90_000, count: 1 + (d % 4) })),
  recentOrders: [1, 2, 3].map((i) => ({ id: `o${i}`, orderRef: `CP-100${i}`, email: 'ana@gmail.com', name: 'Ana Pérez', total: 2_000_000, status: 'PENDING', createdAt: '2026-10-01T10:00:00Z', itemCount: 1 })),
}

export function usuariosAdmin() {
  return [
    { ...usuario, banned: false, banReason: null, bannedAt: null, orderCount: 3 },
    { id: 'u2', email: 'luis@gmail.com', name: 'Luis Gómez', role: 'USER', createdAt: '2026-02-01T00:00:00Z', banned: true, banReason: 'Fraude', bannedAt: '2026-09-01T00:00:00Z', orderCount: 1 },
    { ...admin, banned: false, banReason: null, bannedAt: null, orderCount: 0 },
  ]
}

/** Instala las respuestas simuladas de la API y de las imágenes. */
export async function instalarMocks(page, { vacio = false, fallo = false } = {}) {
  await page.route('https://img.test/**', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }))
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await page.route(/images\.unsplash\.com|plus\.unsplash\.com|picsum\.photos/, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }))
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const ruta = url.pathname.replace(/^.*\/api\/v1/, '')
    const metodo = req.method()
    const json = (cuerpo, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) })

    if (fallo) return json({ error: 'Servicio no disponible' }, 500)

    if (metodo === 'GET' && ruta === '/phones') {
      const lista = vacio ? [] : telefonos(8)
      return json({ data: lista, meta: { total: lista.length, page: 1, limit: 12, totalPages: 1 } })
    }
    if (metodo === 'GET' && /^\/phones\/[^/]+\/similares$/.test(ruta)) return json({ data: telefonos(4) })
    if (metodo === 'GET' && /^\/phones\/id\//.test(ruta)) return json({ data: telefonoDetalle('galaxy-s24') })
    if (metodo === 'GET' && /^\/phones\/[^/]+$/.test(ruta)) return json({ data: telefonoDetalle(decodeURIComponent(ruta.split('/')[2])) })
    if (metodo === 'GET' && ruta === '/orders/my') return json({ data: [pedido(1, 'SHIPPED'), pedido(2, 'PENDING'), pedido(3, 'DELIVERED')] })
    if (metodo === 'GET' && ruta === '/orders') return json({ data: [pedido(1), pedido(2, 'CONFIRMED')], meta: { total: 2, page: 1, totalPages: 1 } })
    if (metodo === 'GET' && ruta === '/admin/stats') return json({ data: estadisticas })
    if (metodo === 'GET' && ruta === '/admin/users') return json({ data: usuariosAdmin(), meta: { total: 3, page: 1, totalPages: 1 } })
    if (metodo === 'POST' && ruta === '/orders') return json({ data: pedido(9) }, 201)
    if (metodo === 'POST' && ruta === '/auth/login') return json({ data: { user: usuario, token: 'tok' } })
    return json({ data: {} })
  })
}

export function itemCarrito(i = 1) {
  return {
    key: `phone-${i}-c1`, phoneId: `phone-${i}`, name: 'iPhone 15 Pro', heroImage: 'https://img.test/hero.png',
    price: 1_800_000, qty: 1, colorId: 'c1', colorName: 'Negro',
  }
}
