import { expect } from 'chai'
import { describe, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { abrirApp } from '../helpers/app'
import { fallo, listado, ok, servidor } from '../helpers/servidor'
import { CLAVE, estadisticas, paginado, pedido, sesionDeAdmin, sesionIniciada } from '../helpers/fixtures'

// Ramas restantes: listados que fallan, detalle del error, estados terminales
// y mensajes de cuenta suspendida. Casos de tests/escenarios/ramas-restantes.test.ts del back.

type Usuario = ReturnType<typeof abrirApp>

async function ingresar(user: Usuario) {
  await user.type(screen.getByLabelText('Email'), 'mario@gmail.com')
  await user.type(screen.getByLabelText('Contraseña'), CLAVE)
  await user.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('Fallos al consultar listados', () => {
  it('si falla la consulta de mis pedidos → 500: avisa del fallo y deja reintentar, sin decir que no hay pedidos', async () => {
    // Arrange
    // Antes el panel mostraba "Todavía no tienes pedidos", que a quien sí los
    // tiene le hace creer que los perdió. Un fallo del servidor no es una lista vacía.
    sesionIniciada()
    servidor.responder('GET', '/orders/my', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/dashboard')

    // Assert
    expect(await screen.findByText('No pudimos cargar tus pedidos')).to.exist
    expect(screen.queryByText('Todavía no tienes pedidos')).to.be.null
    expect(screen.queryByRole('button', { name: 'Reintentar' })).to.exist
  })

  it('"Reintentar" vuelve a pedir los pedidos y los muestra cuando el servidor ya responde', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('GET', '/orders/my', fallo(500, 'Error interno del servidor'))
    const user = abrirApp('/dashboard')
    await screen.findByText('No pudimos cargar tus pedidos')
    servidor.responder('GET', '/orders/my', ok([pedido({ orderRef: 'CP-0077' })]))

    // Act
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // Assert
    expect(await screen.findByText('CP-0077')).to.exist
    expect(screen.queryByText('No pudimos cargar tus pedidos')).to.be.null
    expect(servidor.peticiones('GET', '/orders/my')).to.have.lengthOf(2)
  })

  it('si falla el conteo del catálogo → 500: el catálogo avisa', async () => {
    // Arrange
    servidor.responder('GET', '/phones', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/catalog')

    // Assert
    expect(await screen.findByText(/no se pudo cargar el catálogo/i)).to.exist
    expect(document.querySelectorAll('.cp-phone-card')).to.have.lengthOf(0)
  })
})

describe('Detalle del error según el entorno del backend', () => {
  it('en producción el 500 solo trae el mensaje genérico, y eso es lo que se ve', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/admin')

    // Assert
    expect(await screen.findByText('Error interno del servidor')).to.exist
  })

  it('fuera de producción el panel muestra el detalle, para diagnosticar', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', {
      status: 500,
      body: { error: 'Error interno del servidor', detail: 'connect ECONNREFUSED 127.0.0.1:5432' },
    })

    // Act
    abrirApp('/admin')

    // Assert
    expect(await screen.findByText('connect ECONNREFUSED 127.0.0.1:5432')).to.exist
  })

  it('si la respuesta de error no trae mensaje, se muestra uno genérico', async () => {
    // Arrange
    servidor.responder('POST', '/auth/login', { status: 502, body: '<html>Bad Gateway</html>' })
    const user = abrirApp('/login')

    // Act
    await ingresar(user)

    // Assert
    expect(await screen.findByText('Error de conexión con el servidor')).to.exist
    expect(screen.queryByText(/bad gateway/i)).to.be.null
  })

  it('si el panel no recibe datos ni mensaje, lo dice igual', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', { status: 500, body: {} })

    // Act
    abrirApp('/admin')

    // Assert
    expect(await screen.findByText('Request failed with status code 500')).to.exist
  })
})

describe('Panel principal sin datos o sin red', () => {
  it('si el navegador está sin conexión, lo dice en vez de mostrar el error crudo', async () => {
    // Arrange
    sesionDeAdmin()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    servidor.responder('GET', '/admin/stats', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/admin')

    // Assert
    expect(await screen.findByText(/no se puede conectar al backend/i)).to.exist
  })

  it('si el backend responde 200 sin datos, avisa que la respuesta llegó vacía', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(null))

    // Act
    abrirApp('/admin')

    // Assert
    expect(await screen.findByText('Respuesta vacía del servidor')).to.exist
  })
})

describe('Estados terminales de un pedido', () => {
  it('un pedido cancelado tampoco revive', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/orders', listado(paginado([pedido({ status: 'CANCELLED' })])))
    servidor.responder('PUT', '/orders/order-1/status', fallo(400, 'Un pedido cancelado no puede cambiar de estado'))
    const user = abrirApp('/admin/orders')
    const fila = (await screen.findByText('CP-0001')).closest('tr') as HTMLElement
    const selector = within(fila).getByRole<HTMLSelectElement>('combobox')

    // Act
    await user.selectOptions(selector, 'CONFIRMED')

    // Assert
    expect(await screen.findByText('Un pedido cancelado no puede cambiar de estado')).to.exist
    expect(selector.value).to.equal('CANCELLED')
  })
})

describe('Mensaje de cuenta suspendida', () => {
  it('sin motivo registrado, el mensaje no inventa uno', async () => {
    // Arrange
    servidor.responder('POST', '/auth/login', fallo(403, 'Tu cuenta ha sido suspendida.'))
    const user = abrirApp('/login')

    // Act
    await ingresar(user)

    // Assert
    expect(await screen.findByText('Tu cuenta ha sido suspendida.')).to.exist
    expect(screen.queryByText(/motivo/i)).to.be.null
  })
})

describe('Filas incompletas que llegan del backend', () => {
  it('un pedido reciente sin artículos se muestra en plural y sin romper la tabla', async () => {
    // Arrange
    sesionDeAdmin()
    const reciente = { id: 'o1', orderRef: 'CP-0500', email: 'x@gmail.com', name: 'X', total: 0, status: 'CANCELLED', createdAt: '2026-03-01T00:00:00.000Z', itemCount: 0 }
    servidor.responder('GET', '/admin/stats', ok(estadisticas({ recentOrders: [reciente] })))

    // Act
    abrirApp('/admin')
    const fila = (await screen.findByText('CP-0500')).closest('tr') as HTMLElement

    // Assert
    expect(within(fila).queryByText('0 ítems')).to.exist
    expect(within(fila).queryByText('$0 COP')).to.exist
  })
})
