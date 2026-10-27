import {
  Ban,
  CheckCircle,
  Crown,
  Search,
  ShieldOff,
  User,
} from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { Loading } from '../../components/ui/Loading'
import { Pagination } from '../../components/ui/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useToastOpcional } from '../../context/ToastContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { adminService } from '../../services/admin.service'
import type { AdminUser } from '../../types/admin'
import { comoError } from '../../utils/errores'

/** Lo mismo que exige el servidor: un motivo de una o dos letras no sirve para nadie. */
const MIN_MOTIVO = 4

/** Espera tras la última tecla antes de buscar. */
const ESPERA_BUSQUEDA = 400

// Confirmación de baneo. Es un diálogo de verdad: el teclado se queda dentro,
// Escape lo cierra y, al cerrarlo, el foco vuelve al botón "Banear" de la fila.
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
  const caja = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)
  const idTitulo = useId()
  const idTexto = useId()
  const idAyuda = useId()
  const valido = reason.trim().length >= MIN_MOTIVO

  useFocusTrap(caja, true, { alEscapar: onCancel, inicial: campo })

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (valido) onConfirm(reason.trim())
  }

  return (
    <div
      className="cp-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        ref={caja}
        className="cp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idTexto}
        tabIndex={-1}
      >
        <div className="cp-modal-header">
          <ShieldOff size={20} aria-hidden="true" className="cp-modal-icon-danger" />
          <h2 id={idTitulo} className="cp-modal-title">Banear usuario</h2>
        </div>
        <p id={idTexto} className="cp-modal-body">
          Vas a suspender la cuenta de{' '}
          <strong>{user.name}</strong> ({user.email}). El usuario no podrá
          iniciar sesión.
        </p>
        <form onSubmit={enviar} noValidate>
          <div className="cp-field">
            <label className="cp-label" htmlFor="motivo-baneo">Motivo del baneo</label>
            <input
              ref={campo}
              id="motivo-baneo"
              className="cp-input"
              placeholder="Ej: Comportamiento fraudulento, spam..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-describedby={idAyuda}
              autoComplete="off"
            />
            <p id={idAyuda} className="cp-field-hint">
              Mínimo {MIN_MOTIVO} caracteres. El motivo queda registrado en la cuenta.
            </p>
          </div>
          <div className="cp-modal-actions">
            <button type="button" className="cp-btn cp-btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="cp-btn cp-btn-danger" disabled={!valido}>
              <Ban size={14} aria-hidden="true" /> Confirmar baneo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function textoTotal(total: number) {
  return total === 1 ? '1 usuario registrado' : `${total} usuarios registrados`
}

export function AdminUsers() {
  useDocumentTitle('Administración · Usuarios')
  const { user: me } = useAuth()
  const avisar = useToastOpcional()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })
  // Qué se está pidiendo. Cambiar el término vuelve a la primera página en el
  // mismo paso, así que cada cambio es una sola petición.
  const [consulta, setConsulta] = useState({ page: 1, termino: '' })
  const [intento, setIntento] = useState(0)
  const [escrito, setEscrito] = useState('')
  const [cargando, setCargando] = useState(true)
  const [yaCargo, setYaCargo] = useState(false)
  const [errorCarga, setErrorCarga] = useState<Error | null>(null)
  const [errorAccion, setErrorAccion] = useState<Error | null>(null)
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Si llegan dos respuestas, solo cuenta la de la última petición.
    let vigente = true
    setCargando(true)
    setErrorCarga(null)
    adminService
      .getUsers(consulta.page, consulta.termino || undefined)
      .then((r) => {
        if (!vigente) return
        setUsers(r.data)
        setMeta(r.meta)
        setYaCargo(true)
      })
      .catch((err) => {
        if (vigente) setErrorCarga(comoError(err))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [consulta, intento])

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current)
    },
    [],
  )

  function buscarTras(valor: string) {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      const termino = valor.trim()
      setConsulta((c) => (c.termino === termino ? c : { page: 1, termino }))
    }, ESPERA_BUSQUEDA)
  }

  function alEscribir(valor: string) {
    setEscrito(valor)
    buscarTras(valor)
  }

  function limpiarBusqueda() {
    if (temporizador.current) clearTimeout(temporizador.current)
    setEscrito('')
    setConsulta({ page: 1, termino: '' })
  }

  // Banear, desbanear y cambiar rol comparten el mismo flujo: bloquear la fila,
  // reemplazarla con lo que devuelve el servidor o mostrar su error.
  async function ejecutarAccion(
    userId: string,
    accion: () => Promise<AdminUser>,
    mensaje: (actualizado: AdminUser) => string,
  ) {
    setActionLoading(userId)
    setErrorAccion(null)
    try {
      const updated = await accion()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      avisar.showToast(mensaje(updated))
    } catch (err) {
      setErrorAccion(comoError(err))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBan(user: AdminUser, reason: string) {
    setBanTarget(null)
    await ejecutarAccion(
      user.id,
      () => adminService.banUser(user.id, reason),
      (u) => `Suspendimos la cuenta de ${u.name}.`,
    )
  }

  async function handleUnban(user: AdminUser) {
    await ejecutarAccion(
      user.id,
      () => adminService.unbanUser(user.id),
      (u) => `Reactivamos la cuenta de ${u.name}.`,
    )
  }

  async function handleRoleChange(user: AdminUser, role: 'USER' | 'ADMIN') {
    if (user.id === me?.id) return
    await ejecutarAccion(
      user.id,
      () => adminService.changeRole(user.id, role),
      (u) => `${u.name} ahora es ${role === 'ADMIN' ? 'administrador' : 'usuario'}.`,
    )
  }

  return (
    <div className="cp-admin-page">
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
        {yaCargo && !errorCarga && (
          <div className="cp-admin-count">{textoTotal(meta.total)}</div>
        )}
      </div>

      {/* Buscador */}
      <div className="cp-admin-search" role="search">
        <label htmlFor="buscar-usuarios" className="cp-sr-only">
          Buscar por nombre o email
        </label>
        <Search size={16} aria-hidden="true" className="cp-admin-search-icon" />
        <input
          id="buscar-usuarios"
          className="cp-input"
          placeholder="Buscar por nombre o email..."
          value={escrito}
          onChange={(e) => alEscribir(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          inputMode="search"
          enterKeyHint="search"
        />
      </div>

      {errorAccion && <ErrorMessage error={errorAccion} />}
      {errorCarga && (
        <ErrorMessage error={errorCarga} onReintentar={() => setIntento((n) => n + 1)} />
      )}

      {cargando && !yaCargo && <Loading text="Cargando usuarios..." />}

      {yaCargo && !errorCarga && (
        <>
          {cargando && (
            <p className="cp-actualizando" role="status">
              Actualizando la lista...
            </p>
          )}

          {users.length === 0 ? (
            !cargando && (
              <EmptyState
                titulo={consulta.termino ? 'Ningún usuario coincide con tu búsqueda' : 'Todavía no hay usuarios'}
                acciones={
                  consulta.termino ? (
                    <button type="button" className="cp-btn cp-btn-secondary" onClick={limpiarBusqueda}>
                      Quitar la búsqueda
                    </button>
                  ) : undefined
                }
              >
                {consulta.termino
                  ? 'Prueba con otra parte del nombre o del correo.'
                  : 'Cuando alguien cree una cuenta, aparecerá aquí.'}
              </EmptyState>
            )
          ) : (
            <div className="cp-admin-table-wrap" aria-busy={cargando}>
              <table className="cp-admin-table">
                <caption className="cp-sr-only">Usuarios registrados</caption>
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Órdenes</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={u.banned ? 'cp-row-baneado' : undefined}>
                      <td>
                        <div className="cp-admin-user-cell">
                          <div className="cp-user-avatar-sm" aria-hidden="true">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="cp-admin-user-title">
                              {u.name}
                              {u.id === me?.id && <span className="cp-admin-you">(tú)</span>}
                            </div>
                            <div className="cp-admin-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Rol">
                        {u.role === 'ADMIN' ? (
                          <span className="cp-badge cp-badge-violet">
                            <Crown size={12} aria-hidden="true" /> Admin
                          </span>
                        ) : (
                          <span className="cp-badge cp-badge-muted">
                            <User size={12} aria-hidden="true" /> Usuario
                          </span>
                        )}
                      </td>
                      <td className="cp-admin-mono" data-label="Órdenes">{u.orderCount}</td>
                      <td className="cp-admin-mono cp-admin-soft" data-label="Registro">
                        <time dateTime={u.createdAt}>
                          {new Date(u.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </time>
                      </td>
                      <td data-label="Estado">
                        {u.banned ? (
                          <div>
                            <span className="cp-badge cp-badge-bad">
                              <Ban size={12} aria-hidden="true" /> Baneado
                            </span>
                            {u.banReason && <div className="cp-ban-reason">{u.banReason}</div>}
                          </div>
                        ) : (
                          <span className="cp-badge cp-badge-ok">
                            <CheckCircle size={12} aria-hidden="true" /> Activo
                          </span>
                        )}
                      </td>
                      <td data-label="Acciones">
                        <div className="cp-admin-actions">
                          {/* Ban / Unban: nadie puede suspenderse a sí mismo */}
                          {u.id !== me?.id &&
                            (u.banned ? (
                              <button
                                type="button"
                                className="cp-btn cp-btn-ghost cp-btn-sm cp-tone-ok"
                                aria-label={`Desbanear a ${u.name}`}
                                disabled={actionLoading === u.id}
                                onClick={() => handleUnban(u)}
                              >
                                <CheckCircle size={14} aria-hidden="true" /> Desbanear
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="cp-btn cp-btn-ghost cp-btn-sm cp-tone-bad"
                                aria-label={`Banear a ${u.name}`}
                                disabled={actionLoading === u.id}
                                onClick={() => setBanTarget(u)}
                              >
                                <Ban size={14} aria-hidden="true" /> Banear
                              </button>
                            ))}

                          {/* Cambiar rol */}
                          {u.id !== me?.id && (
                            <button
                              type="button"
                              className="cp-btn cp-btn-ghost cp-btn-sm cp-tone-violet"
                              aria-label={`${u.role === 'ADMIN' ? 'Quitar admin a' : 'Hacer admin a'} ${u.name}`}
                              disabled={actionLoading === u.id}
                              onClick={() => handleRoleChange(u, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                            >
                              <Crown size={14} aria-hidden="true" />
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
          )}

          <Pagination
            page={consulta.page}
            totalPages={meta.totalPages}
            onPage={(page) => setConsulta((c) => ({ ...c, page }))}
            etiqueta="Páginas de usuarios"
          />
        </>
      )}
    </div>
  )
}
