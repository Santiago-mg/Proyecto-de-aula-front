import { X } from 'lucide-react'
import { useId, useRef } from 'react'
import type { Movimiento, Preferencias, TamanoTexto, Tema } from '../../context/PreferencesContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'

const TEMAS: { valor: Tema; titulo: string; detalle: string }[] = [
  { valor: 'sistema', titulo: 'Automático', detalle: 'Sigue la configuración de tu dispositivo' },
  { valor: 'oscuro', titulo: 'Oscuro', detalle: 'El aspecto original de la tienda' },
  { valor: 'claro', titulo: 'Claro', detalle: 'Fondo blanco, más cómodo con luz del día' },
  { valor: 'contraste', titulo: 'Alto contraste', detalle: 'Texto y bordes más marcados' },
]

const TAMANOS: { valor: TamanoTexto; titulo: string }[] = [
  { valor: 100, titulo: 'Normal' },
  { valor: 115, titulo: 'Grande' },
  { valor: 130, titulo: 'Muy grande' },
]

/**
 * Panel para adaptar la pantalla a quien la usa: tema, tamaño del texto y
 * animaciones. Los cambios se aplican al instante y quedan guardados en el
 * navegador; no hace falta un botón "Guardar".
 */
interface PreferencesDialogProps {
  preferencias: Preferencias
  cambiar(parcial: Partial<Preferencias>): void
  restablecer(): void
  cerrarPanel(): void
}

export function PreferencesDialog({
  preferencias,
  cambiar,
  restablecer,
  cerrarPanel,
}: Readonly<PreferencesDialogProps>) {
  const caja = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  const idDetalle = useId()

  useFocusTrap(caja, true, { alEscapar: cerrarPanel })

  return (
    <div
      className="cp-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrarPanel()
      }}
    >
      <div
        ref={caja}
        className="cp-modal cp-prefs"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDetalle}
        tabIndex={-1}
      >
        <div className="cp-modal-header">
          <h2 id={idTitulo} className="cp-modal-title">
            Pantalla y accesibilidad
          </h2>
          <button type="button" className="cp-icon-btn cp-prefs-close" onClick={cerrarPanel} aria-label="Cerrar panel">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p id={idDetalle} className="cp-prefs-intro">
          Los cambios se aplican al instante y se guardan en este navegador.
        </p>

        <fieldset className="cp-prefs-grupo">
          <legend>Tema</legend>
          {TEMAS.map((t) => (
            <label key={t.valor} className="cp-prefs-opcion">
              <input
                type="radio"
                name="tema"
                value={t.valor}
                checked={preferencias.tema === t.valor}
                onChange={() => cambiar({ tema: t.valor })}
              />
              <span>
                {t.titulo}
                <small>{t.detalle}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="cp-prefs-grupo">
          <legend>Tamaño del texto</legend>
          <div className="cp-prefs-fila">
            {TAMANOS.map((t) => (
              <label key={t.valor} className="cp-prefs-chip">
                <input
                  type="radio"
                  name="tamano"
                  value={t.valor}
                  checked={preferencias.tamano === t.valor}
                  onChange={() => cambiar({ tamano: t.valor })}
                />
                <span style={{ fontSize: `${t.valor / 100}rem` }}>{t.titulo}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="cp-prefs-grupo">
          <legend>Movimiento</legend>
          <label className="cp-prefs-opcion">
            <input
              type="checkbox"
              checked={preferencias.movimiento === 'reducido'}
              onChange={(e) => cambiar({ movimiento: (e.target.checked ? 'reducido' : 'sistema') as Movimiento })}
            />
            <span>
              Reducir animaciones
              <small>Detiene la barra que se desplaza y los efectos de fondo</small>
            </span>
          </label>
        </fieldset>

        <div className="cp-modal-actions">
          <button type="button" className="cp-btn cp-btn-secondary" onClick={restablecer}>
            Restablecer
          </button>
          <button type="button" className="cp-btn cp-btn-primary" onClick={cerrarPanel}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
