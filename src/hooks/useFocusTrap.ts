import { useEffect, useRef, type RefObject } from 'react'

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function enfocablesDe(contenedor: HTMLElement): HTMLElement[] {
  return [...contenedor.querySelectorAll<HTMLElement>(ENFOCABLES)].filter(
    (el) => !el.hidden && el.getAttribute('aria-hidden') !== 'true',
  )
}

interface Opciones {
  /** Se llama al pulsar Escape. */
  alEscapar?: () => void
  /** Elemento que recibe el foco al abrir; por defecto el primero enfocable. */
  inicial?: RefObject<HTMLElement>
  /** Impide que la página de atrás se desplace mientras el diálogo está abierto. */
  bloquearScroll?: boolean
}

/**
 * Mantiene el teclado dentro de un diálogo mientras está abierto:
 * lleva el foco adentro al abrir, lo encierra con Tab / Shift+Tab, cierra con
 * Escape y devuelve el foco a donde estaba al cerrar. Sin esto, quien navega
 * con teclado o lector de pantalla seguía "detrás" del diálogo (WCAG 2.4.3).
 */
export function useFocusTrap(
  contenedor: RefObject<HTMLElement>,
  activo: boolean,
  { alEscapar, inicial, bloquearScroll = true }: Opciones = {},
) {
  // Se guarda en una ref para que cambiar la función no reinicie el foco.
  const escaparRef = useRef(alEscapar)
  escaparRef.current = alEscapar

  useEffect(() => {
    const caja = contenedor.current
    if (!activo || !caja) return

    const anterior = document.activeElement as HTMLElement | null
    const overflowAnterior = document.body.style.overflow
    if (bloquearScroll) document.body.style.overflow = 'hidden'

    const destino = inicial?.current ?? enfocablesDe(caja)[0] ?? caja
    destino.focus()

    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (escaparRef.current) {
          e.stopPropagation()
          escaparRef.current()
        }
        return
      }
      if (e.key !== 'Tab' || !caja) return

      const lista = enfocablesDe(caja)
      if (lista.length === 0) {
        e.preventDefault()
        caja.focus()
        return
      }
      const primero = lista[0]
      const ultimo = lista[lista.length - 1]
      const actual = document.activeElement
      if (e.shiftKey && (actual === primero || actual === caja)) {
        e.preventDefault()
        ultimo.focus()
      } else if ((!e.shiftKey && actual === ultimo) || !caja.contains(actual)) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      if (bloquearScroll) document.body.style.overflow = overflowAnterior
      if (anterior?.isConnected) anterior.focus()
    }
  }, [contenedor, activo, inicial, bloquearScroll])
}
