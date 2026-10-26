import { expect } from 'chai'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, vi } from 'vitest'
import {
  PREFERENCIAS_INICIALES,
  PreferencesProvider,
  aplicarPreferencias,
  leerPreferencias,
  resolverTema,
  usePreferencias,
} from '../../../src/context/PreferencesContext'
import { abrirApp } from '../../helpers/app'
import { servidor } from '../../helpers/servidor'

// Panel "Pantalla y accesibilidad": tema, tamaño del texto y movimiento.
// Responde a la heurística 7 (flexibilidad) y a WCAG 1.4.4, 1.4.12 y 2.3.3.

afterEach(() => {
  vi.restoreAllMocks()
  for (const atributo of ['tema', 'tamano', 'movimiento']) delete document.documentElement.dataset[atributo]
})

const sistema = (claro = false, contraste = false) => ({ claro, contraste, reducido: false })

describe('leerPreferencias', () => {
  it('sin nada guardado devuelve los valores iniciales', () => {
    // Arrange / Act
    const prefs = leerPreferencias()

    // Assert
    expect(prefs).to.deep.equal(PREFERENCIAS_INICIALES)
    expect(prefs).to.deep.equal({ tema: 'sistema', tamano: 100, movimiento: 'sistema' })
  })

  it('respeta lo guardado cuando es válido', () => {
    // Arrange
    localStorage.setItem('cp_prefs', JSON.stringify({ tema: 'claro', tamano: 130, movimiento: 'reducido' }))

    // Act
    const prefs = leerPreferencias()

    // Assert
    expect(prefs).to.deep.equal({ tema: 'claro', tamano: 130, movimiento: 'reducido' })
  })

  it('descarta cada valor que no sea una opción real, sin tumbar los demás', () => {
    // Arrange
    localStorage.setItem('cp_prefs', JSON.stringify({ tema: 'neón', tamano: 999, movimiento: 'reducido' }))

    // Act
    const prefs = leerPreferencias()

    // Assert
    expect(prefs).to.deep.equal({ tema: 'sistema', tamano: 100, movimiento: 'reducido' })
  })

  it('un JSON dañado vuelve a los valores iniciales', () => {
    // Arrange
    localStorage.setItem('cp_prefs', '{no es json')

    // Act
    const prefs = leerPreferencias()

    // Assert
    expect(prefs).to.deep.equal(PREFERENCIAS_INICIALES)
  })
})

describe('resolverTema y aplicarPreferencias', () => {
  it.each([
    ['oscuro', sistema(true), 'oscuro'],
    ['claro', sistema(false), 'claro'],
    ['contraste', sistema(), 'contraste'],
    ['sistema', sistema(), 'oscuro'],
    ['sistema', sistema(true), 'claro'],
    ['sistema', sistema(true, true), 'contraste'],
  ] as const)('tema "%s" con el dispositivo %j → %s', (tema, dispositivo, esperado) => {
    // Arrange / Act
    const aplicado = resolverTema(tema, dispositivo)

    // Assert
    expect(aplicado).to.equal(esperado)
  })

  it('escribe tema, tamaño y movimiento en <html> para que el CSS reaccione', () => {
    // Arrange
    const prefs = { tema: 'claro', tamano: 115, movimiento: 'sistema' } as const

    // Act
    aplicarPreferencias(prefs, 'claro', true)

    // Assert
    const { dataset } = document.documentElement
    expect(dataset.tema).to.equal('claro')
    expect(dataset.tamano).to.equal('115')
    expect(dataset.movimiento).to.equal('reducido')
  })
})

