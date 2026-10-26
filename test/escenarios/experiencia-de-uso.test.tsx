import { expect } from 'chai'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, it } from 'vitest'
import { abrirApp, rutaActual } from '../helpers/app'
import { itemCarrito } from '../helpers/fixtures'
import { servidor } from '../helpers/servidor'
import { marcarSesionVencida } from '../../src/utils/sesion'

afterEach(() => {
  // La sesión vencida vive en sessionStorage, que setup.ts no limpia.
  sessionStorage.clear()
})

// Recorridos completos que cubren las mejoras de experiencia de uso:
// volver a donde se estaba, deshacer, ayuda, atajos y títulos de pestaña.


describe('Entrar y volver a donde se estaba', () => {
  it('quien llega a /checkout sin sesión ve por qué lo mandamos a ingresar', async () => {
    // Arrange / Act
    abrirApp('/checkout')

    // Assert
    expect(await screen.findByText('Ingresa para finalizar tu compra. Tu carrito se conserva.')).to.exist
    expect(rutaActual()).to.equal('/login')
  })

  it('si la sesión venció lo dice y no se repite al volver a abrir el login', async () => {
    // Arrange
    marcarSesionVencida('/dashboard')

    // Act
    abrirApp('/login')

    // Assert
    expect(await screen.findByText(/Tu sesión venció/)).to.exist
    expect(sessionStorage.getItem('cp_sesion_vencida')).to.be.null
  })
})

describe('Carrito — deshacer en vez de preguntar', () => {
  async function abrirCarrito() {
    localStorage.setItem('cp_cart', JSON.stringify([itemCarrito()]))
    const user = abrirApp('/unauthorized')
    await user.click(await screen.findByRole('button', { name: 'Carrito' }))
    return { user, carrito: await screen.findByRole('dialog', { name: 'Carrito' }) }
  }

  it('quitar un equipo avisa qué pasó y "Deshacer" lo devuelve', async () => {
    // Arrange
    const { user, carrito } = await abrirCarrito()

    // Act
    await user.click(within(carrito).getByRole('button', { name: 'Eliminar' }))
    const aviso = carrito.querySelector('.cp-undo')?.textContent ?? ''
    await user.click(within(carrito).getByRole('button', { name: /Deshacer/ }))

    // Assert
    expect(aviso).to.contain('Quitaste iPhone 15 del carrito.')
    expect(JSON.parse(localStorage.getItem('cp_cart') as string)).to.have.lengthOf(1)
  })
})

describe('Centro de ayuda', () => {
  it('el buscador filtra las preguntas y avisa cuando ninguna coincide', async () => {
    // Arrange
    const user = abrirApp('/ayuda')
    const buscador = await screen.findByRole('searchbox')

    // Act
    await user.type(buscador, 'garantía')
    const conResultados = document.querySelector('.cp-help-count')?.textContent ?? ''
    await user.clear(buscador)
    await user.type(buscador, 'zzzzqq')

    // Assert
    expect(conResultados).to.match(/coincid/)
    expect(document.querySelector('.cp-help-count')?.textContent).to.equal('Ninguna pregunta coincide.')
  })

  it('cada pantalla pone su título a la pestaña', async () => {
    // Arrange / Act
    abrirApp('/ayuda')

    // Assert
    await waitFor(() => expect(document.title).to.equal('Centro de ayuda · CelularPro'))
  })

  it('una ruta que no existe lleva a una página con título propio y una salida', async () => {
    // Arrange / Act
    abrirApp('/ruta-inexistente')

    // Assert
    await waitFor(() => expect(document.title).to.equal('Página no encontrada · CelularPro'))
    expect(screen.getAllByRole('link').length).to.be.greaterThan(0)
  })
})

describe('Atajos de teclado', () => {
  it('"c" abre el carrito, Escape lo cierra y "?" lleva a la lista de atajos', async () => {
    // Arrange
    servidor.colgar('GET', '/phones')
    const user = abrirApp('/unauthorized')
    await screen.findByRole('button', { name: 'Carrito' })

    // Act
    await user.keyboard('c')
    const abierto = await screen.findByRole('dialog', { name: 'Carrito' })
    const modal = abierto.getAttribute('aria-modal')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Carrito', hidden: true }).getAttribute('aria-modal')).to.be.null)
    await user.keyboard('?')

    // Assert
    expect(modal).to.equal('true')
    await waitFor(() => expect(rutaActual()).to.equal('/ayuda'))
  })

  it('no se activan mientras la persona escribe en un campo', async () => {
    // Arrange
    const user = abrirApp('/ayuda')
    const buscador = await screen.findByRole('searchbox')

    // Act
    await user.type(buscador, 'c?')

    // Assert
    expect((buscador as HTMLInputElement).value).to.equal('c?')
    expect(rutaActual()).to.equal('/ayuda')
  })
})
