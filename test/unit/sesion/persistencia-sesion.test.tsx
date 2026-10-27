import { expect } from 'chai'
import { describe, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../src/context/AuthContext'
import { usuario } from '../../helpers/fixtures'

/**
 * La sesión debe estar en localStorage en el instante en que llega, no un efecto
 * después. Si la persona recarga la página enseguida (o una prueba automática
 * navega apenas cambia la URL), una sesión guardada solo en un efecto se perdía.
 *
 * Se comprueba DENTRO del act, antes de que React ejecute los efectos pendientes:
 * con la sesión guardada solo en el efecto, localStorage seguiría vacío aquí.
 */

vi.mock('../../../src/services/auth.service', () => ({
  authService: { login: vi.fn(), register: vi.fn(), updateProfile: vi.fn(), changePassword: vi.fn() },
}))
import { authService } from '../../../src/services/auth.service'

function montar() {
  let ctx!: ReturnType<typeof useAuth>
  function Espia() { ctx = useAuth(); return null }
  render(<AuthProvider><Espia /></AuthProvider>)
  return () => ctx
}

describe('AuthContext — la sesión se guarda al instante', () => {
  it('login: el token está en localStorage apenas se resuelve la petición', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: usuario(), token: 'tok-login' })
    const ctx = montar()
    let alResolver: string | null = null

    await act(async () => {
      await ctx().login('a@b.co', 'Clave2026x')
      alResolver = localStorage.getItem('cp_token')
    })

    expect(alResolver).to.equal('tok-login')
  })

  it('registro: igual que el login', async () => {
    vi.mocked(authService.register).mockResolvedValue({ user: usuario(), token: 'tok-registro' })
    const ctx = montar()
    let alResolver: string | null = null

    await act(async () => {
      await ctx().register('a@b.co', 'Ana', 'Clave2026x')
      alResolver = localStorage.getItem('cp_token')
    })

    expect(alResolver).to.equal('tok-registro')
  })

  it('cambio de contraseña (204): la sesión y el token se conservan', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: usuario(), token: 'tok-vigente' })
    vi.mocked(authService.changePassword).mockResolvedValue(undefined)
    const ctx = montar()
    await act(async () => { await ctx().login('a@b.co', 'Clave2026x') })
    let alResolver: string | null = null

    await act(async () => {
      await ctx().changePassword('Clave2026x', 'Clave2027y')
      alResolver = localStorage.getItem('cp_token')
    })

    expect(alResolver).to.equal('tok-vigente')
    expect(ctx().user).to.not.be.null
  })

  it('cerrar sesión borra el token al instante, sin esperar al efecto', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: usuario(), token: 'tok-1' })
    const ctx = montar()
    await act(async () => { await ctx().login('a@b.co', 'Clave2026x') })
    let alSalir: string | null = 'sin-leer'

    act(() => {
      ctx().logout()
      alSalir = localStorage.getItem('cp_token')
    })

    expect(alSalir).to.be.null
    expect(ctx().user).to.be.null
  })

  it('editar el perfil actualiza el usuario guardado sin perder el token', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: usuario({ name: 'Ana' }), token: 'tok-1' })
    vi.mocked(authService.updateProfile).mockResolvedValue(usuario({ name: 'María' }))
    const ctx = montar()
    await act(async () => { await ctx().login('a@b.co', 'Clave2026x') })
    let usuarioAlResolver = ''
    let tokenAlResolver: string | null = null

    await act(async () => {
      await ctx().updateProfile('María')
      usuarioAlResolver = JSON.parse(localStorage.getItem('cp_user') ?? '{}').name
      tokenAlResolver = localStorage.getItem('cp_token')
    })

    expect(usuarioAlResolver).to.equal('María')
    expect(tokenAlResolver).to.equal('tok-1')
  })
})