describe('PreferencesProvider', () => {
  function Sonda() {
    const { preferencias, temaAplicado, cambiar, restablecer, movimientoReducido } = usePreferencias()
    return (
      <>
        <output data-testid="estado">{`${preferencias.tema}|${temaAplicado}|${preferencias.tamano}|${movimientoReducido}`}</output>
        <button type="button" onClick={() => cambiar({ tema: 'contraste', tamano: 130 })}>cambiar</button>
        <button type="button" onClick={() => cambiar({ movimiento: 'reducido' })}>quieto</button>
        <button type="button" onClick={restablecer}>restablecer</button>
      </>
    )
  }

  it('aplica la preferencia guardada apenas arranca', () => {
    // Arrange
    localStorage.setItem('cp_prefs', JSON.stringify({ tema: 'claro', tamano: 115, movimiento: 'sistema' }))

    // Act
    render(<PreferencesProvider><Sonda /></PreferencesProvider>)

    // Assert
    expect(document.documentElement.dataset.tema).to.equal('claro')
    expect(document.documentElement.dataset.tamano).to.equal('115')
  })

  it('cada cambio se aplica al instante y queda guardado en el navegador', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<PreferencesProvider><Sonda /></PreferencesProvider>)

    // Act
    await user.click(screen.getByRole('button', { name: 'cambiar' }))

    // Assert
    expect(document.documentElement.dataset.tema).to.equal('contraste')
    expect(document.documentElement.dataset.tamano).to.equal('130')
    expect(JSON.parse(localStorage.getItem('cp_prefs') as string)).to.deep.equal({ tema: 'contraste', tamano: 130, movimiento: 'sistema' })
  })

  it('"reducido" apaga el movimiento y "restablecer" lo devuelve todo a lo inicial', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<PreferencesProvider><Sonda /></PreferencesProvider>)

    // Act
    await user.click(screen.getByRole('button', { name: 'quieto' }))
    const quieto = document.documentElement.dataset.movimiento
    await user.click(screen.getByRole('button', { name: 'restablecer' }))

    // Assert
    expect(quieto).to.equal('reducido')
    expect(document.documentElement.dataset.movimiento).to.equal('completo')
    expect(screen.getByTestId('estado').textContent).to.equal('sistema|oscuro|100|false')
  })

  it('en "automático" sigue al dispositivo: modo claro y movimiento reducido', () => {
    // Arrange
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('light') || q.includes('reduced-motion'),
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))

    // Act
    render(<PreferencesProvider><Sonda /></PreferencesProvider>)

    // Assert
    expect(screen.getByTestId('estado').textContent).to.equal('sistema|claro|100|true')
    vi.unstubAllGlobals()
  })

  it('sin proveedor devuelve valores neutros en vez de romper', () => {
    // Arrange / Act
    render(<Sonda />)

    // Assert
    expect(screen.getByTestId('estado').textContent).to.equal('sistema|oscuro|100|false')
  })
})

describe('Panel "Pantalla y accesibilidad" dentro de la tienda', () => {
  async function abrirPanel() {
    servidor.colgar('GET', '/phones')
    const user = abrirApp('/unauthorized')
    await user.click((await screen.findAllByRole('button', { name: 'Pantalla y accesibilidad' }))[0])
    return user
  }

  it('se abre desde la barra y ofrece tema, tamaño y movimiento', async () => {
    // Arrange / Act
    await abrirPanel()

    // Assert
    const panel = screen.getByRole('dialog', { name: 'Pantalla y accesibilidad' })
    expect(panel).to.exist
    for (const nombre of ['Automático', 'Oscuro', 'Claro', 'Alto contraste', 'Normal', 'Grande', 'Muy grande', 'Reducir animaciones']) {
      expect(screen.getByLabelText(new RegExp(nombre))).to.exist
    }
  })

  it('elegir "Muy grande" cambia el tamaño de toda la página y se conserva', async () => {
    // Arrange
    const user = await abrirPanel()

    // Act
    await user.click(screen.getByLabelText('Muy grande'))

    // Assert
    expect(document.documentElement.dataset.tamano).to.equal('130')
    expect(JSON.parse(localStorage.getItem('cp_prefs') as string).tamano).to.equal(130)
  })

  it('elegir "Alto contraste" cambia el tema', async () => {
    // Arrange
    const user = await abrirPanel()

    // Act
    await user.click(screen.getByLabelText(/Alto contraste/))

    // Assert
    expect(document.documentElement.dataset.tema).to.equal('contraste')
  })

  it('Escape lo cierra y el foco vuelve al botón de la barra', async () => {
    // Arrange
    const user = await abrirPanel()

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(screen.queryByRole('dialog', { name: 'Pantalla y accesibilidad' })).to.be.null
    expect(document.activeElement).to.equal(screen.getAllByRole('button', { name: 'Pantalla y accesibilidad' })[0])
  })

  it('"Restablecer" deja todo como estaba al principio', async () => {
    // Arrange
    const user = await abrirPanel()
    await user.click(screen.getByLabelText('Grande'))

    // Act
    await user.click(screen.getByRole('button', { name: 'Restablecer' }))

    // Assert
    expect(document.documentElement.dataset.tamano).to.equal('100')
  })
})
