import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../helpers/app'
import { fallo, ok, servidor, sinConexion } from '../helpers/servidor'
import { estadisticas, sesionDeAdmin, sesionIniciada, sieteDias } from '../helpers/fixtures'

// ESC-29 — Panel de estadísticas (V(G)=6)
// Caminos de tests/escenarios/esc-29-panel-estadisticas.test.ts del back. El
// front no calcula los ingresos: muestra lo que devuelve GET /admin/stats, así
// que cada camino se reproduce con la respuesta que daría el backend.

function conVentasHoy(amount: number, count: number) {
  const dias = sieteDias()
  dias[6] = { date: 'Hoy', amount, count }
  return dias
}

function filaDeDetalle(etiqueta: string) {
  return screen.getByText(etiqueta).closest('.cp-stats-detail-row') as HTMLElement
}

describe('ESC-29 — Panel de estadísticas', () => {
  it('Camino 1 (1-2-14): sin sesión no se entra al panel y se pide iniciar sesión', async () => {
    // Arrange
    const ruta = '/admin/stats'

    // Act
    abrirApp(ruta)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(rutaActual()).to.equal('/login')
  })

  it('Camino 2 (1-3-4-14): token inválido → 401, se borra la sesión y se redirige a /login', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', fallo(401, 'Token inválido o expirado'))
    const redirecciones = capturarRedirecciones()

    // Act
    abrirApp('/admin/stats')

    // Assert
    await waitFor(() => {
      expect(redirecciones).to.deep.equal(['/login'])
    })
    expect(localStorage.getItem('cp_token')).to.be.null
  })

  it('Camino 3 (1-3-5-6-14): rol USER → acceso no autorizado', async () => {
    // Arrange
    sesionIniciada()

    // Act
    abrirApp('/admin/stats')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).to.exist
    expect(servidor.peticiones()).to.be.empty
  })

  it('Camino 4 (1-3-5-7-8-9-13-14): sin pedidos → ingresos en 0 y ningún día con ventas', async () => {
    // Arrange
    sesionDeAdmin()
    const vacio = estadisticas({
      orders: { total: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0, revenue: 0, revenueThisMonth: 0 },
    })
    servidor.responder('GET', '/admin/stats', ok(vacio))

    // Act
    abrirApp('/admin/stats')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Estadísticas' })).to.exist
    expect(within(filaDeDetalle('Revenue total histórico')).queryByText('$0 COP')).to.exist
    expect(screen.queryAllByText('—')).to.have.lengthOf(7)
  })

  it('Camino 5 (1-3-5-7-8-9-10-11-9-13-14): pedido no cancelado → sus ingresos aparecen en el día', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas({ revenueByDay: conVentasHoy(3_000_000, 1) })))

    // Act
    abrirApp('/admin/stats')

    // Assert
    expect(await screen.findByText('1 venta')).to.exist
    expect(screen.queryByText('$3.000.000 COP')).to.exist
  })

  it('Camino 6 (1-3-5-7-8-9-10-12-9-13-14): pedido cancelado → se cuenta como cancelado, no en ingresos', async () => {
    // Arrange
    sesionDeAdmin()
    const conCancelado = estadisticas()
    conCancelado.orders = { ...conCancelado.orders, cancelled: 1, revenue: 0 }
    servidor.responder('GET', '/admin/stats', ok(conCancelado))

    // Act
    abrirApp('/admin/stats')

    // Assert
    expect(await screen.findByText('Canceladas')).to.exist
    expect(within(filaDeDetalle('Canceladas')).queryByText('1')).to.exist
    expect(within(filaDeDetalle('Revenue total histórico')).queryByText('$0 COP')).to.exist
  })

  it('Con varios pedidos en un día se muestra el plural', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas({ revenueByDay: conVentasHoy(4_500_000, 2) })))

    // Act
    abrirApp('/admin/stats')

    // Assert
    expect(await screen.findByText('2 ventas')).to.exist
  })

  it('El panel siempre dibuja los 7 días y el de hoy es el último', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas({ revenueByDay: conVentasHoy(1_000_000, 1) })))

    // Act
    abrirApp('/admin/stats')
    await screen.findByText('1 venta')

    // Assert
    const etiquetas = [...document.querySelectorAll('.cp-revenue-bar-label')].map((e) => e.textContent)
    expect(etiquetas).to.have.lengthOf(7)
    expect(etiquetas.at(-1)).to.equal('Hoy')
  })
})

