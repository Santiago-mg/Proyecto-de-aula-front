import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { Loading } from '../../components/ui/Loading'
import { Pagination } from '../../components/ui/Pagination'
import { useToastOpcional } from '../../context/ToastContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { phonesService } from '../../services/phones.service'
import type { PhoneListItem } from '../../types/phone'
import { comoError } from '../../utils/errores'
import { formatPrecio } from '../../utils/formato'

/** Celulares por página del panel. */
const POR_PAGINA = 50

const CONDITION_LABEL: Record<string, string> = {
  NEW: 'Nuevo',
  CERTIFIED: 'Certificado',
  USED: 'Usado',
}

type NivelStock = 'agotado' | 'poco' | 'suficiente'

function nivelDeStock(stock: number): NivelStock {
  if (stock === 0) return 'agotado'
  if (stock <= 3) return 'poco'
  return 'suficiente'
}

// Rojo si está agotado, naranja si quedan 3 o menos
function colorDeStock(stock: number) {
  const nivel = nivelDeStock(stock)
  if (nivel === 'agotado') return '#e05252'
  if (nivel === 'poco') return '#e09052'
  return 'inherit'
}

// El color solo no basta (quien no distingue rojo de naranja no sabría si queda
// poco o nada): cada nivel además dice qué significa con palabras.
const NOTA_DE_STOCK: Record<NivelStock, string | null> = {
  agotado: 'Sin stock',
  poco: 'Quedan pocas',
  suficiente: null,
}

function textoTotal(total: number) {
  return total === 1 ? '1 celular en el catálogo' : `${total} celulares en el catálogo`
}

export function AdminPhones() {
  useDocumentTitle('Administración · Celulares')
  const avisar = useToastOpcional()
  const [phones, setPhones] = useState<PhoneListItem[]>([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [intento, setIntento] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let vigente = true
    setLoading(true)
    setError(null)
    phonesService
      .getAll(page > 1 ? { limit: POR_PAGINA, page } : { limit: POR_PAGINA })
      .then((r) => {
        if (!vigente) return
        setPhones(r.data)
        setMeta({ total: r.meta?.total ?? r.data.length, totalPages: r.meta?.totalPages ?? 1 })
      })
      .catch((err) => {
        if (vigente) setError(comoError(err))
      })
      .finally(() => {
        if (vigente) setLoading(false)
      })
    return () => {
      vigente = false
    }
  }, [page, intento])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    setDeletingId(id)
    try {
      await phonesService.remove(id)
      setPhones((prev) => prev.filter((p) => p.id !== id))
      setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) }))
      // Si era el único de la página, no se deja a la persona en una página vacía.
      if (phones.length === 1 && page > 1) setPage(page - 1)
      avisar.showToast(`Eliminamos «${name}» del catálogo.`)
    } catch {
      alert('Error al eliminar el celular')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="cp-admin-page">
      <div className="cp-admin-page-header">
        <div>
          <div className="cp-admin-page-eyebrow">— Administrador</div>
          <h1 className="cp-admin-page-title">Gestión de celulares</h1>
          {!loading && !error && <p className="cp-admin-count cp-admin-count-left">{textoTotal(meta.total)}</p>}
        </div>
        <Link to="/admin/phones/new" className="cp-btn cp-btn-primary">
          <Plus size={16} aria-hidden="true" /> Nuevo celular
        </Link>
      </div>

      {loading && <Loading text="Cargando celulares..." />}

      {error && <ErrorMessage error={error} onReintentar={() => setIntento((n) => n + 1)} />}

      {!loading && !error && (
        <>
          <div className="cp-admin-table-wrap">
            <table className="cp-admin-table">
              <caption className="cp-sr-only">Celulares del catálogo</caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Marca</th>
                  <th scope="col">Condición</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Verificado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {phones.map((p) => {
                  const nivel = nivelDeStock(p.stock)
                  const nota = NOTA_DE_STOCK[nivel]
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="cp-admin-user-cell">
                          {p.heroImage && <img src={p.heroImage} alt="" className="cp-admin-thumb" />}
                          <span className="cp-admin-phone-name">{p.name}</span>
                        </div>
                      </td>
                      <td data-label="Marca">{p.brand}</td>
                      <td data-label="Condición">
                        <span className="cp-badge cp-badge-accent">{CONDITION_LABEL[p.condition]}</span>
                      </td>
                      <td data-label="Stock">
                        <span className={`cp-stock cp-stock-${nivel}`} style={{ color: colorDeStock(p.stock) }}>
                          {p.stock}
                        </span>
                        {nota && <span className="cp-stock-note"> · {nota}</span>}
                      </td>
                      <td className="cp-admin-money" data-label="Precio">{formatPrecio(p.price)}</td>
                      <td data-label="Verificado">
                        {p.verified ? (
                          <>
                            <span className="cp-admin-verified" aria-hidden="true">✓</span>
                            <span className="cp-sr-only">Sí</span>
                          </>
                        ) : (
                          <>
                            <span className="cp-admin-soft" aria-hidden="true">—</span>
                            <span className="cp-sr-only">No</span>
                          </>
                        )}
                      </td>
                      <td data-label="Acciones">
                        <div className="cp-admin-actions">
                          <Link
                            to={`/admin/phones/${p.id}/edit`}
                            className="cp-icon-btn"
                            title="Editar"
                            aria-label={`Editar ${p.name}`}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            className="cp-icon-btn cp-icon-btn-danger"
                            title="Eliminar"
                            aria-label={`Eliminar ${p.name}`}
                            disabled={deletingId === p.id}
                            onClick={() => handleDelete(p.id, p.name)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {phones.length === 0 && (
              <EmptyState titulo="No hay celulares. Crea el primero.">
                Usa el botón «Nuevo celular» para publicar el primero en la tienda.
              </EmptyState>
            )}
          </div>

          <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} etiqueta="Páginas del catálogo" />
        </>
      )}
    </div>
  )
}
