import { expect } from 'chai'
import { describe, it, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ContainerScroll } from '../../../src/components/ui/ContainerScrollAnimation'

// Basado en: components/ui/ContainerScrollAnimation.tsx — tarjeta 3D con scroll

const anchoOriginal = globalThis.innerWidth

function anchoDeVentana(px: number) {
  Object.defineProperty(globalThis, 'innerWidth', { value: px, configurable: true })
}

afterEach(() => {
  anchoDeVentana(anchoOriginal)
})

function contenedor() {
  return screen.getByText('Contenido').closest('.cp-scroll-card')?.parentElement?.parentElement as HTMLElement
}

describe('ContainerScroll — tarjeta con animación de scroll', () => {
  it('en pantallas anchas usa las medidas de escritorio', () => {
    // Arrange
    anchoDeVentana(1280)

    // Act
    render(<ContainerScroll titleComponent="Destacados"><p>Contenido</p></ContainerScroll>)

    // Assert
    expect(screen.queryByText('Destacados')).to.exist
    expect(contenedor().style.height).to.equal('80rem')
  })

  it('al pasar a móvil (≤ 768px) se compacta', () => {
    // Arrange
    anchoDeVentana(1280)
    render(<ContainerScroll titleComponent="Destacados"><p>Contenido</p></ContainerScroll>)

    // Act
    anchoDeVentana(500)
    act(() => {
      globalThis.dispatchEvent(new Event('resize'))
    })

    // Assert
    expect(contenedor().style.height).to.equal('56rem')
    expect(contenedor().style.padding).to.equal('8px')
  })
})
