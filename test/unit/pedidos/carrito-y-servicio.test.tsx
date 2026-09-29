import { expect } from 'chai'
import { describe, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CartProvider, useCart } from '../../../src/context/CartContext'
import { ordersService } from '../../../src/services/orders.service'
import { listado, ok, servidor } from '../../helpers/servidor'
import { celular, celularCompleto, itemCarrito, paginado, pedido } from '../../helpers/fixtures'

// Basado en: context/CartContext.tsx y services/orders.service.ts
// Equivalente front de tests/unit/pedidos/orders.use-cases.test.ts.

const envoltorio = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>
const [NEGRO, AZUL] = celularCompleto().colors

describe('CartContext — reglas del carrito', () => {
  it('el mismo equipo y color suma cantidad; otro color abre otra línea', () => {
    // Arrange
    const { result } = renderHook(() => useCart(), { wrapper: envoltorio })

    // Act
    act(() => {
      result.current.addToCart(celular(), NEGRO)
      result.current.addToCart(celular(), NEGRO, 2)
      result.current.addToCart(celular(), AZUL)
    })

    // Assert
    expect(result.current.cart.map((i) => [i.key, i.qty])).to.deep.equal([
      ['phone-1-negro', 3],
      ['phone-1-azul', 1],
    ])
    expect(result.current.totalItems).to.equal(4)
  })

  it('una cantidad menor que 1 se ignora', () => {
    // Arrange
    localStorage.setItem('cp_cart', JSON.stringify([itemCarrito({ qty: 2 })]))
    const { result } = renderHook(() => useCart(), { wrapper: envoltorio })

    // Act
    act(() => {
      result.current.updateQty('phone-1-negro', 0)
    })

    // Assert
    expect(result.current.cart[0].qty).to.equal(2)
  })

  it('un carrito corrupto en el navegador arranca vacío', () => {
    // Arrange
    localStorage.setItem('cp_cart', '[{roto')

    // Act
    const { result } = renderHook(() => useCart(), { wrapper: envoltorio })

    // Assert
    expect(result.current.cart).to.deep.equal([])
  })

  it('useCart fuera del provider avisa del error de uso', () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => {
      // React registra el error del render; aquí solo interesa la excepción
    })

    // Act
    const usar = () => renderHook(() => useCart())

    // Assert
    expect(usar).to.throw('useCart debe usarse dentro de CartProvider')
  })
})

describe('ordersService — contrato con /orders', () => {
  it('getAll pide la página con 20 por página y devuelve datos y meta', async () => {
    // Arrange
    servidor.responder('GET', '/orders', listado(paginado([pedido()], { totalPages: 3 })))

    // Act
    const resultado = await ordersService.getAll(2)

    // Assert
    expect(servidor.peticiones('GET', '/orders')[0].params).to.deep.equal({ page: 2, limit: 20 })
    expect(resultado.meta).to.include({ totalPages: 3 })
    expect(resultado.data[0].orderRef).to.equal('CP-0001')
  })

  it('getAll sin página pide la primera', async () => {
    // Arrange
    servidor.responder('GET', '/orders', listado(paginado([])))

    // Act
    await ordersService.getAll()

    // Assert
    expect(servidor.peticiones('GET', '/orders')[0].params).to.deep.equal({ page: 1, limit: 20 })
  })

  it('updateStatus manda el estado nuevo y devuelve el pedido actualizado', async () => {
    // Arrange
    servidor.responder('PUT', '/orders/order-1/status', ok(pedido({ status: 'DELIVERED' })))

    // Act
    const actualizado = await ordersService.updateStatus('order-1', 'DELIVERED')

    // Assert
    expect(actualizado.status).to.equal('DELIVERED')
    expect(servidor.peticiones('PUT', '/orders/order-1/status')[0].body).to.deep.equal({ status: 'DELIVERED' })
  })
})
