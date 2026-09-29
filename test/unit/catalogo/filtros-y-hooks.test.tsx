import { expect } from 'chai'
import { describe, it, vi, afterEach } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { PhoneFilters } from '../../../src/components/phones/PhoneFilters'
import { useDebounce } from '../../../src/hooks/useDebounce'
import { useLocalStorage } from '../../../src/hooks/useLocalStorage'

// Basado en: components/phones/PhoneFilters.tsx, hooks/useDebounce.ts y hooks/useLocalStorage.ts

describe('PhoneFilters — borrar un filtro lo quita de la consulta', () => {
  const activos = { search: 's24', condition: 'USED' as const, category: 'samsung', brand: 'Samsung', verified: true, maxPrice: 900 }

  it('vaciar texto, selects y precio manda undefined y vuelve a la página 1', () => {
    // Arrange
    const onChange = vi.fn()
    render(<PhoneFilters query={activos} onChange={onChange} />)

    // Act
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Precio máximo (COP)'), { target: { value: '' } })
    fireEvent.click(screen.getByLabelText('Solo verificados ✓'))
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))

    // Assert
    expect(onChange.mock.calls.map(([cambio]) => cambio)).to.deep.equal([
      { search: undefined, page: 1 },
      { category: undefined, page: 1 },
      { brand: undefined, page: 1 },
      { maxPrice: undefined, page: 1 },
      { verified: undefined, page: 1 },
      { condition: undefined, page: 1 },
    ])
  })

  it('marca la condición activa', () => {
    // Arrange
    const query = { condition: 'USED' as const }

    // Act
    render(<PhoneFilters query={query} onChange={vi.fn()} />)

    // Assert
    expect(screen.getByRole('button', { name: 'Usados' }).className).to.include('active')
    expect(screen.getByRole('button', { name: 'Todos' }).className).to.not.include('active')
  })
})

describe('useDebounce — espera a que el usuario deje de escribir', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('solo entrega el último valor cuando pasa el retraso', () => {
    // Arrange
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 300), { initialProps: { valor: 'a' } })

    // Act
    rerender({ valor: 'ab' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    rerender({ valor: 'abc' })
    const antes = result.current
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Assert
    expect(antes).to.equal('a')
    expect(result.current).to.equal('abc')
  })

  it('por defecto espera 400 ms', () => {
    // Arrange
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor), { initialProps: { valor: 1 } })
    rerender({ valor: 2 })

    // Act
    act(() => {
      vi.advanceTimersByTime(399)
    })
    const antes = result.current
    act(() => {
      vi.advanceTimersByTime(1)
    })

    // Assert
    expect(antes).to.equal(1)
    expect(result.current).to.equal(2)
  })
})

describe('useLocalStorage — estado que sobrevive a recargar la página', () => {
  it('arranca con lo guardado o, si no hay nada, con el valor inicial', () => {
    // Arrange
    localStorage.setItem('tema', JSON.stringify('oscuro'))

    // Act
    const guardado = renderHook(() => useLocalStorage('tema', 'claro')).result.current[0]
    const inicial = renderHook(() => useLocalStorage('idioma', 'es')).result.current[0]

    // Assert
    expect(guardado).to.equal('oscuro')
    expect(inicial).to.equal('es')
  })

  it('un valor corrupto se ignora y se usa el inicial', () => {
    // Arrange
    localStorage.setItem('contador', '{roto')

    // Act
    const { result } = renderHook(() => useLocalStorage('contador', 0))

    // Assert
    expect(result.current[0]).to.equal(0)
  })

  it('guardar acepta un valor o una función, y borrar vuelve al inicial', () => {
    // Arrange
    const { result } = renderHook(() => useLocalStorage('contador', 0))

    // Act
    act(() => {
      result.current[1](5)
    })
    act(() => {
      result.current[1]((n) => n + 1)
    })
    const trasGuardar = [result.current[0], localStorage.getItem('contador')]
    act(() => {
      result.current[2]()
    })

    // Assert
    expect(trasGuardar).to.deep.equal([6, '6'])
    expect(result.current[0]).to.equal(0)
    expect(localStorage.getItem('contador')).to.be.null
  })
})
