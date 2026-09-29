import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Login } from '../../../src/pages/Login'

// Basado en: Login.tsx — schema Zod (email, password)

const useAuthMock = vi.fn()
vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

beforeEach(() => {
  useAuthMock.mockReturnValue({ user: null, login: vi.fn(), isLoading: false })
})

describe('Login — validación del esquema del formulario', () => {
  // Camino 1,2,3,4,F — email con formato inválido
  it('muestra "Email inválido" con un correo mal formado', async () => {
    // Arrange
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    // Act
    await user.type(screen.getByLabelText(/email/i), 'no-es-un-correo')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    // Assert
    await waitFor(() => {
      expect(screen.queryByText('Email inválido')).to.exist
    })
  })

  // Camino 1,2,3,5,6,F — email válido, contraseña vacía
  it('muestra "La contraseña es requerida" si el password está vacío', async () => {
    // Arrange
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    // Act
    await user.type(screen.getByLabelText(/email/i), 'user@gmail.com')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    // Assert
    await waitFor(() => {
      expect(screen.queryByText('La contraseña es requerida')).to.exist
    })
  })

  // Camino 1,2,3,5,7,F — email y contraseña con formato correcto
  it('no muestra errores de validación con datos correctos', async () => {
    // Arrange
    const loginFn = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ user: null, login: loginFn, isLoading: false })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    // Act
    await user.type(screen.getByLabelText(/email/i), 'user@gmail.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    // Assert
    await waitFor(() => {
      expect(loginFn.mock.calls).to.have.lengthOf(1)
    })
    expect(screen.queryByText('Email inválido')).to.be.null
    expect(screen.queryByText('La contraseña es requerida')).to.be.null
  })
})
