export function SkeletonCard() {
  return (
    <div className="cp-skeleton-card">
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

export function SkeletonGrid({ count = 6 }: Readonly<{ count?: number }>) {
  const ids = Array.from({ length: count }, (_, n) => `skeleton-${n}`)
  return (
    <div className="cp-phones-grid">
      {ids.map((id) => (
        <SkeletonCard key={id} />
      ))}
    </div>
  )
}
