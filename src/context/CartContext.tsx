import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem } from '../types/order'
import type { PhoneColor, PhoneListItem } from '../types/phone'

interface CartContextValue {
  cart: CartItem[]
  totalItems: number
  addToCart(phone: PhoneListItem, color: PhoneColor | null, qty?: number): void
  removeFromCart(key: string): void
  updateQty(key: string, qty: number): void
  clearCart(): void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('cp_cart')
      return stored ? (JSON.parse(stored) as CartItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('cp_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = useCallback((phone: PhoneListItem, color: PhoneColor | null, qty = 1) => {
    // Un equipo sin variantes de color se agrega igual, como una línea sin color.
    const key = color ? `${phone.id}-${color.colorId}` : phone.id
    setCart((prev) => {
      if (prev.some((i) => i.key === key)) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: i.qty + qty } : i,
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
          qty,
          colorId: color?.colorId ?? null,
          colorName: color?.name ?? null,
        },
      ]
    })
  }, [])

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key))
  }, [])

  const updateQty = useCallback((key: string, qty: number) => {
    if (qty < 1) return
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, qty } : i)))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
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
    }),
    [cart, addToCart, removeFromCart, updateQty, clearCart],
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
