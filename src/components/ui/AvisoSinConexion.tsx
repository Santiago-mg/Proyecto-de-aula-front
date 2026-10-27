import { WifiOff } from 'lucide-react'
import { useConexion } from '../../hooks/useConexion'

// Heurística 11: un corte de internet se explica en pantalla y dice qué hacer.
export function AvisoSinConexion() {
  const enLinea = useConexion()
  if (enLinea) return null

  return (
    <div role="status" className="cp-offline-banner">
      <WifiOff size={16} aria-hidden="true" />
      <span>
        Sin conexión a internet. Lo que hagas no se enviará hasta que vuelva la conexión;
        no cierres esta página.
      </span>
    </div>
  )
}
