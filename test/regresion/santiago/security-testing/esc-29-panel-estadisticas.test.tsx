import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../../../helpers/app'
import { fallo, ok, servidor } from '../../../helpers/servidor'
import { estadisticas, sesionDeAdmin } from '../../../helpers/fixtures'
import { SIN_PERMISO_DE_ADMIN, XSS_IMAGEN, hayHtmlInyectado } from '../helpers/seguridad'

/**
 * ESC-29 — Panel de estadísticas · security-testing (front)
 * Pantallas /admin (panel principal) y /admin/stats.
 */

const PANTALLAS = ['/admin', '/admin/stats']

describe('ESC-29 · Seguridad (front) — panel de estadísticas', () => {
  describe.each(PANTALLAS)('%s', (ruta) => {
    it.each(SIN_PERMISO_DE_ADMIN)('%s no ve los ingresos y no se pide /admin/stats', async (_caso, prepararSesion, titulo, destino) => {
      // Arrange
      prepararSesion()

      // Act
      abrirApp(ruta)

      // Assert
      expect(await screen.findByRole('heading', { name: titulo })).to.exist
      expect(rutaActual()).to.equal(destino)
      expect(servidor.peticiones('GET', '/admin/stats')).to.be.empty
    })

    it('con la sesión vencida (401) se borra la sesión y se vuelve a /login', async () => {
      // Arrange
      sesionDeAdmin()
      servidor.responder('GET', '/admin/stats', fallo(401, 'Token inválido o expirado'))
      const redirecciones = capturarRedirecciones()

      // Act
      abrirApp(ruta)

      // Assert
      await waitFor(() => {
        expect(redirecciones).to.deep.equal(['/login'])
      })
      expect(localStorage.getItem('cp_token')).to.be.null
    })
  })

  it('un cliente con HTML en su nombre aparece como texto en los pedidos recientes', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas({
      recentOrders: [{
        id: 'order-1',
        orderRef: 'CP-0001',
        email: 'cliente@gmail.com',
        name: XSS_IMAGEN,
        total: 3_000_000,
        status: 'PENDING',
        createdAt: '2026-03-10T15:00:00.000Z',
        itemCount: 1,
      }],
    })))

    // Act
    abrirApp('/admin')

    // Assert
    expect(await screen.findByText(XSS_IMAGEN)).to.exist
    expect(hayHtmlInyectado()).to.equal(false)
  })

  it('/admin/stats ante un error del back no muestra su detalle interno', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', {
      status: 500,
      body: { error: 'Error interno del servidor', detail: 'connect ECONNREFUSED 127.0.0.1:5432' },
    })

    // Act
    abrirApp('/admin/stats')

    // Assert
    expect(await screen.findByText('No se pudieron cargar las estadísticas')).to.exist
    expect(screen.queryByText(/ECONNREFUSED/)).to.be.null
  })
})
