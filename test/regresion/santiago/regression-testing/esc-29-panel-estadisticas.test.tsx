import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { fallo, ok, servidor, sinConexion } from '../../../helpers/servidor'
import { estadisticas, sesionDeAdmin, sieteDias } from '../../../helpers/fixtures'

/**
 * ESC-29 — Panel de estadísticas · regression-testing (front)
 * Pantallas /admin/stats (detalle) y /admin (panel principal).
 *
 * Formatos de dinero, etiquetas de ventas, el total de la semana, la altura de
 * cada barra y los mensajes cuando el back falla.
 */

function semanaCon(montos: Array<[number, number]>) {
  return sieteDias().map((dia, i) => ({ ...dia, amount: montos[i]?.[0] ?? 0, count: montos[i]?.[1] ?? 0 }))
}

describe('ESC-29 · Regresión (front) — panel de estadísticas', () => {
  describe('/admin/stats', () => {
    it('los ingresos se muestran en pesos colombianos con separador de miles', async () => {
      // Arrange
      sesionDeAdmin()
      servidor.responder('GET', '/admin/stats', ok(estadisticas()))

      // Act
      abrirApp('/admin/stats')

      // Assert
      expect(await screen.findByText('$50.000.000 COP')).to.exist // revenue histórico
      expect(screen.getByText('$8.000.000 COP')).to.exist // revenue del mes
    })

    it.each([
      [0, '—'],
      [1, '1 venta'],
      [3, '3 ventas'],
    ])('un día con %i ventas se etiqueta "%s"', async (ventas, etiqueta) => {
      // Arrange
      sesionDeAdmin()
      const semana = semanaCon([[ventas * 100_000, ventas]])
      servidor.responder('GET', '/admin/stats', ok(estadisticas({ revenueByDay: semana })))

      // Act
      abrirApp('/admin/stats')

      // Assert
      await screen.findByText('Revenue últimos 7 días')
      const valores = [...document.querySelectorAll('.cp-revenue-bar-value')].map((e) => e.textContent)
      expect(valores[0]).to.equal(etiqueta)
    })

    it('el total de la semana es la suma de los 7 días', async () => {
      // Arrange
      sesionDeAdmin()
      const semana = semanaCon([[100_000, 1], [0, 0], [250_000, 2], [0, 0], [0, 0], [50_000, 1], [600_000, 3]])
      servidor.responder('GET', '/admin/stats', ok(estadisticas({ revenueByDay: semana })))

      // Act
      abrirApp('/admin/stats')

      // Assert
      expect(await screen.findByText('$1.000.000 COP')).to.exist
    })

    it('cada barra es proporcional al día con más ingresos', async () => {
      // Arrange
      sesionDeAdmin()
      const semana = semanaCon([[400_000, 2], [200_000, 1], [0, 0], [100_000, 1]])
      servidor.responder('GET', '/admin/stats', ok(estadisticas({ revenueByDay: semana })))

      // Act
      abrirApp('/admin/stats')

      // Assert
      await screen.findByText('Revenue últimos 7 días')
      const alturas = [...document.querySelectorAll<HTMLElement>('.cp-revenue-bar-fill')].map((e) => e.style.height)
      expect(alturas.slice(0, 4)).to.deep.equal(['100%', '50%', '0%', '25%'])
    })

    it('una semana sin ventas no divide por cero: todas las barras en 0%', async () => {
      // Arrange
      sesionDeAdmin()
      servidor.responder('GET', '/admin/stats', ok(estadisticas({ revenueByDay: sieteDias() })))

      // Act
      abrirApp('/admin/stats')

      // Assert
      await screen.findByText('Revenue últimos 7 días')
      const alturas = [...document.querySelectorAll<HTMLElement>('.cp-revenue-bar-fill')].map((e) => e.style.height)
      expect(alturas).to.deep.equal(Array(7).fill('0%'))
    })

    it('si el back falla, la pantalla lo indica en vez de quedarse cargando', async () => {
      // Arrange
      sesionDeAdmin()
      servidor.responder('GET', '/admin/stats', fallo(500, 'Error interno del servidor'))

      // Act
      abrirApp('/admin/stats')

      // Assert
      expect(await screen.findByText('No se pudieron cargar las estadísticas')).to.exist
      expect(screen.queryByText('Calculando estadísticas...')).to.be.null
    })
  })

  describe('/admin (panel principal)', () => {
    it.each([
      [50_000_000, '$50M COP'],
      [1_500_000, '$1.5M COP'],
      [950_000, '$950K COP'],
      [500, '$500 COP'],
    ])('un revenue de %i se resume como "%s"', async (revenue, texto) => {
      // Arrange
      sesionDeAdmin()
      const datos = estadisticas()
      servidor.responder('GET', '/admin/stats', ok({ ...datos, orders: { ...datos.orders, revenue, revenueThisMonth: 0 } }))

      // Act
      abrirApp('/admin')

      // Assert
      expect(await screen.findByText(texto)).to.exist
    })

    it.each([
      ['un 403', fallo(403, 'Acceso restringido a administradores'), 'Sin permisos. Verifica que estés logueado como admin.'],
      ['sin conexión', sinConexion(), 'No se puede conectar al backend. ¿Está corriendo en localhost:3001?'],
      ['un error con mensaje', fallo(500, 'Error interno del servidor'), 'Error interno del servidor'],
    ])('con %s explica qué pasó', async (_caso, respuesta, mensaje) => {
      // Arrange
      sesionDeAdmin()
      servidor.responder('GET', '/admin/stats', respuesta)

      // Act
      abrirApp('/admin')

      // Assert
      expect(await screen.findByText('No se pudieron cargar las estadísticas')).to.exist
      expect(screen.getByText(mensaje)).to.exist
    })

    it('"Reintentar" vuelve a pedir las estadísticas y, si responden, muestra el panel', async () => {
      // Arrange
      sesionDeAdmin()
      servidor.responder('GET', '/admin/stats', fallo(500, 'Error interno del servidor'))
      const user = abrirApp('/admin')
      await screen.findByText('No se pudieron cargar las estadísticas')
      servidor.responder('GET', '/admin/stats', ok(estadisticas()))

      // Act
      await user.click(screen.getByRole('button', { name: 'Reintentar' }))

      // Assert
      expect(await screen.findByRole('heading', { name: 'Dashboard' })).to.exist
      await waitFor(() => {
        expect(servidor.peticiones('GET', '/admin/stats')).to.have.lengthOf(2)
      })
    })
  })
})
