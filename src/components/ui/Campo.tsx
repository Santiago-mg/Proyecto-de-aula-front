import type { InputHTMLAttributes, ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface CampoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'name'> {
  id: string
  etiqueta: string
  /** Lo que devuelve register('campo') de react-hook-form. */
  registro: UseFormRegisterReturn
  /** Mensaje de error ya redactado para la persona. */
  error?: string
  /** Instrucción que se ve siempre, antes de equivocarse (por ejemplo, el formato). */
  ayuda?: string
  /** Control pegado al borde derecho del campo (por ejemplo, "Mostrar"). */
  accion?: ReactNode
}

/**
 * Campo de formulario completo: etiqueta, entrada, ayuda y error. Deja todo
 * enlazado para el lector de pantalla (aria-describedby, aria-invalid), así
 * al caer el foco en un campo con error se escucha qué hay que corregir.
 *
 * El id se mantiene tal cual ("email", "password"...) porque las pruebas de
 * extremo a extremo y los navegadores (autocompletado) dependen de él.
 */
export function Campo({ id, etiqueta, registro, error, ayuda, accion, ...resto }: Readonly<CampoProps>) {
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const descrito = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="cp-field">
      <label htmlFor={id} className="cp-label">
        {etiqueta}
      </label>
      <div className={accion ? 'cp-input-wrap con-accion' : 'cp-input-wrap'}>
        <input
          id={id}
          className={`cp-input ${error ? 'error' : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={descrito}
          {...registro}
          {...resto}
        />
        {accion}
      </div>
      {ayuda && (
        <p id={idAyuda} className="cp-field-hint">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="cp-field-error">
          {error}
        </p>
      )}
    </div>
  )
}
