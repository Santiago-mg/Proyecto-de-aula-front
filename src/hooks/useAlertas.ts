import { useCallback, useEffect, useState } from 'react'
import { adminService } from '../services/admin.service'
import type { StockAlert } from '../types/admin'
import { comoError } from '../utils/errores'

/**
 * Alertas de inventario abiertas.
 *
 * `volverAPedirCuando` es cualquier valor: cada vez que cambia, se vuelve a
 * pedir al backend (el menú del panel lo usa con la ruta actual para que la
 * insignia no quede desactualizada tras reponer stock).
 */
export function useAlertas(volverAPedirCuando?: unknown) {
  const [alertas, setAlertas] = useState<StockAlert[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    adminService
      .getAlerts()
      .then((lista) => {
        if (!vigente) return
        setAlertas(lista)
        setError(null)
      })
      .catch((err) => {
        if (vigente) setError(comoError(err))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [volverAPedirCuando, intento])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  return { alertas, cargando, error, recargar }
}
