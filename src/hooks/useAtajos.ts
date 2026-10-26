import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** Atajos de teclado de la tienda. Se documentan en /ayuda#atajos: si cambia uno, hay que cambiar el otro. */
export const ATAJOS = [
  { tecla: '/', descripcion: 'Ir al buscador del catálogo' },
  { tecla: 'c', descripcion: 'Abrir el carrito' },
  { tecla: '?', descripcion: 'Ver esta lista de atajos' },
  { tecla: 'Esc', descripcion: 'Cerrar el carrito, un diálogo o el menú' },
] as const

function estaEscribiendo(destino: EventTarget | null): boolean {
  if (!(destino instanceof HTMLElement)) return false
  return destino.isContentEditable || destino.closest('input, textarea, select, [contenteditable="true"]') !== null
}

/**
 * Atajos para quien usa mucho la tienda (heurística 7: flexibilidad y
 * eficiencia). Se ignoran cuando la persona está escribiendo en un campo o
 * usa Ctrl/Alt/Cmd, para no pisar los atajos del navegador.
 */
export function useAtajos(abrirCarrito: () => void) {
  const navigate = useNavigate()

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (estaEscribiendo(e.target)) return
      // Con un diálogo abierto los atajos de la página quedan quietos.
      if (document.querySelector('[aria-modal="true"]')) return

      if (e.key === '/') {
        e.preventDefault()
        const buscador = document.getElementById('filtro-buscar')
        if (buscador) buscador.focus()
        else navigate('/catalog', { state: { enfocarBusqueda: true } })
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        abrirCarrito()
      } else if (e.key === '?') {
        e.preventDefault()
        navigate('/ayuda#atajos')
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abrirCarrito, navigate])
}
