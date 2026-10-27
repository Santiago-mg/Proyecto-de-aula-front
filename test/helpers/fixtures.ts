import type { AdminStats, AdminUser } from '../../src/types/admin'
import type { User } from '../../src/types/auth'
import type { CartItem, Order } from '../../src/types/order'
import type { Phone, PhoneListItem } from '../../src/types/phone'

// Datos de prueba con la forma exacta que devuelve el backend. Cada función
// arma una fila válida y deja sobreescribir lo que la prueba necesite.

export const CLAVE = 'Clave-Segura-123'
export const TOKEN_USUARIO = 'token-de-usuario'
export const TOKEN_ADMIN = 'token-de-admin'

export function usuario(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'mario@gmail.com',
    name: 'Mario Andrade',
    role: 'USER',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function administrador(overrides: Partial<User> = {}): User {
  return usuario({ id: 'admin-1', email: 'admin@gmail.com', name: 'Admin General', role: 'ADMIN', ...overrides })
}

// Fila del listado de usuarios del panel (GET /admin/users)
export function filaUsuario(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    ...usuario({ id: 'user-2', email: 'ana@gmail.com', name: 'Ana Torres' }),
    banned: false,
    banReason: null,
    bannedAt: null,
    orderCount: 2,
    ...overrides,
  }
}

export function celular(overrides: Partial<PhoneListItem> = {}): PhoneListItem {
  return {
    id: 'phone-1',
    slug: 'iphone-15',
    name: 'iPhone 15',
    brand: 'Apple',
    price: 3_000_000,
    compareAt: null,
    badge: null,
    stock: 8,
    condition: 'NEW',
    verified: true,
    batteryHealth: null,
    storage: '128GB',
    ram: '6GB',
    shortDesc: 'El iPhone de este año',
    heroImage: null,
    category: 'apple',
    ...overrides,
  }
}

export function celularCompleto(overrides: Partial<Phone> = {}): Phone {
  return {
    ...celular(),
    categoryId: 'apple',
    camera: '48MP',
    battery: '3349 mAh',
    screen: '6.1" OLED',
    chip: 'A16 Bionic',
    longDesc: 'Descripción larga del equipo.',
    images: [],
    colors: [
      { colorId: 'negro', name: 'Negro', hex: '#000000' },
      { colorId: 'azul', name: 'Azul', hex: '#3b5bdb' },
    ],
    features: ['Face ID', 'USB-C'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function itemCarrito(overrides: Partial<CartItem> = {}): CartItem {
  return {
    key: 'phone-1-negro',
    phoneId: 'phone-1',
    name: 'iPhone 15',
    heroImage: null,
    price: 3_000_000,
    qty: 1,
    colorId: 'negro',
    colorName: 'Negro',
    ...overrides,
  }
}

export function pedido(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    orderRef: 'CP-0001',
    userId: 'user-1',
    email: 'mario@gmail.com',
    name: 'Mario Andrade',
    phone: '3001234567',
    address: 'Calle 10 # 43-25',
    city: 'Medellín',
    dept: 'Antioquia',
    subtotal: 3_000_000,
    shipping: 0,
    total: 3_000_000,
    status: 'PENDING',
    items: [
      {
        id: 1,
        phoneId: 'phone-1',
        name: 'iPhone 15',
        heroImage: null,
        price: 3_000_000,
        qty: 1,
        colorId: 'negro',
        colorName: 'Negro',
      },
    ],
    createdAt: '2026-03-10T15:00:00.000Z',
    updatedAt: '2026-03-10T15:00:00.000Z',
    ...overrides,
  }
}

// Siete días sin ventas, como el panel de un catálogo recién abierto
export function sieteDias(): AdminStats['revenueByDay'] {
  return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((date) => ({ date, amount: 0, count: 0 }))
}

export function estadisticas(overrides: Partial<AdminStats> = {}): AdminStats {
  return {
    users: { total: 120, banned: 3, newThisWeek: 5, admins: 2 },
    phones: { total: 40, inStock: 30, outOfStock: 10, verified: 25 },
    orders: {
      total: 60,
      pending: 4,
      confirmed: 10,
      shipped: 8,
      delivered: 35,
      cancelled: 3,
      revenue: 50_000_000,
      revenueThisMonth: 8_000_000,
    },
    revenueByDay: sieteDias(),
    recentOrders: [],
    ...overrides,
  }
}

export function paginado<T>(data: T[], meta: Partial<{ total: number; page: number; limit: number; totalPages: number }> = {}) {
  return { data, meta: { total: data.length, page: 1, limit: 20, totalPages: 1, ...meta } }
}

// Sesión guardada en el navegador, como la deja AuthContext tras un login
export function sesionIniciada(user: User = usuario(), token = TOKEN_USUARIO) {
  localStorage.setItem('cp_user', JSON.stringify(user))
  localStorage.setItem('cp_token', token)
}

export function sesionDeAdmin(user: User = administrador()) {
  sesionIniciada(user, TOKEN_ADMIN)
}


/** Alerta de inventario tal como la devuelve GET /admin/alerts. */
export function alertaDeStock(cambios: Record<string, unknown> = {}) {
  const phone = {
    id: 'phone-1', name: 'iPhone 15 Pro', slug: 'iphone-15-pro', stock: 3, minStock: 5, heroImage: null,
    ...((cambios.phone as object) ?? {}),
  }
  return {
    id: 'alerta-1', phoneId: phone.id, type: 'LOW_STOCK',
    message: `"${phone.name}" tiene ${phone.stock} unidades, en o por debajo del mínimo de ${phone.minStock}.`,
    isResolved: false, createdAt: '2026-10-07T14:30:00.000Z',
    ...cambios, phone,
  }
}
