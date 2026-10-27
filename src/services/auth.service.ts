import type { AuthResponse, User } from '../types/auth'
import api from './api'

export const authService = {
  async register(data: {
    email: string
    name: string
    password: string
  }): Promise<AuthResponse> {
    const res = await api.post<{ data: AuthResponse }>('/auth/register', data)
    return res.data.data
  },

  async login(data: {
    email: string
    password: string
  }): Promise<AuthResponse> {
    const res = await api.post<{ data: AuthResponse }>('/auth/login', data)
    return res.data.data
  },

  // El backend no tiene endpoint de cierre de sesión: el JWT es sin estado y
  // cerrar sesión es borrarlo del navegador (lo hace AuthContext).

  // PATCH /auth/me: solo el nombre es editable; el backend descarta el resto.
  async updateProfile(data: { name: string }): Promise<User> {
    const res = await api.patch<{ data: User }>('/auth/me', data)
    return res.data.data
  },

  // PUT /auth/me/password responde 204 sin cuerpo. El token vigente sigue siendo
  // válido (el backend valida la cuenta en cada petición), así que no hay que
  // reemplazarlo.
  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    await api.put('/auth/me/password', data)
  },
}
