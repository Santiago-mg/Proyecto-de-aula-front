import { expect } from 'chai'
import { describe, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Login } from '../../../src/pages/Login'
import { Register } from '../../../src/pages/Register'

// Basado en: Login.tsx / Register.tsx — Navigate condicional (if (user) ...)

const useAuthMock = vi.fn()
vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

function renderWithDashboard(path: '/login' | '/register', Page: () => JSX.Element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<Page />} />
        <Route path="/dashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Guardia de acceso a formularios de auth con sesión activa', () => {
  // Camino 1,2,3,F — credenciales ya validadas en sesión (user presente)
  it('Login redirige de inmediato a /dashboard si hay sesión activa', () => {
    // Arrange
    useAuthMock.mockReturnValue({
      user: { id: 'u1', email: 'user@gmail.com', name: 'Mario', role: 'USER', createdAt: '' },
      login: vi.fn(),
      isLoading: false,
    })

    // Act
    renderWithDashboard('/login', Login)

    // Assert
    expect(screen.queryByText('Dashboard')).to.exist
  })

  it('Register redirige de inmediato a /dashboard si hay sesión activa', () => {
    // Arrange
    useAuthMock.mockReturnValue({
      user: { id: 'u1', email: 'user@gmail.com', name: 'Mario', role: 'USER', createdAt: '' },
      register: vi.fn(),
      isLoading: false,
    })

    // Act
    renderWithDashboard('/register', Register)

    // Assert
    expect(screen.queryByText('Dashboard')).to.exist
  })

  // Camino 1,2,4,F — no hay credenciales validadas en sesión
  it('muestra el formulario de login/registro si no hay sesión activa', () => {
    // Arrange
    useAuthMock.mockReturnValue({ user: null, login: vi.fn(), isLoading: false })

    // Act
    renderWithDashboard('/login', Login)

    // Assert
    expect(screen.queryByRole('button', { name: /ingresar/i })).to.exist
    expect(screen.queryByText('Dashboard')).to.be.null
  })
})
