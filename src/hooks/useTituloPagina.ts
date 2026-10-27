import { useEffect } from 'react'

// Heurística 1 (visibilidad): cada pantalla pone su nombre en la pestaña del
// navegador. Antes todas decían "CelularPro — Celulares certificados" y, con
// varias pestañas abiertas, no se sabía cuál era cuál.
export const SUFIJO_TITULO = ' · CelularPro'

export function useTituloPagina(titulo: string) {
  useEffect(() => {
    const anterior = document.title
    document.title = `${titulo}${SUFIJO_TITULO}`
    return () => {
      document.title = anterior
    }
  }, [titulo])
}
