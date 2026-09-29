import { expect } from 'chai'
import { describe, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../../../src/context/AuthContext'
import { ok, servidor } from '../../helpers/servidor'
import { CLAVE, sesionIniciada, TOKEN_USUARIO, usuario } from '../../helpers/fixtures'

// Basado en: context/AuthContext.tsx — equivalente front de tests/unit/login/loginUser.use-case.test.ts

const envoltorio = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext — sesión del usuario', () => {
  it('recupera la sesión guardada en el navegador', () => {
    // Arrange
    sesionIniciada()

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper: envoltorio })

    // Assert
    expect(result.current.user?.email).to.equal('mario@gmail.com')
    expect(result.current.token).to.equal(TOKEN_USUARIO)
  })

  it('mientras el login está en curso marca isLoading y al terminar guarda la sesión', async () => {
    // Arrange
    let abrirPuerta: () => void = () => {
      // se reemplaza al crear la puerta
    }
    const puerta = new Promise<void>((resolve) => {
      abrirPuerta = resolve
    })
    servidor.responder('POST', '/auth/login', async () => {
      await puerta
      return ok({ user: usuario(), token: TOKEN_USUARIO })
    })
    const { result } = renderHook(() => useAuth(), { wrapper: envoltorio })

    // Act
    let enCurso: Promise<void> = Promise.resolve()
    act(() => {
      enCurso = result.current.login('mario@gmail.com', CLAVE)
    })
    const cargando = result.current.isLoading
    await act(async () => {
      abrirPuerta()
      await enCurso
    })

    // Assert
    expect(cargando).to.be.true
    expect(result.current.isLoading).to.be.false
    expect(result.current.user?.name).to.equal('Mario Andrade')
    await waitFor(() => {
      expect(localStorage.getItem('cp_token')).to.equal(TOKEN_USUARIO)
    })
  })

  it('logout borra la sesión del estado y del navegador', () => {
    // Arrange
    sesionIniciada()
    const { result } = renderHook(() => useAuth(), { wrapper: envoltorio })

    // Act
    act(() => {
      result.current.logout()
    })

    // Assert
    expect(result.current.user).to.be.null
    expect(localStorage.getItem('cp_user')).to.be.null
  })

  it('useAuth fuera del provider avisa del error de uso', () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => {
      // React registra el error del render; aquí solo interesa la excepción
    })

    // Act
    const usar = () => renderHook(() => useAuth())

    // Assert
    expect(usar).to.throw('useAuth debe usarse dentro de AuthProvider')
  })
})
