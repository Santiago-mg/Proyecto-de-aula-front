export function SkeletonCard() {
  return (
    <div className="cp-skeleton-card" aria-hidden="true">
      <div className="cp-skeleton cp-skeleton-img" />
      <div className="cp-skeleton-body">
        <div className="cp-skeleton cp-skeleton-line" style={{ width: '60%', height: 10 }} />
        <div className="cp-skeleton cp-skeleton-line" style={{ width: '85%', height: 16, marginTop: 8 }} />
        <div className="cp-skeleton cp-skeleton-line" style={{ width: '40%', height: 12, marginTop: 8 }} />
        <div className="cp-skeleton cp-skeleton-line" style={{ width: '55%', height: 20, marginTop: 12 }} />
      </div>
    </div>
  )
}

/**
 * Tarjetas fantasma mientras llega la lista: muestran la forma de lo que viene,
 * así la página no salta cuando aparecen los datos. Para el lector de pantalla
 * son una sola frase ("Cargando…"), no seis bloques vacíos.
 */
export function SkeletonGrid({ count = 6, texto = 'Cargando…' }: Readonly<{ count?: number; texto?: string }>) {
  const ids = Array.from({ length: count }, (_, n) => `skeleton-${n}`)
  return (
    <div className="cp-phones-grid" aria-busy="true">
      <span className="cp-sr-only" role="status">{texto}</span>
      {ids.map((id) => (
        <SkeletonCard key={id} />
      ))}
    </div>
  )
}

/** Forma de la ficha de un celular mientras llegan sus datos. */
export function SkeletonDetail() {
  return (
    <div className="cp-container cp-detail-page" aria-busy="true">
      <span className="cp-sr-only" role="status">Cargando el equipo…</span>
      <div className="cp-detail-grid" aria-hidden="true">
        <div className="cp-skeleton cp-skeleton-detail-img" />
        <div>
          <div className="cp-skeleton cp-skeleton-line" style={{ width: '35%', height: 14 }} />
          <div className="cp-skeleton cp-skeleton-line" style={{ width: '80%', height: 34, marginTop: 16 }} />
          <div className="cp-skeleton cp-skeleton-line" style={{ width: '95%', height: 14, marginTop: 20 }} />
          <div className="cp-skeleton cp-skeleton-line" style={{ width: '60%', height: 14, marginTop: 8 }} />
          <div className="cp-skeleton cp-skeleton-line" style={{ width: '45%', height: 36, marginTop: 28 }} />
          <div className="cp-skeleton cp-skeleton-line" style={{ width: '100%', height: 56, marginTop: 36 }} />
        </div>
      </div>
    </div>
  )
}
