import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminUsers } from '../../../src/pages/admin/AdminUsers'
import type { AdminUser } from '../../../src/types/admin'

// Basado en: AdminUsers.tsx — confirmación antes de cambiar un rol y diálogos accesibles

const useAuthMock = vi.fn()
vi.mock('../../../src/context/AuthContext', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../../../src/services/admin.service', () => ({
  adminService: { getUsers: vi.fn(), banUser: vi.fn(), unbanUser: vi.fn(), changeRole: vi.fn() },
}))
import { adminService } from '../../../src/services/admin.service'

function fila(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-2', email: 'otro@gmail.com', name: 'Otro Usuario', role: 'USER', createdAt: '2026-01-01T00:00:00.000Z',
    banned: false, banReason: null, bannedAt: null, orderCount: 0, ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthMock.mockReturnValue({ user: { id: 'admin-1', email: 'yo@gmail.com', name: 'Yo', role: 'ADMIN', createdAt: '' } })
})

async function abrir(usuarios: AdminUser[]) {
  vi.mocked(adminService.getUsers).mockResolvedValue({ data: usuarios, meta: { total: usuarios.length, page: 1, totalPages: 1 } })
  render(<AdminUsers />)
  return (await screen.findByText(usuarios[0].email)).closest('tr') as HTMLElement
}

describe('AdminUsers — el cambio de rol pide confirmación', () => {
  it('el primer clic abre el diálogo y NO cambia el rol todavía', async () => {
    const user = userEvent.setup()
    const f = await abrir([fila()])

    await user.click(within(f).getByRole('button', { name: /hacer admin/i }))

    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText('Hacer administrador')).to.exist
    expect(within(dialogo).getByText(/Otro Usuario/)).to.exist
    expect(vi.mocked(adminService.changeRole).mock.calls).to.be.empty
  })

  it('confirmar aplica el cambio con el rol correcto y cierra el diálogo', async () => {
    const user = userEvent.setup()
    vi.mocked(adminService.changeRole).mockResolvedValue(fila({ role: 'ADMIN' }))
    const f = await abrir([fila()])

    await user.click(within(f).getByRole('button', { name: /hacer admin/i }))
    await user.click(screen.getByRole('button', { name: 'Sí, hacer admin' }))

    await waitFor(() => expect(vi.mocked(adminService.changeRole).mock.calls).to.deep.equal([['user-2', 'ADMIN']]))
    expect(screen.queryByRole('dialog')).to.be.null
  })

  it('Cancelar cierra el diálogo sin cambiar nada', async () => {
    const user = userEvent.setup()
    const f = await abrir([fila()])

    await user.click(within(f).getByRole('button', { name: /hacer admin/i }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).to.be.null
    expect(vi.mocked(adminService.changeRole).mock.calls).to.be.empty
  })

  it('Escape también cierra el diálogo sin cambiar nada', async () => {
    const user = userEvent.setup()
    const f = await abrir([fila()])

    await user.click(within(f).getByRole('button', { name: /hacer admin/i }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).to.be.null
    expect(vi.mocked(adminService.changeRole).mock.calls).to.be.empty
  })

  it('quitar el rol avisa que se pierde el acceso al panel de inmediato', async () => {
    const user = userEvent.setup()
    const f = await abrir([fila({ id: 'admin-2', email: 'colega@gmail.com', name: 'Colega', role: 'ADMIN' })])

    await user.click(within(f).getByRole('button', { name: /quitar admin/i }))

    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText('Quitar administrador')).to.exist
    expect(within(dialogo).getByText(/Perderá el acceso al panel de inmediato/)).to.exist
    expect(within(dialogo).getByRole('button', { name: 'Sí, quitar admin' })).to.exist
  })

  it('el diálogo de baneo también es accesible: role="dialog", título asociado y Escape', async () => {
    const user = userEvent.setup()
    const f = await abrir([fila()])

    await user.click(within(f).getByRole('button', { name: /banear/i }))

    const dialogo = screen.getByRole('dialog', { name: 'Banear usuario' })
    expect(dialogo.getAttribute('aria-modal')).to.equal('true')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).to.be.null
    expect(vi.mocked(adminService.banUser).mock.calls).to.be.empty
  })
})
