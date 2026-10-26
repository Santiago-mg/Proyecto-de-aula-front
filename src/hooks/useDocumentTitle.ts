import { useEffect } from 'react'

export const TITULO_BASE = 'CelularPro — Celulares certificados'

/**
 * Pone el título de la pestaña. Sin esto todas las pantallas se llamaban igual
 * y, con varias pestañas abiertas o en el historial, no había forma de saber
 * cuál era cuál (WCAG 2.4.2).
 */
export function useDocumentTitle(titulo?: string | null) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · CelularPro` : TITULO_BASE
  }, [titulo])
}