describe('Panel principal (/admin) — mismo endpoint GET /admin/stats', () => {
  it('muestra los KPI con los montos abreviados y el reparto de órdenes', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas({ revenueByDay: conVentasHoy(250_000, 1) })))

    // Act
    abrirApp('/admin')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Panel' })).to.exist
    expect(screen.queryByText('$50M COP')).to.exist
    expect(screen.queryByText('$8M COP este mes')).to.exist
    expect(screen.queryByText('$250K COP')).to.exist
    expect(screen.queryByText('35 entregadas · 8 en camino')).to.exist
  })

  it('mapea los pedidos recientes con su número de artículos (singular y plural)', async () => {
    // Arrange
    sesionDeAdmin()
    const recientes = [
      { id: 'o1', orderRef: 'CP-0101', email: 'ana@gmail.com', name: 'Ana', total: 900, status: 'PENDING', createdAt: '2026-03-01T00:00:00.000Z', itemCount: 1 },
      { id: 'o2', orderRef: 'CP-0102', email: 'beto@gmail.com', name: 'Beto', total: 9_000_000, status: 'DELIVERED', createdAt: '2026-03-02T00:00:00.000Z', itemCount: 3 },
    ]
    servidor.responder('GET', '/admin/stats', ok(estadisticas({ recentOrders: recientes })))

    // Act
    abrirApp('/admin')
    const filaAna = (await screen.findByText('CP-0101')).closest('tr') as HTMLElement
    const filaBeto = screen.getByText('CP-0102').closest('tr') as HTMLElement

    // Assert
    expect(within(filaAna).queryByText('1 ítem')).to.exist
    expect(within(filaAna).queryByText('$900 COP')).to.exist
    expect(within(filaBeto).queryByText('3 ítems')).to.exist
    expect(within(filaBeto).queryByText('Entregado')).to.exist
  })

  it('sin usuarios baneados muestra 0 y sin órdenes no divide por cero', async () => {
    // Arrange
    sesionDeAdmin()
    const limpio = estadisticas({
      users: { total: 1, banned: 0, newThisWeek: 0, admins: 1 },
      orders: { total: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0, revenue: 0, revenueThisMonth: 0 },
    })
    servidor.responder('GET', '/admin/stats', ok(limpio))

    // Act
    abrirApp('/admin')
    await screen.findByRole('heading', { name: 'Panel' })

    // Assert
    const baneados = screen.getByText('Usuarios baneados').previousElementSibling
    expect(baneados?.textContent).to.equal('0')
    const anchos = [...document.querySelectorAll<HTMLElement>('.cp-order-status-bar-fill')].map((b) => b.style.width)
    expect(anchos).to.deep.equal(['0%', '0%', '0%', '0%', '0%'])
  })

  it('si el backend no responde, lo explica y "Reintentar" vuelve a pedir los datos', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', sinConexion())
    const user = abrirApp('/admin')
    await screen.findByText('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.')
    expect(screen.queryByText(/localhost/)).to.be.null
    servidor.responder('GET', '/admin/stats', ok(estadisticas()))

    // Act
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Panel' })).to.exist
    expect(servidor.peticiones('GET', '/admin/stats')).to.have.lengthOf(2)
  })

  it('403 del backend → mensaje de permisos', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', fallo(403, 'Acceso restringido a administradores'))

    // Act
    abrirApp('/admin')

    // Assert
    expect(await screen.findByText(/sin permisos/i)).to.exist
  })
})
