import { Check, Circle } from 'lucide-react'
import { PASSWORD_MAX, PASSWORD_MIN } from '../../utils/validacion'

// Heurísticas 5, 7 y 8: las reglas de la contraseña se ven ANTES de escribir y
// cada una se marca en tiempo real. Antes solo se conocían al fallar.
// Son las mismas reglas del backend (src/utils/validacion.ts).
export const REGLAS_CONTRASENA = [
  { id: 'largo', texto: `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`, cumple: (c: string) => c.length >= PASSWORD_MIN && c.length <= PASSWORD_MAX },
  { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: (c: string) => /[A-Z]/.test(c) },
  { id: 'minuscula', texto: 'Una letra minúscula', cumple: (c: string) => /[a-z]/.test(c) },
  { id: 'numero', texto: 'Un número', cumple: (c: string) => /\d/.test(c) },
] as const

interface Props {
  valor: string
  id?: string
}

export function ReglasContrasena({ valor, id }: Readonly<Props>) {
  const cumplidas = REGLAS_CONTRASENA.filter((r) => r.cumple(valor)).length

  return (
    <div id={id} className="cp-reglas">
      <ul className="cp-reglas-lista" aria-label="Requisitos de la contraseña">
        {REGLAS_CONTRASENA.map((regla) => {
          const ok = regla.cumple(valor)
          return (
            <li key={regla.id} className={ok ? 'cp-regla ok' : 'cp-regla'} data-regla={regla.id} data-cumple={ok}>
              {ok ? <Check size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
              <span>{regla.texto}</span>
              <span className="cp-sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
            </li>
          )
        })}
      </ul>
      {/* Resumen para lectores de pantalla: se anuncia sin interrumpir */}
      <p className="cp-sr-only" aria-live="polite">
        {valor ? `${cumplidas} de ${REGLAS_CONTRASENA.length} requisitos cumplidos` : ''}
      </p>
    </div>
  )
}
