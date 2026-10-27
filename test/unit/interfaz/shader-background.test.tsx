import { expect } from 'chai'
import { describe, it, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ShaderBackground } from '../../../src/components/ui/ShaderBackground'

// Basado en: components/ui/ShaderBackground.tsx — fondo WebGL de la portada
//
// jsdom no tiene WebGL, así que cada prueba entrega un contexto falso que
// responde lo justo para forzar el camino: compila o no, enlaza o no, etc.

interface OpcionesGl {
  creaShader?: boolean
  compila?: boolean
  creaPrograma?: boolean
  enlaza?: boolean
  creaBuffer?: boolean
}

function contextoFalso(opciones: OpcionesGl = {}) {
  const { creaShader = true, compila = true, creaPrograma = true, enlaza = true, creaBuffer = true } = opciones
  return {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    COLOR_BUFFER_BIT: 7,
    FLOAT: 8,
    TRIANGLE_STRIP: 9,
    createShader: vi.fn(() => (creaShader ? {} : null)),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => compila),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => (creaPrograma ? {} : null)),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => enlaza),
    createBuffer: vi.fn(() => (creaBuffer ? {} : null)),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    useProgram: vi.fn(),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    vertexAttribPointer: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    drawArrays: vi.fn(),
  }
}

let cuadros: FrameRequestCallback[] = []

function usarContexto(gl: ReturnType<typeof contextoFalso> | null) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl as unknown as RenderingContext)
}

beforeEach(() => {
  cuadros = []
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => cuadros.push(cb))
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {
    // se verifica con qué id se llamó
  })
})

describe('ShaderBackground — fondo animado con WebGL', () => {
  it('sin WebGL deja el lienzo decorativo y no intenta dibujar', () => {
    // Arrange
    usarContexto(null)

    // Act
    const { container } = render(<ShaderBackground />)

    // Assert
    const lienzo = container.querySelector('canvas')
    expect(lienzo?.getAttribute('aria-hidden')).to.equal('true')
    expect(cuadros).to.be.empty
  })

  it('con WebGL compila los shaders, ajusta el tamaño y dibuja en cada cuadro', () => {
    // Arrange
    const gl = contextoFalso()
    usarContexto(gl)
    render(<ShaderBackground />)

    // Act
    cuadros[0](0)
    globalThis.dispatchEvent(new Event('resize'))

    // Assert
    expect(gl.compileShader.mock.calls).to.have.lengthOf(2)
    expect(gl.drawArrays.mock.calls).to.deep.equal([[gl.TRIANGLE_STRIP, 0, 4]])
    expect(gl.viewport.mock.calls).to.have.lengthOf(2)
    expect(cuadros).to.have.lengthOf(2)
  })

  it('si un shader no compila, lo descarta y no arranca la animación', () => {
    // Arrange
    const gl = contextoFalso({ compila: false })
    usarContexto(gl)

    // Act
    render(<ShaderBackground />)

    // Assert
    expect(gl.deleteShader.mock.calls).to.have.lengthOf(2)
    expect(gl.createProgram.mock.calls).to.be.empty
    expect(cuadros).to.be.empty
  })

  it.each([
    ['el navegador no crea shaders', { creaShader: false }],
    ['no se puede crear el programa', { creaPrograma: false }],
    ['el programa no enlaza', { enlaza: false }],
    ['no hay buffer de vértices', { creaBuffer: false }],
  ])('si %s, no dibuja nada', (_caso, opciones: OpcionesGl) => {
    // Arrange
    const gl = contextoFalso(opciones)
    usarContexto(gl)

    // Act
    render(<ShaderBackground />)

    // Assert
    expect(gl.drawArrays.mock.calls).to.be.empty
    expect(cuadros).to.be.empty
  })

  it('al desmontar cancela la animación y deja de escuchar el resize', () => {
    // Arrange
    const gl = contextoFalso()
    usarContexto(gl)
    const { unmount } = render(<ShaderBackground />)

    // Act
    unmount()
    globalThis.dispatchEvent(new Event('resize'))

    // Assert
    expect(vi.mocked(cancelAnimationFrame).mock.calls).to.deep.equal([[1]])
    expect(gl.viewport.mock.calls).to.have.lengthOf(1)
  })

  it('H12: con "reducir movimiento" pinta un cuadro fijo y no anima', () => {
    // Arrange
    const gl = contextoFalso()
    usarContexto(gl)
    const original = globalThis.matchMedia
    globalThis.matchMedia = ((consulta: string) => ({
      matches: consulta === '(prefers-reduced-motion: reduce)',
      media: consulta,
    })) as unknown as typeof globalThis.matchMedia
    render(<ShaderBackground />)

    // Act
    cuadros[0](0)

    // Assert: se dibujó una vez y no se pidió un segundo cuadro
    expect(gl.drawArrays.mock.calls).to.have.lengthOf(1)
    expect(cuadros).to.have.lengthOf(1)
    globalThis.matchMedia = original
  })
})
