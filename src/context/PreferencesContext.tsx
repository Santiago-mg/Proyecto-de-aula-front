import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { PreferencesDialog } from '../components/ui/PreferencesDialog'

export type Tema = 'sistema' | 'oscuro' | 'claro' | 'contraste'
export type TamanoTexto = 100 | 115 | 130
export type Movimiento = 'sistema' | 'reducido'
export type TemaAplicado = 'oscuro' | 'claro' | 'contraste'

export interface Preferencias {
  tema: Tema
  tamano: TamanoTexto
  movimiento: Movimiento
}

export const PREFERENCIAS_INICIALES: Preferencias = {
  tema: 'sistema',
  tamano: 100,
  movimiento: 'sistema',
}

export const CLAVE_PREFERENCIAS = 'cp_prefs'

const TEMAS: readonly Tema[] = ['sistema', 'oscuro', 'claro', 'contraste']
const TAMANOS: readonly TamanoTexto[] = [100, 115, 130]
const MOVIMIENTOS: readonly Movimiento[] = ['sistema', 'reducido']

function consulta(media: string): boolean {
  try {
    return typeof globalThis.matchMedia === 'function' && globalThis.matchMedia(media).matches
  } catch {
    return false
  }
}

/** Lee lo guardado y descarta cualquier valor que no sea una opción válida. */
export function leerPreferencias(): Preferencias {
  try {
    const crudo = localStorage.getItem(CLAVE_PREFERENCIAS)
    const guardado = (crudo ? JSON.parse(crudo) : {}) as Partial<Preferencias>
    return {
      tema: TEMAS.includes(guardado.tema as Tema) ? (guardado.tema as Tema) : PREFERENCIAS_INICIALES.tema,
      tamano: TAMANOS.includes(guardado.tamano as TamanoTexto)
        ? (guardado.tamano as TamanoTexto)
        : PREFERENCIAS_INICIALES.tamano,
      movimiento: MOVIMIENTOS.includes(guardado.movimiento as Movimiento)
        ? (guardado.movimiento as Movimiento)
        : PREFERENCIAS_INICIALES.movimiento,
    }
  } catch {
    return PREFERENCIAS_INICIALES
  }
}

interface PreferenciasDelSistema {
  claro: boolean
  contraste: boolean
  reducido: boolean
}

function leerSistema(): PreferenciasDelSistema {
  return {
    claro: consulta('(prefers-color-scheme: light)'),
    contraste: consulta('(prefers-contrast: more)'),
    reducido: consulta('(prefers-reduced-motion: reduce)'),
  }
}

/** Con "automático" manda lo que pida el dispositivo (modo claro o más contraste). */
export function resolverTema(tema: Tema, sistema: PreferenciasDelSistema): TemaAplicado {
  if (tema !== 'sistema') return tema
  if (sistema.contraste) return 'contraste'
  return sistema.claro ? 'claro' : 'oscuro'
}

/** Escribe las preferencias en <html>; el CSS reacciona a esos atributos. */
export function aplicarPreferencias(p: Preferencias, tema: TemaAplicado, reducido: boolean) {
  const raiz = document.documentElement
  raiz.dataset.tema = tema
  raiz.dataset.tamano = String(p.tamano)
  raiz.dataset.movimiento = reducido ? 'reducido' : 'completo'
}

interface PreferenciasContextValue {
  preferencias: Preferencias
  /** Tema que se está mostrando de verdad (resuelve "automático"). */
  temaAplicado: TemaAplicado
  /** true si el usuario o su dispositivo piden menos movimiento. */
  movimientoReducido: boolean
  cambiar(parcial: Partial<Preferencias>): void
  restablecer(): void
  panelAbierto: boolean
  abrirPanel(): void
  cerrarPanel(): void
}

const sinProveedor: PreferenciasContextValue = {
  preferencias: PREFERENCIAS_INICIALES,
  temaAplicado: 'oscuro',
  movimientoReducido: false,
  cambiar: () => undefined,
  restablecer: () => undefined,
  panelAbierto: false,
  abrirPanel: () => undefined,
  cerrarPanel: () => undefined,
}

const PreferenciasContext = createContext<PreferenciasContextValue>(sinProveedor)

export function PreferencesProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [preferencias, setPreferencias] = useState<Preferencias>(leerPreferencias)
  const [sistema, setSistema] = useState<PreferenciasDelSistema>(leerSistema)
  const [panelAbierto, setPanelAbierto] = useState(false)

  const temaAplicado = resolverTema(preferencias.tema, sistema)
  const movimientoReducido = preferencias.movimiento === 'reducido' || sistema.reducido

  // Aplica y guarda cada cambio.
  useEffect(() => {
    aplicarPreferencias(preferencias, temaAplicado, movimientoReducido)
    try {
      localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(preferencias))
    } catch {
      // Sin almacenamiento la preferencia vale solo durante esta visita.
    }
  }, [preferencias, temaAplicado, movimientoReducido])

  // Si el dispositivo cambia de modo mientras se navega, se sigue (en "automático").
  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') return
    const consultas = [
      '(prefers-color-scheme: light)',
      '(prefers-contrast: more)',
      '(prefers-reduced-motion: reduce)',
    ].map((q) => globalThis.matchMedia(q))
    const alCambiar = () => setSistema(leerSistema())
    for (const c of consultas) c.addEventListener?.('change', alCambiar)
    return () => {
      for (const c of consultas) c.removeEventListener?.('change', alCambiar)
    }
  }, [])

  const cambiar = useCallback((parcial: Partial<Preferencias>) => {
    setPreferencias((actual) => ({ ...actual, ...parcial }))
  }, [])
  const restablecer = useCallback(() => setPreferencias(PREFERENCIAS_INICIALES), [])
  const abrirPanel = useCallback(() => setPanelAbierto(true), [])
  const cerrarPanel = useCallback(() => setPanelAbierto(false), [])

  const value = useMemo(
    () => ({
      preferencias,
      temaAplicado,
      movimientoReducido,
      cambiar,
      restablecer,
      panelAbierto,
      abrirPanel,
      cerrarPanel,
    }),
    [preferencias, temaAplicado, movimientoReducido, cambiar, restablecer, panelAbierto, abrirPanel, cerrarPanel],
  )

  return (
    <PreferenciasContext.Provider value={value}>
      {children}
      {panelAbierto && (
        <PreferencesDialog
          preferencias={preferencias}
          cambiar={cambiar}
          restablecer={restablecer}
          cerrarPanel={cerrarPanel}
        />
      )}
    </PreferenciasContext.Provider>
  )
}

/** Devuelve valores neutros si no hay proveedor, para no obligar a montarlo en cada prueba. */
export function usePreferencias(): PreferenciasContextValue {
  return useContext(PreferenciasContext)
}
