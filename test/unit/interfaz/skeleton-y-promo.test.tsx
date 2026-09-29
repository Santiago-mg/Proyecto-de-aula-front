import { expect } from 'chai'
import { describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SkeletonGrid } from '../../../src/components/ui/SkeletonCard'
import { PromoBar } from '../../../src/components/ui/PromoBar'

// Basado en: components/ui/SkeletonCard.tsx y components/ui/PromoBar.tsx

describe('SkeletonGrid — tarjetas de carga', () => {
  it('por defecto dibuja 6 tarjetas', () => {
    // Arrange
    const props = {}

    // Act
    const { container } = render(<SkeletonGrid {...props} />)

    // Assert
    expect(container.querySelectorAll('.cp-skeleton-card')).to.have.lengthOf(6)
  })

  it('dibuja las que se le pidan', () => {
    // Arrange
    const count = 3

    // Act
    const { container } = render(<SkeletonGrid count={count} />)

    // Assert
    expect(container.querySelectorAll('.cp-skeleton-card')).to.have.lengthOf(3)
  })
})

describe('PromoBar — barra de promociones', () => {
  it('repite los mensajes para el desplazamiento continuo y enlaza a certificados', () => {
    // Arrange
    const ruta = '/'

    // Act
    render(<MemoryRouter initialEntries={[ruta]}><PromoBar /></MemoryRouter>)

    // Assert
    expect(screen.queryAllByText(/ENVÍO GRATIS/)).to.have.lengthOf(2)
    expect(screen.getByRole('link', { name: 'Ver certificados →' }).getAttribute('href')).to.equal('/catalog?condition=CERTIFIED')
  })

  it('se puede cerrar', async () => {
    // Arrange
    render(<MemoryRouter><PromoBar /></MemoryRouter>)

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    // Assert
    expect(screen.queryByText(/ENVÍO GRATIS/)).to.be.null
  })
})
