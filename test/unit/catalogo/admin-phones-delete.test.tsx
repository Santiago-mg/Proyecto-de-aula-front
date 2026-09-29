import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AdminPhones } from '../../../src/pages/admin/AdminPhones'
import { phonesService } from '../../../src/services/phones.service'
import type { PhoneListItem } from '../../../src/types/phone'

// ESC-30 — Administración del catálogo (eliminar)
// Basado en: AdminPhones.tsx — handleDelete() + confirm() + phonesService.remove()

vi.mock('../../../src/services/phones.service', () => ({
  phonesService: {
    getAll: vi.fn(),
    remove: vi.fn(),
  },
}))

function makePhone(overrides: Partial<PhoneListItem> = {}): PhoneListItem {
  return {
    id: 'phone-1',
    slug: 'iphone-15',
    name: 'iPhone 15',
    brand: 'Apple',
    price: 3000000,
    compareAt: null,
    badge: null,
    stock: 5,
    condition: 'NEW',
    verified: true,
    batteryHealth: null,
    storage: '128GB',
    ram: '6GB',
    shortDesc: null,
    heroImage: null,
    category: 'apple',
    ...overrides,
  }
}

function renderAdminPhones() {
  return render(
    <MemoryRouter>
      <AdminPhones />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminPhones — eliminación de un celular', () => {
  // Camino 1,2,3,F — el admin cancela el diálogo de confirmación
  it('no elimina el celular si el admin cancela la confirmación', async () => {
    // Arrange
    vi.mocked(phonesService.getAll).mockResolvedValue({
      data: [makePhone()],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    })
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderAdminPhones()
    await screen.findByText('iPhone 15')

    // Act
    await user.click(screen.getByTitle('Eliminar'))

    // Assert
    expect(vi.mocked(phonesService.remove).mock.calls).to.be.empty
    expect(screen.queryByText('iPhone 15')).to.exist
  })

  // Camino 1,2,4,5,6,F — confirma y remove() resuelve sin error
  it('elimina el celular de la lista cuando se confirma y remove() resuelve', async () => {
    // Arrange
    vi.mocked(phonesService.getAll).mockResolvedValue({
      data: [makePhone()],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    })
    vi.mocked(phonesService.remove).mockResolvedValue(undefined)
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderAdminPhones()
    await screen.findByText('iPhone 15')

    // Act
    await user.click(screen.getByTitle('Eliminar'))

    // Assert
    await waitFor(() => {
      expect(vi.mocked(phonesService.remove).mock.calls).to.deep.include(['phone-1'])
    })
    expect(screen.queryByText('iPhone 15')).to.be.null
  })

  // Camino 1,2,4,7,8,F — confirma pero remove() lanza error
  it('muestra una alerta y conserva el celular en la lista si remove() falla', async () => {
    // Arrange
    vi.mocked(phonesService.getAll).mockResolvedValue({
      data: [makePhone()],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    })
    vi.mocked(phonesService.remove).mockRejectedValue(new Error('fail'))
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    renderAdminPhones()
    await screen.findByText('iPhone 15')

    // Act
    await user.click(screen.getByTitle('Eliminar'))

    // Assert
    await waitFor(() => {
      expect(alertSpy.mock.calls).to.deep.include(['Error al eliminar el celular'])
    })
    expect(screen.queryByText('iPhone 15')).to.exist
  })
})
