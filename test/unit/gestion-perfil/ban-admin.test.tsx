import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { AdminUsers } from '../../../src/pages/admin/AdminUsers'
import type { AdminUser } from '../../../src/types/admin'

// Basado en: AdminUsers.tsx — D-13: el backend no deja banear a un admin (403),
// así que la pantalla no ofrece el botón y explica qué hacer.

const useAuthMock = vi.fn()
vi.mock('../../../src/context/AuthContext', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../../../src/services/admin.service', () => ({
  adminService: { getUsers: vi.fn(), banUser: vi.fn(), unbanUser: vi.fn(), changeRole: vi.fn() },
}))
import { adminService } from '../../../src/services/admin.service'

function fila(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-2', email: 'otro@gmail.com', name: 'Otro', role: 'USER', createdAt: '2026-01-01T00:00:00.000Z',
    banned: false, banReason: null, bannedAt: null, orderCount: 0, ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthMock.mockReturnValue({ user: { id: 'admin-1', email: 'yo@gmail.com', name: 'Yo', role: 'ADMIN', createdAt: '' } })
})

async function filaDe(correo: string, usuarios: AdminUser[]) {
  vi.mocked(adminService.getUsers).mockResolvedValue({ data: usuarios, meta: { total: usuarios.length, page: 1, totalPages: 1 } })
  render(<AdminUsers />)
  return (await screen.findByText(correo)).closest('tr')!
}

describe('AdminUsers — no se ofrece banear a otro administrador', () => {
  it('en la fila de otro admin no hay botón Banear y sí la explicación', async () => {
    const f = await filaDe('colega@gmail.com', [fila({ id: 'admin-2', email: 'colega@gmail.com', role: 'ADMIN' })])
    expect(within(f).queryByRole('button', { name: /banear/i })).to.be.null
    expect(within(f).getByText('Para banearlo, quita primero el rol admin')).to.exist
  })

  it('el admin sigue pudiendo quitarle el rol a ese colega (el paso previo)', async () => {
    const f = await filaDe('colega@gmail.com', [fila({ id: 'admin-2', email: 'colega@gmail.com', role: 'ADMIN' })])
    expect(within(f).getByRole('button', { name: /quitar admin/i })).to.exist
  })

  it('a un usuario común sí se le puede banear', async () => {
    const f = await filaDe('otro@gmail.com', [fila()])
    expect(within(f).getByRole('button', { name: /banear/i })).to.exist
    expect(within(f).queryByText('Para banearlo, quita primero el rol admin')).to.be.null
  })

  it('un admin que ya estaba baneado (antes de la regla) conserva el botón Desbanear', async () => {
    const f = await filaDe('colega@gmail.com', [fila({ id: 'admin-2', email: 'colega@gmail.com', role: 'ADMIN', banned: true, banReason: 'antiguo' })])
    expect(within(f).getByRole('button', { name: /desbanear/i })).to.exist
  })
})
