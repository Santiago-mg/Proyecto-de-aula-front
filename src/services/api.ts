import axios from 'axios'

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
      globalThis.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
