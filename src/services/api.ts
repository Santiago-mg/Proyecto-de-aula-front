import axios from 'axios'
import { CLAVE_AVISO, avisoDeSesion, codigoDeError, mensajeDeSuspension } from '../utils/errores'

// Cliente HTTP centralizado — el token se inyecta automáticamente en cada request
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 con una sesión guardada = token vencido o inválido → limpiar y redirigir.
    // Sin sesión (p. ej. credenciales incorrectas en el login) solo se propaga el
    // error, para que la pantalla muestre el mensaje del servidor.
    if (error.response?.status === 401 && localStorage.getItem('cp_token')) {
      localStorage.removeItem('cp_token')
      localStorage.removeItem('cp_user')
      // La página se recarga al redirigir: el motivo viaja en sessionStorage
      // para que /login explique por qué se cerró la sesión.
      sessionStorage.setItem(CLAVE_AVISO, avisoDeSesion(codigoDeError(error)))
      globalThis.location.href = '/login'
      return Promise.reject(error)
    }
    // 403 por suspensión de la cuenta: la sesión ya no sirve para nada, se
    // cierra y /login muestra el motivo que dio el administrador.
    const suspension = mensajeDeSuspension(error)
    if (suspension && localStorage.getItem('cp_token')) {
      localStorage.removeItem('cp_token')
      localStorage.removeItem('cp_user')
      sessionStorage.setItem(CLAVE_AVISO, suspension)
      globalThis.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
