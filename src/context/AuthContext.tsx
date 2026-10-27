import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '../types/auth'
import { authService } from '../services/auth.service'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  register(email: string, name: string, password: string): Promise<void>
  logout(): void
  updateProfile(name: string): Promise<void>
  changePassword(currentPassword: string, newPassword: string): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// La sesión se guarda en el MISMO instante en que llega (no solo en el efecto de
// más abajo, que corre un instante después de actualizar el estado). Si la persona
// recarga la página enseguida, o una petición sale antes de que corra el efecto,
// la sesión ya está disponible en localStorage.
function guardarSesion(user: User, token: string) {
  localStorage.setItem('cp_user', JSON.stringify(user))
  localStorage.setItem('cp_token', token)
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('cp_user')
      return stored ? (JSON.parse(stored) as User) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('cp_token'),
  )

  const [isLoading, setIsLoading] = useState(false)

  // Sincroniza localStorage cuando cambian user/token
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('cp_user', JSON.stringify(user))
      localStorage.setItem('cp_token', token)
    } else {
      localStorage.removeItem('cp_user')
      localStorage.removeItem('cp_token')
    }
  }, [user, token])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await authService.login({ email, password })
      guardarSesion(result.user, result.token)
      setUser(result.user)
      setToken(result.token)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, name: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await authService.register({ email, name, password })
      guardarSesion(result.user, result.token)
      setUser(result.user)
      setToken(result.token)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    // El backend no guarda sesiones (JWT sin estado): cerrar sesión es borrar
    // el token del navegador. Se limpia de inmediato y no en el efecto, para
    // que ninguna petición posterior salga con el token viejo.
    localStorage.removeItem('cp_user')
    localStorage.removeItem('cp_token')
    setUser(null)
    setToken(null)
  }, [])

  const updateProfile = useCallback(async (name: string) => {
    setIsLoading(true)
    try {
      const actualizado = await authService.updateProfile({ name })
      // Se lee de localStorage y no del estado: este callback no se recrea y `token` quedaría desactualizado.
      const vigente = localStorage.getItem('cp_token')
      if (vigente) guardarSesion(actualizado, vigente)
      setUser(actualizado)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsLoading(true)
    try {
      // El backend responde 204: la sesión actual (usuario y token) no cambia.
      await authService.changePassword({ currentPassword, newPassword })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Memorizado: si no cambia la sesión, los consumidores no se re-renderizan
  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout, updateProfile, changePassword }),
    [user, token, isLoading, login, register, logout, updateProfile, changePassword],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
