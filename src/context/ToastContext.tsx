import { X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type TonoAviso = 'ok' | 'error' | 'info'

export interface AccionAviso {
  etiqueta: string
  onClick(): void
}

export interface OpcionesAviso {
  tono?: TonoAviso
  /** Botón dentro del aviso (por ejemplo "Deshacer"). */
  accion?: AccionAviso
  /** Milisegundos en pantalla. Por defecto 2800; con acción, 7000. */
  duracion?: number
}

interface Aviso {
  id: number
  mensaje: string
  tono: TonoAviso
  accion?: AccionAviso
  duracion: number
}

interface ToastContextValue {
  /** Muestra un aviso y devuelve su id por si hay que quitarlo antes. */
  showToast(message: string, opciones?: OpcionesAviso): number
  descartar(id: number): void
}

const DURACION_NORMAL = 2800
// Con un botón hay que dar tiempo de leerlo y decidir.
const DURACION_CON_ACCION = 7000
const MAXIMO_VISIBLES = 3

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const siguienteId = useRef(1)
  // id → temporizador activo y cuánto tiempo le quedaba al pausarlo
  const temporizadores = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const restante = useRef(new Map<number, { ms: number; desde: number }>())

  const descartar = useCallback((id: number) => {
    const t = temporizadores.current.get(id)
    if (t) clearTimeout(t)
    temporizadores.current.delete(id)
    restante.current.delete(id)
    setAvisos((lista) => lista.filter((a) => a.id !== id))
  }, [])

  const programar = useCallback(
    (id: number, ms: number) => {
      const previo = temporizadores.current.get(id)
      if (previo) clearTimeout(previo)
      restante.current.set(id, { ms, desde: Date.now() })
      temporizadores.current.set(
        id,
        setTimeout(() => descartar(id), ms),
      )
    },
    [descartar],
  )

  const showToast = useCallback(
    (message: string, opciones: OpcionesAviso = {}) => {
      const id = siguienteId.current++
      const duracion = opciones.duracion ?? (opciones.accion ? DURACION_CON_ACCION : DURACION_NORMAL)
      const aviso: Aviso = {
        id,
        mensaje: message,
        tono: opciones.tono ?? 'ok',
        accion: opciones.accion,
        duracion,
      }
      // Si se acumulan, el más viejo se va: no se tapan unos a otros.
      setAvisos((lista) => [...lista, aviso].slice(-MAXIMO_VISIBLES))
      programar(id, duracion)
      return id
    },
    [programar],
  )

  // Mientras el cursor o el foco están sobre el aviso, el reloj se detiene:
  // así da tiempo de leerlo o de llegar al botón (WCAG 2.2.1).
  function pausar(id: number) {
    const t = temporizadores.current.get(id)
    const info = restante.current.get(id)
    if (!t || !info) return
    clearTimeout(t)
    temporizadores.current.delete(id)
    restante.current.set(id, { ms: Math.max(1500, info.ms - (Date.now() - info.desde)), desde: Date.now() })
  }

  function reanudar(id: number) {
    const info = restante.current.get(id)
    if (!info || temporizadores.current.has(id)) return
    programar(id, info.ms)
  }

  useEffect(() => {
    const activos = temporizadores.current
    return () => {
      for (const t of activos.values()) clearTimeout(t)
      activos.clear()
    }
  }, [])

  const value = useMemo(() => ({ showToast, descartar }), [showToast, descartar])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* La región existe siempre: así el lector de pantalla anuncia los avisos nuevos. */}
      <div className="cp-toasts" aria-live="polite" aria-relevant="additions text">
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`cp-toast cp-toast-${a.tono}`}
            onMouseEnter={() => pausar(a.id)}
            onMouseLeave={() => reanudar(a.id)}
            onFocus={() => pausar(a.id)}
            onBlur={() => reanudar(a.id)}
          >
            {a.tono === 'error' && <span className="cp-sr-only">Error: </span>}
            <span className="cp-toast-msg">{a.mensaje}</span>
            {a.accion && (
              <button
                type="button"
                className="cp-toast-action"
                onClick={() => {
                  a.accion?.onClick()
                  descartar(a.id)
                }}
              >
                {a.accion.etiqueta}
              </button>
            )}
            <button
              type="button"
              className="cp-toast-close"
              aria-label="Cerrar aviso"
              onClick={() => descartar(a.id)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}

const SIN_AVISOS: ToastContextValue = { showToast: () => 0, descartar: () => {} }

/**
 * Como useToast, pero sin fallar fuera del ToastProvider: ahí los avisos
 * simplemente no salen. Sirve para pantallas que también se montan solas
 * (en pruebas o en una vista previa) y que no deben romperse por un aviso.
 */
export function useToastOpcional(): ToastContextValue {
  return useContext(ToastContext) ?? SIN_AVISOS
}
