import { useEffect, useState } from 'react'

/** true mientras el navegador tenga conexión. Se actualiza solo al perderla o recuperarla. */
export function useOnlineStatus(): boolean {
  const [enLinea, setEnLinea] = useState(() => globalThis.navigator?.onLine !== false)

  useEffect(() => {
    const conectar = () => setEnLinea(true)
    const desconectar = () => setEnLinea(false)
    globalThis.addEventListener('online', conectar)
    globalThis.addEventListener('offline', desconectar)
    return () => {
      globalThis.removeEventListener('online', conectar)
      globalThis.removeEventListener('offline', desconectar)
    }
  }, [])

  return enLinea
}
