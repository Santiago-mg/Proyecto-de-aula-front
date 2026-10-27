import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminUsers } from '../../../src/pages/admin/AdminUsers'
import type { AdminUser } from '../../../src/types/admin'

// ESC-27 — Desbanear usuario
// Basado en: AdminUsers.tsx — handleUnban() + adminService.unbanUser()

const useAuthMock = vi.fn()
vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

const unbanUserMock = vi.fn()
vi.mock('../../../src/services/admin.service', () => ({
  adminService: {
    getUsers: vi.fn(),
    banUser: vi.fn(),
    unbanUser: (...args: unknown[]) => unbanUserMock(...args),
    changeRole: vi.fn(),
  },
}))

import { adminService } from '../../../src/services/admin.service'

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-3',
    email: 'baneado@gmail.com',
    name: 'Usuario Baneado',
    role: 'USER',
    createdAt: '2026-01-01T00:00:00.000Z',
    banned: true,
    banReason: 'spam',
    bannedAt: '2026-01-02T00:00:00.000Z',
    orderCount: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthMock.mockReturnValue({
    user: { id: 'admin-1', email: 'admin@gmail.com', name: 'Admin', role: 'ADMIN', createdAt: '' },
  })
})

describe('AdminUsers — desbaneo confirmado', () => {
  // Camino 1,2,3,4,F — unbanUser() resuelve sin error
  it('llama a adminService.unbanUser(id) y refleja el estado "Activo" al confirmar', async () => {
    // Arrange
    vi.mocked(adminService.getUsers).mockResolvedValue({
      data: [makeUser()],
      meta: { total: 1, page: 1, totalPages: 1 },
    })
    unbanUserMock.mockResolvedValue(makeUser({ banned: false, banReason: null, bannedAt: null }))
    const user = userEvent.setup()
    render(<AdminUsers />)
    await screen.findByText('Usuario Baneado')

    // Act
    await user.click(screen.getByRole('button', { name: /desbanear/i }))

    // Assert
    await waitFor(() => {
      expect(unbanUserMock.mock.calls).to.deep.include(['user-3'])
    })
    await waitFor(() => {
      expect(screen.queryByText(/activo/i)).to.exist
    })
  })

  // Camino 1,2,5,F — el botón permanece deshabilitado mientras la petición está en curso
  it('deshabilita el botón "Desbanear" mientras la petición está en curso', async () => {
    // Arrange
    vi.mocked(adminService.getUsers).mockResolvedValue({
      data: [makeUser()],
      meta: { total: 1, page: 1, totalPages: 1 },
    })
    // La petición nunca termina: así el botón queda en el estado "en curso"
    unbanUserMock.mockReturnValue(new Promise<AdminUser>(() => {}))
    const user = userEvent.setup()
    render(<AdminUsers />)
    await screen.findByText('Usuario Baneado')
    const btn = screen.getByRole('button', { name: /desbanear/i })

    // Act
    await user.click(btn)

    // Assert
    expect(btn).to.have.property('disabled', true)
  })
})
