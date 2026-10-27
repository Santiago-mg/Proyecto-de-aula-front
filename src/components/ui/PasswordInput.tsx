import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean
}

// Campo de contraseña con botón para mostrarla. Quien escribe despacio o desde
// un celular puede comprobar lo que tecleó en lugar de adivinar un error.
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ invalid, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <div className="cp-password-wrap">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`cp-input cp-input-password ${invalid ? 'error' : ''} ${className ?? ''}`.trim()}
          aria-invalid={invalid || undefined}
          {...rest}
        />
        <button
          type="button"
          className="cp-password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
    )
  },
)
