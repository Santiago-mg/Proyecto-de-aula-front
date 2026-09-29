import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Register } from '../../../src/pages/Register'

// Basado en: Register.tsx — esquema Zod (emailSchema)

const useAuthMock = vi.fn()
vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

function fillRequiredFieldsExceptEmail() {
  return {
    name: screen.getByLabelText(/nombre completo/i),
    password: screen.getByLabelText(/^contraseña$/i),
    confirm: screen.getByLabelText(/confirmar contraseña/i),
  }
}

beforeEach(() => {
  useAuthMock.mockReturnValue({
    user: null,
    register: vi.fn(),
    isLoading: false,
  })
})

describe('Register — validación del dominio de correo', () => {
  // Camino 1,2,3,4,F — correo con formato inválido
  it('muestra "Correo electrónico inválido" con un formato incorrecto', async () => {
    // Arrange
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    const { name, password, confirm } = fillRequiredFieldsExceptEmail()

    // Act
    await user.type(name, 'Mario')
    await user.type(screen.getByLabelText(/email/i), 'usuario@')
    await user.type(password, 'password123')
    await user.type(confirm, 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    // Assert
    await waitFor(() => {
      expect(screen.queryByText('Correo electrónico inválido')).to.exist
    })
  })

  // Camino 1,2,3,5,6,7,F — correo válido pero dominio no permitido
  it('muestra el mensaje de dominio no permitido con user@empresa.com', async () => {
    // Arrange
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    const { name, password, confirm } = fillRequiredFieldsExceptEmail()

    // Act
    await user.type(name, 'Mario')
    await user.type(screen.getByLabelText(/email/i), 'user@empresa.com')
    await user.type(password, 'password123')
    await user.type(confirm, 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    // Assert
    await waitFor(() => {
      expect(
        screen.queryByText(/Correo inválido\. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud\./),
      ).to.exist
    })
  })

  // Camino 1,2,3,5,6,8,F — correo válido con dominio permitido
  it('no muestra error de email con un dominio permitido (user@gmail.com)', async () => {
    // Arrange
    const registerFn = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ user: null, register: registerFn, isLoading: false })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    const { name, password, confirm } = fillRequiredFieldsExceptEmail()

    // Act
    await user.type(name, 'Mario')
    await user.type(screen.getByLabelText(/email/i), 'user@gmail.com')
    await user.type(password, 'password123')
    await user.type(confirm, 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    // Assert
    await waitFor(() => {
      expect(registerFn.mock.calls).to.have.lengthOf(1)
    })
    expect(screen.queryByText(/Correo electrónico inválido/)).to.be.null
    expect(screen.queryByText(/Correo inválido/)).to.be.null
  })
})

describe('Register — correo sin arroba', () => {
  // Camino 1,2,3,4,F con un correo sin "@": el dominio ni siquiera existe
  it('muestra el error de formato, no el de dominio', async () => {
    // Arrange
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    const { name, password, confirm } = fillRequiredFieldsExceptEmail()

    // Act
    await user.type(name, 'Mario')
    await user.type(screen.getByLabelText(/email/i), 'sin-arroba')
    await user.type(password, 'password123')
    await user.type(confirm, 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    // Assert
    await waitFor(() => {
      expect(screen.queryByText('Correo electrónico inválido')).to.exist
    })
    expect(screen.queryByText(/Usa Gmail/)).to.be.null
  })
})
