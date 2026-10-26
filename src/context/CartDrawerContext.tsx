import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface CartDrawerValue {
  abierto: boolean
  /** false cuando no hay panel de carrito montado (por ejemplo, en páginas sueltas). */
  disponible: boolean
  abrir(): void
  cerrar(): void
}

const sinPanel: CartDrawerValue = {
  abierto: false,
  disponible: false,
  abrir: () => undefined,
  cerrar: () => undefined,
}

const CartDrawerContext = createContext<CartDrawerValue>(sinPanel)

/**
 * Deja abrir el carrito desde cualquier parte (por ejemplo desde el aviso
 * "Producto añadido · Ver carrito") sin pasar funciones de padre a hijo.
 */
export function CartDrawerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [abierto, setAbierto] = useState(false)
  const abrir = useCallback(() => setAbierto(true), [])
  const cerrar = useCallback(() => setAbierto(false), [])
  const value = useMemo<CartDrawerValue>(
    () => ({ abierto, disponible: true, abrir, cerrar }),
    [abierto, abrir, cerrar],
  )
  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>
}

export function useCartDrawer(): CartDrawerValue {
  return useContext(CartDrawerContext)
}
