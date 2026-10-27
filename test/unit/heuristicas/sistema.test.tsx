import { expect } from 'chai'
import { describe, it } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { abrirApp, rutaActual } from '../../helpers/app'
import { listado, ok, servidor, sinConexion } from '../../helpers/servidor'
import { filaUsuario, paginado, pedido, sesionDeAdmin, sesionIniciada } from '../../helpers/fixtures'

// H1.1 — todas las pestañas decían lo mismo.
// H1.3 / H6.5 — Mi cuenta no permitía cerrar sesión ni decía cuánto dura la sesión.
// H6.1 — no había atajos de teclado.
// H11.3 — los cortes de red no se explicaban ni se podían reintentar.
// H4.3 — un mismo ícono con significados distintos.

describe('H1.1 — cada pantalla nombra su pestaña', () => {
  it.each([
    ['/login', 'Ingresar · CelularPro'],
    ['/register', 'Crear cuenta · CelularPro'],
    ['/unauthorized', 'Acceso no autorizado · CelularPro'],
    ['/404', 'Página no encontrada · CelularPro'],
  ])('%s → "%s"', async (ruta, titulo) => {
    abrirApp(ruta)
    await waitFor(() => expect(document.title).to.equal(titulo))
  })

  it('con sesión: Mi cuenta y Mi perfil', async () => {
    sesionIniciada()
    servidor.colgar('GET', '/orders/my')
    abrirApp('/dashboard')
    await waitFor(() => expect(document.title).to.equal('Mi cuenta · CelularPro'))
  })

  it('en el panel, la pestaña dice la sección', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', listado(paginado([filaUsuario()])))
    abrirApp('/admin/users')
    await waitFor(() => expect(document.title).to.equal('Usuarios — Administración · CelularPro'))
  })
})

describe('H1.3 / H6.5 — Mi cuenta', () => {
  it('permite cerrar sesión desde la misma pantalla', async () => {
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([]))
    const user = abrirApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión en este equipo' }))

    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(localStorage.getItem('cp_token')).to.be.null
  })

  it('dice cuánto dura la sesión (acelerador visible para quien vuelve)', async () => {
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([]))
    abrirApp('/dashboard')

    expect(await screen.findByText(/hasta 7 días en este navegador/)).to.exist
  })

  it('H11: sin conexión explica, enlaza a la guía y "Reintentar" vuelve a pedir', async () => {
    sesionIniciada()
    servidor.responder('GET', '/orders/my', sinConexion())
    const user = abrirApp('/dashboard')

    expect((await screen.findByRole('alert')).textContent).to.equal('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.')
    expect(screen.getByRole('link', { name: '¿Qué hago si no hay conexión?' }).getAttribute('href')).to.equal('/ayuda#guia-sin-conexion')
    servidor.responder('GET', '/orders/my', ok([pedido()]))
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() => expect(screen.queryByRole('alert')).to.be.null)
    expect(servidor.peticiones('GET', '/orders/my')).to.have.length(2)
  })

  it('H4.3: el total del pedido usa un recibo, no el escudo de "verificado"', async () => {
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([pedido()]))
    abrirApp('/dashboard')

    const total = (await screen.findByText('Total:')).closest('.cp-order-total') as HTMLElement
    expect(total.querySelector('.lucide-receipt')).to.exist
    expect(total.querySelector('.lucide-shield-check')).to.be.null
  })
})

describe('H11.3 — aviso de corte de internet', () => {
  it('aparece al perder la conexión y desaparece al recuperarla', async () => {
    abrirApp('/unauthorized')
    await screen.findByRole('heading', { name: 'Acceso no autorizado' })

    act(() => { globalThis.dispatchEvent(new Event('offline')) })
    const aviso = await screen.findByText(/Sin conexión a internet/)
    act(() => { globalThis.dispatchEvent(new Event('online')) })

    expect(aviso).to.exist
    await waitFor(() => expect(screen.queryByText(/Sin conexión a internet/)).to.be.null)
  })

  it('también en Ingresar, que no usa el diseño principal', async () => {
    abrirApp('/login')
    await screen.findByRole('heading', { name: 'Ingresar' })

    act(() => { globalThis.dispatchEvent(new Event('offline')) })

    expect(await screen.findByText(/Sin conexión a internet/)).to.exist
    act(() => { globalThis.dispatchEvent(new Event('online')) })
  })
})

describe('H6.1 — atajos de teclado', () => {
  it('"/" en el catálogo lleva el foco a la búsqueda', async () => {
    servidor.colgar('GET', '/phones')
    abrirApp('/catalog')
    const buscador = await screen.findByLabelText('Buscar')

    fireEvent.keyDown(globalThis.window, { key: '/' })

    expect(document.activeElement).to.equal(buscador)
    expect(buscador.getAttribute('aria-keyshortcuts')).to.equal('/')
  })

  it('"/" en otra pantalla abre el catálogo con la búsqueda enfocada', async () => {
    servidor.colgar('GET', '/phones')
    abrirApp('/unauthorized')
    await screen.findByRole('heading', { name: 'Acceso no autorizado' })

    fireEvent.keyDown(globalThis.window, { key: '/' })

    await waitFor(() => expect(rutaActual()).to.equal('/catalog?buscar=1'))
    await waitFor(() => expect(document.activeElement?.id).to.equal('filtro-buscar'))
  })

  it('"?" abre la ayuda en la sección de atajos', async () => {
    abrirApp('/unauthorized')
    await screen.findByRole('heading', { name: 'Acceso no autorizado' })

    fireEvent.keyDown(globalThis.window, { key: '?' })

    expect(await screen.findByRole('heading', { name: 'Atajos de teclado' })).to.exist
    expect(globalThis.location.hash).to.equal('#atajos')
  })

  it('no roba teclas mientras se escribe en un campo ni con Ctrl', async () => {
    servidor.colgar('GET', '/phones')
    abrirApp('/catalog')
    const buscador = await screen.findByLabelText('Buscar')

    fireEvent.keyDown(buscador, { key: '?' })
    fireEvent.keyDown(globalThis.window, { key: '?', ctrlKey: true })

    expect(rutaActual()).to.equal('/catalog')
  })

  it('el pie de página anuncia los atajos', async () => {
    abrirApp('/unauthorized')
    expect((await screen.findByRole('link', { name: 'ver todos' })).getAttribute('href')).to.equal('/ayuda#atajos')
  })
})

describe('H4.3 — un ícono, un significado (panel de usuarios)', () => {
  it('"Desbanear" usa un candado abierto; el check queda solo para "Activo"', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', listado(paginado([
      filaUsuario({ id: 'u-ban', email: 'b@gmail.com', banned: true, banReason: 'x' }),
      filaUsuario({ id: 'u-ok', email: 'o@gmail.com' }),
    ])))
    abrirApp('/admin/users')

    const desbanear = await screen.findByRole('button', { name: /desbanear/i })
    expect(desbanear.querySelector('.lucide-lock-open')).to.exist
    expect(desbanear.querySelector('.lucide-circle-check-big, .lucide-check-circle')).to.be.null
  })
})
