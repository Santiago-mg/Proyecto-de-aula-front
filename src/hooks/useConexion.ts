import { useEffect, useState } from 'react'

// Heurística 11 (respuesta a fallos ajenos): avisa cuando el navegador pierde
// la conexión, en lugar de dejar que cada acción falle sin explicación.
export function useConexion(): boolean {
  const [enLinea, setEnLinea] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const conectar = () => setEnLinea(true)
    const desconectar = () => setEnLinea(false)
    window.addEventListener('online', conectar)
    window.addEventListener('offline', desconectar)
    return () => {
      window.removeEventListener('online', conectar)
      window.removeEventListener('offline', desconectar)
    }
  }, [])

  return enLinea
}
