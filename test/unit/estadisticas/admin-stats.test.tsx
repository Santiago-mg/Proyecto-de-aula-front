import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminStats } from '../../../src/pages/admin/AdminStats'
import { adminService } from '../../../src/services/admin.service'
import type { AdminStats as StatsType } from '../../../src/types/admin'

// ESC-29 — Panel de estadísticas
// Basado en: AdminStats.tsx — carga de estadísticas (loading/error/success) + maxRevenue

vi.mock('../../../src/services/admin.service', () => ({
  adminService: {
    getStats: vi.fn(),
  },
}))

function makeStats(overrides: Partial<StatsType> = {}): StatsType {
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
      revenue: 50000000,
      revenueThisMonth: 8000000,
    },
    revenueByDay: [
      { date: 'Lun', amount: 0, count: 0 },
      { date: 'Mar', amount: 0, count: 0 },
    ],
    recentOrders: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminStats — carga y render de estadísticas', () => {
  // Camino 1,2,F — la promesa de getStats() todavía no resuelve
  it('muestra el indicador de carga mientras se calculan las estadísticas', () => {
    // Arrange
    vi.mocked(adminService.getStats).mockReturnValue(new Promise<StatsType>(() => {}))

    // Act
    render(<AdminStats />)

    // Assert
    expect(screen.queryByText(/calculando estadísticas/i)).to.exist
  })

  // Camino 1,3,4,F — getStats() falla y stats permanece null
  it('muestra un mensaje de error si no se pueden cargar las estadísticas', async () => {
    // Arrange
    vi.mocked(adminService.getStats).mockRejectedValue(new Error('network error'))

    // Act
    render(<AdminStats />)

    // Assert
    expect(await screen.findByText('Error')).to.exist
  })

  // Camino 1,3,5,6,F — getStats() resuelve; el cálculo de maxRevenue no rompe con revenueByDay en cero
  it('renderiza el resumen sin errores cuando todos los días tienen revenue en 0 (protección de división por 0)', async () => {
    // Arrange
    vi.mocked(adminService.getStats).mockResolvedValue(makeStats())

    // Act
    render(<AdminStats />)

    // Assert
    expect(await screen.findByText('Estadísticas')).to.exist
    expect(screen.queryByText('120')).to.exist
    expect(screen.queryAllByText('—')).to.have.lengthOf(2)
  })
})
