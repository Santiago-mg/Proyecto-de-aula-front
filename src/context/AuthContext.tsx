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
}

const AuthContext = createContext<AuthContextValue | null>(null)

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
      setUser(result.user)
      setToken(result.token)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
  }, [])

  // Memorizado: si no cambia la sesión, los consumidores no se re-renderizan
  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout],
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
