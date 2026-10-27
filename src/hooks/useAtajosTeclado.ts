import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Heurística 6 (flexibilidad y eficiencia): atajos para quien usa la tienda a
// menudo. Están documentados en /ayuda#atajos y anunciados en el pie de página.
//
//   /   Ir a la búsqueda del catálogo
//   ?   Abrir la ayuda en la sección de atajos
//
// No se activan mientras la persona escribe en un campo, ni con Ctrl/Alt/Meta,
// para no robarle teclas al navegador ni a los lectores de pantalla.
export const ATAJOS = [
  { tecla: '/', descripcion: 'Ir a la búsqueda del catálogo' },
  { tecla: '?', descripcion: 'Abrir esta ayuda de atajos' },
] as const

function estaEscribiendo(destino: EventTarget | null): boolean {
  if (!(destino instanceof HTMLElement)) return false
  const etiqueta = destino.tagName
  return etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT' || destino.isContentEditable
}

export function useAtajosTeclado() {
  const navigate = useNavigate()

  useEffect(() => {
    function alPulsar(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey || estaEscribiendo(e.target)) return

      if (e.key === '/') {
        e.preventDefault()
        const buscador = document.getElementById('filtro-buscar')
        if (buscador) buscador.focus()
        else navigate('/catalog?buscar=1')
      } else if (e.key === '?') {
        e.preventDefault()
        navigate('/ayuda#atajos')
      }
    }

    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [navigate])
}
