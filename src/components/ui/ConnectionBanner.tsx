import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

const MENSAJE_TIENDA =
  'Sin conexión a internet. Puedes seguir mirando, pero comprar o guardar cambios no funcionará hasta que vuelva.'

/**
 * Avisa cuando el navegador se queda sin internet. Sin esto, un botón que
 * "no hace nada" se confundía con un error de la tienda (heurística 1:
 * visibilidad del estado del sistema).
 */
export function ConnectionBanner({ mensaje = MENSAJE_TIENDA }: Readonly<{ mensaje?: string }>) {
  const enLinea = useOnlineStatus()

  return (
    <div aria-live="polite">
      {!enLinea && (
        <div className="cp-connection-banner">
          <WifiOff size={16} aria-hidden="true" />
          <span>{mensaje}</span>
        </div>
      )}
    </div>
  )
}
