import { expect } from 'chai'
import { describe, it, vi, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage'
import { ToastProvider, useToast } from '../../../src/context/ToastContext'
import { comoError } from '../../../src/utils/errores'

// Basado en: components/ui/ErrorMessage.tsx, context/ToastContext.tsx y utils/errores.ts
// Equivalente front de tests/unit/errores/error.middleware.test.ts: qué texto ve
// el usuario según cómo llegó el error.

function errorHttp(status: number, data: unknown) {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, { status, data } as AxiosResponse)
}

describe('ErrorMessage — texto que ve el usuario', () => {
  it('error del backend → muestra su campo "error"', () => {
    // Arrange
    const error = errorHttp(409, { error: 'El email ya está registrado' })

    // Act
    render(<ErrorMessage error={error} />)

    // Assert
    expect(screen.queryByText('El email ya está registrado')).to.exist
  })

  it('error HTTP sin mensaje → uno genérico, sin detalles técnicos', () => {
    // Arrange
    const error = errorHttp(500, {})

    // Act
    render(<ErrorMessage error={error} />)

    // Assert
    expect(screen.queryByText('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.')).to.exist
    expect(screen.queryByText('Request failed')).to.be.null
  })

  it('error común de JavaScript → su mensaje', () => {
    // Arrange
    const error = new Error('Algo salió mal')

    // Act
    render(<ErrorMessage error={error} />)

    // Assert
    expect(screen.queryByText('Algo salió mal')).to.exist
  })

  it('sin error → párrafo vacío', () => {
    // Arrange
    const error = null

    // Act
    const { container } = render(<ErrorMessage error={error} />)

    // Assert
    expect(container.textContent).to.equal('')
  })
})

describe('comoError — normaliza lo que rechaza una promesa', () => {
  it('un Error se devuelve tal cual', () => {
    // Arrange
    const original = new Error('x')

    // Act
    const resultado = comoError(original)

    // Assert
    expect(resultado).to.equal(original)
  })

  it('cualquier otro valor se envuelve en un Error con su texto', () => {
    // Arrange
    const valor = 'se cayó la red'

    // Act
    const resultado = comoError(valor)

    // Assert
    expect(resultado).to.be.instanceOf(Error)
    expect(resultado.message).to.equal('se cayó la red')
  })
})

describe('ToastContext — avisos temporales', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function Disparador() {
    const { showToast } = useToast()
    return <button onClick={() => showToast('Guardado')}>Avisar</button>
  }

  it('el aviso aparece y se va solo a los 2,8 segundos', async () => {
    // Arrange
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<ToastProvider><Disparador /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Avisar' }))
    const visible = screen.queryByText('Guardado') !== null

    // Act
    act(() => {
      vi.advanceTimersByTime(2800)
    })

    // Assert
    expect(visible).to.be.true
    expect(screen.queryByText('Guardado')).to.be.null
  })

  it('useToast fuera del provider avisa del error de uso', () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => {
      // React registra el error del render; aquí solo interesa la excepción
    })

    // Act
    const renderizar = () => render(<Disparador />)

    // Assert
    expect(renderizar).to.throw('useToast debe usarse dentro de ToastProvider')
  })
})
