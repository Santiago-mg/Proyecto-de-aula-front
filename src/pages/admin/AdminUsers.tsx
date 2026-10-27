import {
  Ban,
  CheckCircle,
  LockOpen,
  Crown,
  Search,
  ShieldOff,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { Loading } from '../../components/ui/Loading'
import { Pagination } from '../../components/ui/Pagination'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../services/admin.service'
import type { AdminUser } from '../../types/admin'
import { comoError } from '../../utils/errores'

// Los modales se cierran con Escape (además del botón Cancelar).
function useCerrarConEscape(onCancel: () => void) {
  useEffect(() => {
    function alPulsar(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [onCancel])
}

// Confirmación antes de cambiar un rol: dar o quitar el acceso de administrador
// cambia lo que la persona puede hacer, y antes se ejecutaba al primer clic.
function RoleModal({
  user,
  role,
  onConfirm,
  onCancel,
}: Readonly<{
  user: AdminUser
  role: 'USER' | 'ADMIN'
  onConfirm(): void
  onCancel(): void
}>) {
  useCerrarConEscape(onCancel)
  const daAcceso = role === 'ADMIN'

  return (
    <div className="cp-modal-overlay">
      <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="rol-titulo">
        <div className="cp-modal-header">
          <Crown size={20} style={{ color: '#a855f7' }} />
          <h3 id="rol-titulo" className="cp-modal-title">
            {daAcceso ? 'Hacer administrador' : 'Quitar administrador'}
          </h3>
        </div>
        <p className="cp-modal-body">
          {daAcceso ? (
            <>
              Vas a dar acceso de administrador a <strong>{user.name}</strong> ({user.email}).
              Podrá banear usuarios, cambiar roles y gestionar el catálogo.
            </>
          ) : (
            <>
              Vas a quitar el acceso de administrador a <strong>{user.name}</strong> ({user.email}).
              Perderá el acceso al panel de inmediato.
            </>
          )}
        </p>
        <div className="cp-modal-actions">
          <button className="cp-btn cp-btn-secondary" onClick={onCancel} autoFocus>
            Cancelar
          </button>
          <button className="cp-btn cp-btn-primary" onClick={onConfirm}>
            {daAcceso ? 'Sí, hacer admin' : 'Sí, quitar admin'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal sencillo de confirmación de ban
function BanModal({
  user,
  onConfirm,
  onCancel,
}: Readonly<{
  user: AdminUser
  onConfirm(reason: string): void
  onCancel(): void
}>) {
  const [reason, setReason] = useState('')
  useCerrarConEscape(onCancel)

  return (
    <div className="cp-modal-overlay">
      <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="ban-titulo">
        <div className="cp-modal-header">
          <ShieldOff size={20} style={{ color: '#ff3860' }} />
          <h3 id="ban-titulo" className="cp-modal-title">Banear usuario</h3>
        </div>
        <p className="cp-modal-body">
          Vas a suspender la cuenta de{' '}
          <strong>{user.name}</strong> ({user.email}). El usuario no podrá
          iniciar sesión.
        </p>
        <div className="cp-field">
          <label className="cp-label" htmlFor="motivo-baneo">Motivo del baneo</label>
          <input
            id="motivo-baneo"
            className="cp-input"
            placeholder="Ej: Comportamiento fraudulento, spam..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <div className="cp-modal-actions">
          <button className="cp-btn cp-btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="cp-btn"
            style={{ background: '#ff3860', color: '#fff', border: 'none' }}
            disabled={reason.trim().length < 4}
            onClick={() => onConfirm(reason.trim())}
          >
            <Ban size={14} /> Confirmar baneo
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null)
  const [roleTarget, setRoleTarget] = useState<{ user: AdminUser; role: 'USER' | 'ADMIN' } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function load(p: number, s: string) {
    setLoading(true)
    setError(null)
    adminService
      .getUsers(p, s || undefined)
      .then((r) => {
        setUsers(r.data)
        setMeta(r.meta)
      })
      .catch((err) => setError(comoError(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(page, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setPage(1)
      load(1, value)
    }, 400)
  }

  // Banear, desbanear y cambiar rol comparten el mismo flujo: bloquear la fila,
  // reemplazarla con lo que devuelve el servidor o mostrar su error.
  async function ejecutarAccion(userId: string, accion: () => Promise<AdminUser>) {
    setActionLoading(userId)
    setError(null)
    try {
      const updated = await accion()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err) {
      setError(comoError(err))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBan(user: AdminUser, reason: string) {
    setBanTarget(null)
    await ejecutarAccion(user.id, () => adminService.banUser(user.id, reason))
  }

  async function handleUnban(user: AdminUser) {
    await ejecutarAccion(user.id, () => adminService.unbanUser(user.id))
  }

  async function handleRoleChange(user: AdminUser, role: 'USER' | 'ADMIN') {
    if (user.id === me?.id) return
    await ejecutarAccion(user.id, () => adminService.changeRole(user.id, role))
  }

  return (
    <div className="cp-admin-page">
      {roleTarget && (
        <RoleModal
          user={roleTarget.user}
          role={roleTarget.role}
          onConfirm={() => {
            const { user, role } = roleTarget
            setRoleTarget(null)
            void handleRoleChange(user, role)
          }}
          onCancel={() => setRoleTarget(null)}
        />
      )}
      {banTarget && (
        <BanModal
          user={banTarget}
          onConfirm={(reason) => handleBan(banTarget, reason)}
          onCancel={() => setBanTarget(null)}
        />
      )}

      <div className="cp-admin-page-header">
        <div>
          <div className="cp-admin-page-eyebrow">— Gestión</div>
          <h1 className="cp-admin-page-title">Usuarios</h1>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-soft)',
          }}
        >
          {meta.total} usuarios registrados
        </div>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--ink-faint)',
          }}
        />
        <input
          className="cp-input"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
      </div>

      {error && <ErrorMessage error={error} />}

      {loading ? (
        <Loading text="Cargando usuarios..." />
      ) : (
        <>
          <div className="cp-admin-table-wrap">
            <table className="cp-admin-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Órdenes</th>
                  <th>Registro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ opacity: u.banned ? 0.65 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="cp-user-avatar-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>
                            {u.name}
                            {u.id === me?.id && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 12,
                                  color: 'var(--accent)',
                                }}
                              >
                                (tú)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="cp-badge"
                        style={
                          u.role === 'ADMIN'
                            ? {
                                background: 'rgba(168,85,247,0.15)',
                                color: '#a855f7',
                                border: '1px solid rgba(168,85,247,0.3)',
                              }
                            : {
                                background: 'rgba(0,229,255,0.08)',
                                color: 'var(--ink-soft)',
                                border: '1px solid var(--line-strong)',
                              }
                        }
                      >
                        {u.role === 'ADMIN' ? (
                          <><Crown size={10} /> Admin</>
                        ) : (
                          <><User size={10} /> Usuario</>
                        )}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {u.orderCount}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
                      {new Date(u.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td>
                      {u.banned ? (
                        <div>
                          <span
                            className="cp-badge"
                            style={{
                              background: 'rgba(255,56,96,0.15)',
                              color: '#ff3860',
                              border: '1px solid rgba(255,56,96,0.3)',
                            }}
                          >
                            <Ban size={10} /> Baneado
                          </span>
                          {u.banReason && (
                            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>
                              {u.banReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className="cp-badge"
                          style={{
                            background: 'rgba(34,255,136,0.1)',
                            color: '#22ff88',
                            border: '1px solid rgba(34,255,136,0.25)',
                          }}
                        >
                          <CheckCircle size={10} /> Activo
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* Ban / Unban */}
                        {u.id !== me?.id && (
                          u.banned ? (
                            <button
                              className="cp-btn cp-btn-ghost"
                              style={{ fontSize: 12, padding: '6px 12px', color: '#22ff88' }}
                              disabled={actionLoading === u.id}
                              onClick={() => handleUnban(u)}
                            >
                              {/* Heurística 4: CheckCircle queda solo para "Activo" */}
                              <LockOpen size={12} aria-hidden="true" /> Desbanear
                            </button>
                          ) : u.role === 'ADMIN' ? (
                            // H7.1: no se banea a un administrador. La pantalla no lo ofrece y explica
                            // el camino; el backend también lo rechaza (403), de forma atómica.
                            <span className="cp-field-hint" style={{ alignSelf: 'center' }}>
                              Para banearlo, quita primero el rol admin
                            </span>
                          ) : (
                            <button
                              className="cp-btn cp-btn-ghost"
                              style={{ fontSize: 12, padding: '6px 12px', color: '#ff3860' }}
                              disabled={actionLoading === u.id}
                              onClick={() => setBanTarget(u)}
                            >
                              <Ban size={12} /> Banear
                            </button>
                          )
                        )}

                        {/* Cambiar rol */}
                        {u.id !== me?.id && (
                          <button
                            className="cp-btn cp-btn-ghost"
                            style={{ fontSize: 12, padding: '6px 12px', color: '#a855f7' }}
                            disabled={actionLoading === u.id}
                            onClick={() =>
                              setRoleTarget({ user: u, role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })
                            }
                          >
                            <Crown size={12} />
                            {u.role === 'ADMIN' ? 'Quitar admin' : 'Hacer admin'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  )
}
