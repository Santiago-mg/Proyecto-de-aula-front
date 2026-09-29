import { expect } from 'chai'
import { describe, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Checkout } from '../../../src/pages/Checkout'
import { CartProvider } from '../../../src/context/CartContext'
import { servidor } from '../../helpers/servidor'
import { itemCarrito } from '../../helpers/fixtures'

// Basado en: pages/Checkout.tsx — formulario de entrega cuando no hay datos del usuario

vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

describe('Checkout — sin datos del usuario para precargar', () => {
  it('nombre y email arrancan vacíos y se exigen antes de enviar', async () => {
    // Arrange
    localStorage.setItem('cp_cart', JSON.stringify([itemCarrito()]))
    render(
      <MemoryRouter>
        <CartProvider>
          <Checkout />
        </CartProvider>
      </MemoryRouter>,
    )

    // Act
    await userEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    // Assert
    expect(await screen.findByText('Nombre requerido')).to.exist
    expect(screen.queryByText('Email inválido')).to.exist
    expect(screen.getByLabelText<HTMLInputElement>('Email').value).to.equal('')
    expect(servidor.peticiones('POST', '/orders')).to.be.empty
  })
})
