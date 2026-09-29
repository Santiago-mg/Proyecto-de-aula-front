import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { abrirApp, rutaActual } from '../../helpers/app'
import { servidor } from '../../helpers/servidor'
import { administrador, itemCarrito, sesionDeAdmin, sesionIniciada } from '../../helpers/fixtures'

// Basado en: components/layout/Nav.tsx y components/admin/AdminLayout.tsx
// Se monta la app en /unauthorized (usa el layout público y no llama al backend).

function menuMovil() {
  return document.querySelector<HTMLElement>('.cp-mobile-menu')
}

describe('Nav — barra principal', () => {
  it('sin sesión ofrece ingresar y registrarse, y marca el enlace de la ruta actual', async () => {
    // Arrange
    servidor.colgar('GET', '/phones')

    // Act
    abrirApp('/catalog?condition=NEW')

    // Assert
    expect(await screen.findByRole('link', { name: 'Registrarse' })).to.exist
    const enlaces = document.querySelector('.cp-nav-links') as HTMLElement
    expect(within(enlaces).getByRole('link', { name: 'Nuevos' }).className).to.include('active')
    expect(within(enlaces).getByRole('link', { name: 'Tienda' }).className).to.not.include('active')
  })

  it('un admin ve el acceso al panel', async () => {
    // Arrange
    sesionDeAdmin(administrador({ name: 'Paula Rendón' }))

    // Act
    abrirApp('/unauthorized')

    // Assert
    expect((await screen.findByRole('link', { name: 'Admin' })).getAttribute('href')).to.equal('/admin/phones')
    expect(screen.queryByRole('link', { name: 'Paula' })).to.exist
  })

  it('el contador del carrito suma las unidades guardadas', async () => {
    // Arrange
    localStorage.setItem('cp_cart', JSON.stringify([itemCarrito({ qty: 2 }), itemCarrito({ key: 'x', qty: 1 })]))

    // Act
    abrirApp('/unauthorized')

    // Assert
    expect(within(await screen.findByRole('button', { name: 'Carrito' })).queryByText('3')).to.exist
  })

  it('el menú móvil se abre, y al elegir un enlace se cierra', async () => {
    // Arrange
    servidor.colgar('GET', '/phones')
    const user = abrirApp('/unauthorized')
    await user.click(await screen.findByRole('button', { name: 'Menú' }))
    const abierto = menuMovil() !== null

    // Act
    await user.click(within(menuMovil() as HTMLElement).getByRole('link', { name: 'Samsung' }))

    // Assert
    expect(abierto).to.be.true
    expect(menuMovil()).to.be.null
    expect(rutaActual()).to.equal('/catalog?category=samsung')
  })

  it('sin sesión el menú móvil lleva a ingresar y registrarse', async () => {
    // Arrange
    const user = abrirApp('/unauthorized')
    await user.click(await screen.findByRole('button', { name: 'Menú' }))

    // Act
    await user.click(within(menuMovil() as HTMLElement).getByRole('link', { name: 'Registrarse' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Crear cuenta' })).to.exist
  })

  it('con sesión el menú móvil ofrece Mi cuenta y cerrar sesión', async () => {
    // Arrange
    sesionIniciada()
    const user = abrirApp('/unauthorized')
    await user.click(await screen.findByRole('button', { name: 'Menú' }))
    const menu = menuMovil() as HTMLElement
    const tieneMiCuenta = within(menu).queryByRole('link', { name: 'Mi cuenta' }) !== null

    // Act
    await user.click(within(menu).getByRole('button', { name: 'Cerrar sesión' }))

    // Assert
    expect(tieneMiCuenta).to.be.true
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(localStorage.getItem('cp_token')).to.be.null
  })

  it('el botón del menú alterna entre abrir y cerrar', async () => {
    // Arrange
    const user = abrirApp('/unauthorized')
    const boton = await screen.findByRole('button', { name: 'Menú' })

    // Act
    await user.click(boton)
    await user.click(boton)

    // Assert
    expect(menuMovil()).to.be.null
  })

  it('en el menú móvil, Mi cuenta lleva al panel del usuario', async () => {
    // Arrange
    sesionIniciada()
    servidor.colgar('GET', '/orders/my')
    const user = abrirApp('/unauthorized')
    await user.click(await screen.findByRole('button', { name: 'Menú' }))

    // Act
    await user.click(within(menuMovil() as HTMLElement).getByRole('link', { name: 'Mi cuenta' }))

    // Assert
    expect(await screen.findByText('Cargando pedidos...')).to.exist
    expect(rutaActual()).to.equal('/dashboard')
  })

  it('en el menú móvil, Ingresar lleva al login', async () => {
    // Arrange
    const user = abrirApp('/unauthorized')
    await user.click(await screen.findByRole('button', { name: 'Menú' }))

    // Act
    await user.click(within(menuMovil() as HTMLElement).getByRole('link', { name: 'Ingresar' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
  })
})

describe('AdminLayout — menú lateral del panel', () => {
  function barraSuperior() {
    return document.querySelector('.cp-admin-topbar') as HTMLElement
  }
  function lateral() {
    return document.querySelector('.cp-admin-sidebar') as HTMLElement
  }

  it('la barra superior muestra la sección actual y el nombre del admin', async () => {
    // Arrange
    sesionDeAdmin(administrador({ name: 'Paula Admin' }))
    servidor.colgar('GET', '/admin/stats')

    // Act
    abrirApp('/admin/stats')

    // Assert
    expect(await within(barraSuperior()).findByText('Estadísticas')).to.exist
    expect(within(lateral()).queryByText('Paula Admin')).to.exist
    expect(within(lateral()).getByRole('link', { name: /estadísticas/i }).className).to.include('active')
    expect(within(lateral()).getByRole('link', { name: /dashboard/i }).className).to.not.include('active')
  })

  it('el menú se abre desde la barra superior y se cierra con el fondo', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.colgar('GET', '/admin/stats')
    const user = abrirApp('/admin')
    await user.click(barraSuperior().querySelector('button') as HTMLElement)
    const abierto = lateral().className.includes('open')

    // Act
    await user.click(document.querySelector('.cp-overlay') as HTMLElement)

    // Assert
    expect(abierto).to.be.true
    expect(lateral().className).to.not.include('open')
    expect(within(barraSuperior()).queryByText('Dashboard')).to.exist
  })

  it('elegir una sección o la X también cierra el menú', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.colgar('GET', '/admin/stats')
    servidor.colgar('GET', '/orders')
    const user = abrirApp('/admin')
    await user.click(barraSuperior().querySelector('button') as HTMLElement)
    await user.click(within(lateral()).getByRole('link', { name: /órdenes/i }))
    await user.click(barraSuperior().querySelector('button') as HTMLElement)

    // Act
    await user.click(lateral().querySelector('.cp-admin-sidebar-header button') as HTMLElement)

    // Assert
    expect(lateral().className).to.not.include('open')
    expect(rutaActual()).to.equal('/admin/orders')
  })

  it('Salir cierra la sesión y vuelve al login', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.colgar('GET', '/admin/stats')
    const user = abrirApp('/admin')

    // Act
    await user.click(within(lateral()).getByRole('button', { name: /salir/i }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(localStorage.getItem('cp_user')).to.be.null
  })
})
