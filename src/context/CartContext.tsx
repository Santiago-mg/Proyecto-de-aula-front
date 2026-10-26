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
import type { CartItem } from '../types/order'
import type { PhoneColor, PhoneListItem } from '../types/phone'

interface CartContextValue {
  cart: CartItem[]
  totalItems: number
  /** Devuelve cuántas unidades se agregaron de verdad (0 si ya está todo el stock en el carrito). */
  addToCart(phone: PhoneListItem, color: PhoneColor | null, qty?: number): number
  removeFromCart(key: string): void
  updateQty(key: string, qty: number): void
  clearCart(): void
  /** Vuelve a poner líneas quitadas (para "Deshacer"). Las que ya están no se duplican. */
  restaurar(items: CartItem[], indice?: number): void
  /** Máximo de unidades que se pueden llevar de una línea, o null si no se conoce el stock. */
  maxQty(key: string): number | null
}

const CLAVE_CARRITO = 'cp_cart'
// El stock se guarda aparte del carrito para no cambiar la forma de cada línea.
const CLAVE_STOCK = 'cp_cart_stock'

const CartContext = createContext<CartContextValue | null>(null)

function leerStock(): Record<string, number> {
  try {
    const crudo = localStorage.getItem(CLAVE_STOCK)
    const datos: unknown = crudo ? JSON.parse(crudo) : {}
    return datos && typeof datos === 'object' ? (datos as Record<string, number>) : {}
  } catch {
    return {}
  }
}

export function CartProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CLAVE_CARRITO)
      return stored ? (JSON.parse(stored) as CartItem[]) : []
    } catch {
      return []
    }
  })
  // phoneId → unidades disponibles cuando se agregó al carrito
  const [stocks, setStocks] = useState<Record<string, number>>(leerStock)

  // Las funciones de abajo no cambian entre renders, así que leen el estado
  // actual desde estas referencias.
  const cartRef = useRef(cart)
  cartRef.current = cart
  const stocksRef = useRef(stocks)
  stocksRef.current = stocks

  useEffect(() => {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_STOCK, JSON.stringify(stocks))
    } catch {
      // sin almacenamiento el tope solo vale durante esta visita
    }
  }, [stocks])

  const addToCart = useCallback((phone: PhoneListItem, color: PhoneColor | null, qty = 1) => {
    // Un equipo sin variantes de color se agrega igual, como una línea sin color.
    const key = color ? `${phone.id}-${color.colorId}` : phone.id
    const tope = phone.stock > 0 ? phone.stock : Number.POSITIVE_INFINITY
    const enCarrito = cartRef.current.find((i) => i.key === key)?.qty ?? 0
    const agregado = Math.max(0, Math.min(qty, tope - enCarrito))
    if (agregado === 0) return 0

    setCart((prev) => {
      if (prev.some((i) => i.key === key)) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: Math.min(i.qty + agregado, tope) } : i,
        )
      }
      return [
        ...prev,
        {
          key,
          phoneId: phone.id,
          name: phone.name,
          heroImage: phone.heroImage,
          price: phone.price,
          qty: agregado,
          colorId: color?.colorId ?? null,
          colorName: color?.name ?? null,
        },
      ]
    })
    if (Number.isFinite(tope)) setStocks((prev) => ({ ...prev, [phone.id]: phone.stock }))
    return agregado
  }, [])

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key))
  }, [])

  const maxQty = useCallback((key: string) => {
    const linea = cartRef.current.find((i) => i.key === key)
    const stock = linea ? stocksRef.current[linea.phoneId] : undefined
    return typeof stock === 'number' && stock > 0 ? stock : null
  }, [])

  const updateQty = useCallback((key: string, qty: number) => {
    if (qty < 1) return
    setCart((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i
        const stock = stocksRef.current[i.phoneId]
        const tope = typeof stock === 'number' && stock > 0 ? stock : Number.POSITIVE_INFINITY
        return { ...i, qty: Math.min(qty, tope) }
      }),
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const restaurar = useCallback((items: CartItem[], indice?: number) => {
    setCart((prev) => {
      const faltantes = items.filter((it) => !prev.some((p) => p.key === it.key))
      if (faltantes.length === 0) return prev
      const copia = [...prev]
      copia.splice(Math.min(indice ?? copia.length, copia.length), 0, ...faltantes)
      return copia
    })
  }, [])

  // Memorizado: solo cambia cuando cambia el carrito
  const value = useMemo(
    () => ({
      cart,
      totalItems: cart.reduce((sum, i) => sum + i.qty, 0),
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      restaurar,
      maxQty,
    }),
    [cart, addToCart, removeFromCart, updateQty, clearCart, restaurar, maxQty],
  )

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
