import { AlertTriangle } from 'lucide-react'
import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

export interface OpcionesConfirmacion {
  titulo: string
  mensaje: ReactNode
  /** Texto del botón que confirma. Por defecto "Confirmar". */
  confirmar?: string
  cancelar?: string
  /** Acción que no se puede deshacer: botón rojo y el foco arranca en "Cancelar". */
  peligro?: boolean
}

interface ConfirmDialogProps extends OpcionesConfirmacion {
  onConfirmar(): void
  onCancelar(): void
}

/**
 * Pregunta antes de una acción que no se puede deshacer. Reemplaza al confirm()
 * del navegador, que no se puede estilizar, no dice qué hace cada botón
 * ("Aceptar"/"Cancelar") y en algunos navegadores se bloquea.
 */
export function ConfirmDialog({
  titulo,
  mensaje,
  confirmar = 'Confirmar',
  cancelar = 'Cancelar',
  peligro = false,
  onConfirmar,
  onCancelar,
}: Readonly<ConfirmDialogProps>) {
  const caja = useRef<HTMLDivElement>(null)
  const botonCancelar = useRef<HTMLButtonElement>(null)
  const idTitulo = useId()
  const idMensaje = useId()

  // Si el gesto es destructivo, el foco empieza en la salida segura.
  useFocusTrap(caja, true, {
    alEscapar: onCancelar,
    inicial: peligro ? botonCancelar : undefined,
  })

  return (
    <div
      className="cp-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancelar()
      }}
    >
      <div
        ref={caja}
        className="cp-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensaje}
        tabIndex={-1}
      >
        <div className="cp-modal-header">
          {peligro && <AlertTriangle size={20} className="cp-modal-icon-danger" aria-hidden="true" />}
          <h2 id={idTitulo} className="cp-modal-title">
            {titulo}
          </h2>
        </div>
        <div id={idMensaje} className="cp-modal-body">
          {mensaje}
        </div>
        <div className="cp-modal-actions">
          <button ref={botonCancelar} type="button" className="cp-btn cp-btn-secondary" onClick={onCancelar}>
            {cancelar}
          </button>
          <button
            type="button"
            className={`cp-btn ${peligro ? 'cp-btn-danger' : 'cp-btn-primary'}`}
            onClick={onConfirmar}
          >
            {confirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Forma cómoda de usar el diálogo desde un manejador de eventos:
 *
 *   const { pedir, dialogo } = useConfirmacion()
 *   if (await pedir({ titulo: '...', mensaje: '...', peligro: true })) borrar()
 *   return <>... {dialogo}</>
 */
export function useConfirmacion() {
  const [pendiente, setPendiente] = useState<{
    opciones: OpcionesConfirmacion
    resolver(valor: boolean): void
  } | null>(null)

  const pedir = useCallback(
    (opciones: OpcionesConfirmacion) =>
      new Promise<boolean>((resolver) => {
        setPendiente({ opciones, resolver })
      }),
    [],
  )

  function responder(valor: boolean) {
    pendiente?.resolver(valor)
    setPendiente(null)
  }

  const dialogo = pendiente ? (
    <ConfirmDialog
      {...pendiente.opciones}
      onConfirmar={() => responder(true)}
      onCancelar={() => responder(false)}
    />
  ) : null

  return { pedir, dialogo }
}
