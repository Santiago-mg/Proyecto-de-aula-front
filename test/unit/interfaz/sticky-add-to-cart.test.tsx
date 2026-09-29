import { expect } from 'chai'
import { describe, it, vi, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StickyAddToCart } from '../../../src/components/ui/StickyAddToCart'
import { celularCompleto } from '../../helpers/fixtures'

// Basado en: components/ui/StickyAddToCart.tsx — barra de compra que aparece al bajar

function bajarHasta(px: number) {
  Object.defineProperty(globalThis, 'scrollY', { value: px, configurable: true })
  act(() => {
    globalThis.dispatchEvent(new Event('scroll'))
  })
}

afterEach(() => {
  Object.defineProperty(globalThis, 'scrollY', { value: 0, configurable: true })
})

describe('StickyAddToCart — barra fija de compra', () => {
  it('no aparece mientras no se baje más de 500px', () => {
    // Arrange
    render(<StickyAddToCart phone={celularCompleto()} selectedColor={null} qty={1} onAdd={vi.fn()} />)

    // Act
    bajarHasta(400)

    // Assert
    expect(screen.queryByRole('button', { name: /agregar al carrito/i })).to.be.null
  })

  it('al bajar muestra el equipo, el color elegido y el precio por la cantidad', () => {
    // Arrange
    const phone = celularCompleto({ heroImage: 'https://cdn.celularpro.co/i15.png' })
    render(<StickyAddToCart phone={phone} selectedColor={phone.colors[1]} qty={2} onAdd={vi.fn()} />)

    // Act
    bajarHasta(800)

    // Assert
    expect(screen.queryByText('Azul')).to.exist
    expect(screen.queryByText('$6.000.000 COP')).to.exist
    expect(screen.getByAltText('iPhone 15').getAttribute('src')).to.equal('https://cdn.celularpro.co/i15.png')
  })

  it('el botón agrega al carrito', async () => {
    // Arrange
    const onAdd = vi.fn()
    render(<StickyAddToCart phone={celularCompleto()} selectedColor={null} qty={1} onAdd={onAdd} />)
    bajarHasta(800)

    // Act
    await userEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }))

    // Assert
    expect(onAdd.mock.calls).to.have.lengthOf(1)
  })

  it('un equipo agotado nunca muestra la barra', () => {
    // Arrange
    render(<StickyAddToCart phone={celularCompleto({ stock: 0 })} selectedColor={null} qty={1} onAdd={vi.fn()} />)

    // Act
    bajarHasta(800)

    // Assert
    expect(screen.queryByRole('button', { name: /agregar al carrito/i })).to.be.null
  })
})
