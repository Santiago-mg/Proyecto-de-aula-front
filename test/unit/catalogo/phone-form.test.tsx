import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PhoneForm } from '../../../src/pages/admin/PhoneForm'
import { phonesService } from '../../../src/services/phones.service'
import type { Phone } from '../../../src/types/phone'

// ESC-30 — Administración del catálogo (crear/editar)
// Basado en: PhoneForm.tsx — schema Zod + onSubmit() (crear vs. editar)

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../../../src/services/phones.service', () => ({
  phonesService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

function makePhone(overrides: Partial<Phone> = {}): Phone {
  return {
    id: 'phone-1',
    slug: 'iphone-15',
    name: 'iPhone 15',
    brand: 'Apple',
    categoryId: 'apple',
    price: 3000000,
    compareAt: null,
    badge: null,
    stock: 5,
    condition: 'NEW',
    verified: true,
    batteryHealth: null,
    storage: '128GB',
    ram: '6GB',
    camera: null,
    battery: null,
    screen: null,
    chip: null,
    shortDesc: null,
    longDesc: null,
    heroImage: null,
    images: [],
    colors: [],
    features: [],
    category: 'apple',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function renderNewForm() {
  return render(
    <MemoryRouter initialEntries={['/admin/phones/new']}>
      <Routes>
        <Route path="/admin/phones/new" element={<PhoneForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderEditForm() {
  return render(
    <MemoryRouter initialEntries={['/admin/phones/phone-1/edit']}>
      <Routes>
        <Route path="/admin/phones/:id/edit" element={<PhoneForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^nombre$/i), 'iPhone 15')
  await user.type(screen.getByLabelText(/slug/i), 'iphone-15')
  await user.type(screen.getByLabelText(/marca/i), 'Apple')
  await user.selectOptions(screen.getByLabelText(/categoría/i), 'apple')
  await user.type(screen.getByLabelText(/^precio \(cop\)$/i), '3000000')
  await user.type(screen.getByLabelText(/^stock$/i), '5')
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PhoneForm — validación y creación', () => {
  // Camino 1,2,3,F — se envía el formulario con campos requeridos vacíos
  it('muestra errores de validación y no llama a create() si faltan campos requeridos', async () => {
    // Arrange
    const user = userEvent.setup()
    renderNewForm()

    // Act
    await user.click(screen.getByRole('button', { name: /crear celular/i }))

    // Assert
    await waitFor(() => {
      expect(screen.queryAllByText(/mínimo 3 caracteres|requerido/i)).to.not.be.empty
    })
    expect(vi.mocked(phonesService.create).mock.calls).to.be.empty
  })

  // Camino 1,2,4,5,6,F — datos válidos en modo creación
  it('crea el celular y navega a /admin/phones cuando los datos son válidos', async () => {
    // Arrange
    vi.mocked(phonesService.create).mockResolvedValue(makePhone())
    const user = userEvent.setup()
    renderNewForm()

    // Act
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /crear celular/i }))

    // Assert
    await waitFor(() => {
      expect(vi.mocked(phonesService.create).mock.calls).to.have.lengthOf(1)
    })
    const [datosEnviados] = vi.mocked(phonesService.create).mock.calls[0]
    expect(datosEnviados).to.include({ slug: 'iphone-15', name: 'iPhone 15', brand: 'Apple' })
    await waitFor(() => {
      expect(navigateMock.mock.calls).to.deep.include(['/admin/phones'])
    })
  })

  // Camino 1,2,4,7,8,F — el servidor rechaza la creación
  it('muestra el error del servidor y no navega si create() rechaza', async () => {
    // Arrange
    vi.mocked(phonesService.create).mockRejectedValue(new Error('El slug ya está en uso'))
    const user = userEvent.setup()
    renderNewForm()

    // Act
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /crear celular/i }))

    // Assert
    await waitFor(() => {
      expect(screen.queryByText('El slug ya está en uso')).to.exist
    })
    expect(navigateMock.mock.calls).to.be.empty
  })
})

describe('PhoneForm — edición de un celular existente', () => {
  // Camino 1,2,3,4,F — se carga el celular por id y se precargan los campos
  it('precarga el formulario con los datos del celular al editar', async () => {
    // Arrange
    vi.mocked(phonesService.getById).mockResolvedValue(makePhone({ name: 'iPhone 15 Pro' }))

    // Act
    renderEditForm()

    // Assert
    expect(await screen.findByDisplayValue('iPhone 15 Pro')).to.exist
    expect(vi.mocked(phonesService.getById).mock.calls).to.deep.include(['phone-1'])
  })

  // Camino 1,2,3,5,6,7,F — se guardan los cambios y se llama a update(id, data)
  it('llama a phonesService.update(id, data) y navega al guardar cambios', async () => {
    // Arrange
    vi.mocked(phonesService.getById).mockResolvedValue(makePhone())
    vi.mocked(phonesService.update).mockResolvedValue(makePhone())
    const user = userEvent.setup()
    renderEditForm()
    await screen.findByDisplayValue('iPhone 15')

    // Act
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    // Assert
    await waitFor(() => {
      expect(vi.mocked(phonesService.update).mock.calls).to.have.lengthOf(1)
    })
    const [idEnviado, datosEnviados] = vi.mocked(phonesService.update).mock.calls[0]
    expect(idEnviado).to.equal('phone-1')
    expect(datosEnviados).to.include({ slug: 'iphone-15' })
    await waitFor(() => {
      expect(navigateMock.mock.calls).to.deep.include(['/admin/phones'])
    })
  })
})
