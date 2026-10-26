interface PaginationProps {
  page: number
  totalPages: number
  onPage(page: number): void
  /** Nombre de la región para el lector de pantalla ("Páginas de pedidos"). */
  etiqueta?: string
}

export function Pagination({ page, totalPages, onPage, etiqueta = 'Paginación' }: Readonly<PaginationProps>) {
  if (totalPages <= 1) return null

  return (
    <nav className="cp-pagination" aria-label={etiqueta}>
      <button
        className="cp-btn cp-btn-secondary"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ← Anterior
      </button>

      <span className="cp-pagination-count" aria-current="page">
        <span className="cp-sr-only">Página </span>
        {page} / {totalPages}
      </span>

      <button
        className="cp-btn cp-btn-secondary"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Siguiente →
      </button>
    </nav>
  )
}
