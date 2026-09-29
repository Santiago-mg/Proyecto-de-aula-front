import { expect } from 'chai'
import { describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroGeometric } from '../../../src/components/ui/shape-landing-hero'

// Basado en: components/ui/shape-landing-hero.tsx — hero con elipses animadas

describe('HeroGeometric — contenido del hero', () => {
  it('sin contenido propio muestra el badge y los títulos por defecto', () => {
    // Arrange
    const props = {}

    // Act
    render(<HeroGeometric {...props} />)

    // Assert
    expect(screen.queryByText('CelularPro')).to.exist
    expect(screen.queryByText('Compra un celular')).to.exist
    expect(screen.queryByText('en el que confiar.')).to.exist
    expect(document.querySelector('p')).to.be.null
  })

  it('usa los textos que recibe, incluida la descripción', () => {
    // Arrange
    const props = { badge: 'Nuevo', title1: 'Hola', title2: 'mundo', description: 'Garantía real' }

    // Act
    render(<HeroGeometric {...props} />)

    // Assert
    expect(screen.queryByText('Nuevo')).to.exist
    expect(screen.queryByRole('heading', { name: /hola\s*mundo/i })).to.exist
    expect(screen.queryByText('Garantía real')).to.exist
  })

  it('si recibe children, los muestra en lugar del contenido por defecto', () => {
    // Arrange
    const contenido = <h2>Contenido de la tienda</h2>

    // Act
    render(<HeroGeometric>{contenido}</HeroGeometric>)

    // Assert
    expect(screen.queryByRole('heading', { name: 'Contenido de la tienda' })).to.exist
    expect(screen.queryByText('Compra un celular')).to.be.null
  })
})
