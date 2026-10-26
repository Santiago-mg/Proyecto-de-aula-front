import { useEffect, useState } from 'react'
import { phonesService } from '../../services/phones.service'
import type { PhoneListItem } from '../../types/phone'
import { PhoneCard } from './PhoneCard'

// Las que caben en la fila de la ficha. Es el mismo valor por defecto del back
// (similarQueryDto), que además no deja pedir más de 12.
export const RECOMENDACIONES_POR_FILA = 4

/**
 * "También te puede interesar" — funcionalidad 13.
 *
 * Pide al back los celulares más parecidos al que se está viendo (misma marca,
 * categoría o rango de precio) y los muestra con la misma tarjeta del
 * catálogo. Si no hay ninguno o la petición falla, la sección no aparece: es
 * un complemento de la ficha y nunca debe romperla.
 */
export function SimilarPhones({ slug }: Readonly<{ slug: string }>) {
  const [phones, setPhones] = useState<PhoneListItem[]>([])

  useEffect(() => {
    // Al cambiar de celular se descartan las recomendaciones del anterior (que
    // podrían incluir al que ahora se está viendo) y se ignora la respuesta de
    // una petición vieja que llegue tarde.
    let vigente = true
    setPhones([])
    phonesService
      .getSimilar(slug, RECOMENDACIONES_POR_FILA)
      .catch((): PhoneListItem[] => [])
      .then((data) => {
        // Si responde algo que no es la lista (por ejemplo, la página HTML de
        // un proxy con status 200), se trata como "sin recomendaciones" en vez
        // de dejar que la ficha completa se caiga (DEF-13-02).
        if (vigente) setPhones(Array.isArray(data) ? data : [])
      })
    return () => {
      vigente = false
    }
  }, [slug])

  if (phones.length === 0) return null

  return (
    <section aria-labelledby="titulo-similares" className="cp-detail-section">
      <h2 id="titulo-similares" className="cp-detail-h2">
        También te puede interesar
      </h2>
      <div className="cp-phones-grid">
        {phones.map((phone) => (
          <PhoneCard key={phone.id} phone={phone} />
        ))}
      </div>
    </section>
  )
}
