import { CircleHelp } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

interface HelpTipProps {
  /** Texto visible del botón. Sin él, solo se ve el icono "?". */
  etiqueta?: string
  /** Nombre accesible cuando no hay texto visible. */
  nombre?: string
  children: ReactNode
}

/**
 * Ayuda contextual: un botón que despliega una explicación corta junto al
 * dato que genera la duda. Funciona con teclado (Enter/Espacio abren, Escape
 * cierra) y con lector de pantalla (aria-expanded + aria-controls). No usa
 * "hover": en celular no existe.
 */
export function HelpTip({ etiqueta, nombre = 'Más información', children }: Readonly<HelpTipProps>) {
  const [abierto, setAbierto] = useState(false)
  const id = useId()
  const raiz = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!abierto) return
    function cerrarFuera(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false)
    }
    function cerrarConEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', cerrarFuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  return (
    <span className="cp-helptip" ref={raiz}>
      <button
        type="button"
        className={`cp-helptip-btn ${etiqueta ? 'con-texto' : ''}`}
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={etiqueta ? undefined : nombre}
        onClick={() => setAbierto((v) => !v)}
      >
        <CircleHelp size={14} aria-hidden="true" />
        {etiqueta && <span>{etiqueta}</span>}
      </button>
      {abierto && (
        <span id={id} className="cp-helptip-body" role="note">
          {children}
        </span>
      )}
    </span>
  )
}
