import type { User } from './auth'

// Alerta de inventario. El backend decide el tipo con una regla única: sin
// unidades es OUT_OF_STOCK; en o por debajo del mínimo es LOW_STOCK.
export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK'

export interface StockAlert {
  id: string
  phoneId: string
  type: AlertType
  message: string
  isResolved: boolean
  createdAt: string
  phone: {
    id: string
    name: string
    slug: string
    stock: number
    minStock: number
    heroImage: string | null
  }
}

export interface AdminStats {
  users: {
    total: number
    banned: number
    newThisWeek: number
    admins: number
  }
  phones: {
    total: number
    inStock: number
    outOfStock: number
    verified: number
  }
  orders: {
    total: number
    pending: number
    confirmed: number
    shipped: number
    delivered: number
    cancelled: number
    revenue: number
    revenueThisMonth: number
  }
  revenueByDay: Array<{ date: string; amount: number; count: number }>
  recentOrders: Array<{
    id: string
    orderRef: string
    email: string
    name: string
    total: number
    status: string
    createdAt: string
    itemCount: number
  }>
}

export interface AdminUser extends User {
  banned: boolean
  banReason: string | null
  bannedAt: string | null
  orderCount: number
}
