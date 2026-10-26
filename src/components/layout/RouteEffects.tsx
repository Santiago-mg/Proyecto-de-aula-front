import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Lo que una app de una sola página debe hacer por su cuenta al cambiar de
 * ruta y que el navegador hace solo en un sitio tradicional:
 *
 *  1. Volver arriba. Antes, entrar a una ficha desde la mitad del catálogo
 *     dejaba al cliente leyendo la mitad de la ficha.
 *  2. Llevar el foco al contenido nuevo, para que quien usa teclado o lector
 *     de pantalla no tenga que recorrer otra vez el menú.
 *  3. Anunciar la página nueva por voz (el título de la pestaña).
 *
 * Solo cuenta como "página nueva" un cambio de ruta (/catalog → /phones/x).
 * Cambiar los filtros (?search=…) o la página (?page=2) sigue siendo la misma
 * pantalla: ahí no se mueve el foco, o se le quitaría el cursor a quien está
 * escribiendo en el buscador.
 *
 * Al retroceder o avanzar con las flechas del navegador no se toca el scroll:
 * eso lo restaura el propio navegador.
 */
export function RouteEffects() {
  const { pathname, hash, state } = useLocation()
  const tipo = useNavigationType()
  const anterior = useRef({ pathname, hash })
  const [anuncio, setAnuncio] = useState('')

  const quiereBuscador = Boolean((state as { enfocarBusqueda?: boolean } | null)?.enfocarBusqueda)

  useEffect(() => {
    const mismaPantalla = anterior.current.pathname === pathname && anterior.current.hash === hash
    anterior.current = { pathname, hash }
    if (mismaPantalla || tipo === 'POP') return

    // Las anclas (#garantias) las resuelve la propia página.
    if (!hash) {
      window.scrollTo(0, 0)
      // Si se llegó con el atajo "/", el foco es del buscador, no del contenido.
      if (!quiereBuscador) document.getElementById('contenido')?.focus({ preventScroll: true })
    }

    // Se espera un momento: cada página pone su título al montarse.
    const espera = setTimeout(() => setAnuncio(document.title), 300)
    return () => clearTimeout(espera)
  }, [pathname, hash, tipo, quiereBuscador])

  return (
    <div className="cp-sr-only" aria-live="polite" aria-atomic="true">
      {anuncio}
    </div>
  )
}
