import { expect } from 'chai'
import { describe, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { ok, servidor } from '../../../helpers/servidor'
import { estadisticas, sesionDeAdmin } from '../../../helpers/fixtures'
import { medir } from '../helpers/medicion'

/**
 * ESC-29 — Panel de estadísticas · performance-testing (front)
 *
 * Las estadísticas son la consulta más cara del back (11 consultas): cada
 * pantalla debe pedirlas una sola vez y pintarlas dentro del presupuesto.
 */

const PRESUPUESTO_MS = 1_000

const PANTALLAS: Array<[string, string]> = [
  ['/admin', 'Dashboard'],
  ['/admin/stats', 'Estadísticas'],
]

async function abrirPanel(ruta: string, titulo: string) {
  sesionDeAdmin()
  servidor.responder('GET', '/admin/stats', ok(estadisticas()))
  abrirApp(ruta)
  await screen.findByRole('heading', { name: titulo })
}

describe('ESC-29 · Performance (front) — panel de estadísticas', () => {
  describe.each(PANTALLAS)('%s', (ruta, titulo) => {
    it('pinta los indicadores que llegaron', async () => {
      // Act
      await abrirPanel(ruta, titulo)

      // Assert
      expect(screen.getAllByText('120').length).to.be.at.least(1) // usuarios registrados
    })

    it('pide las estadísticas una sola vez', async () => {
      // Act
      await abrirPanel(ruta, titulo)
      // Se da tiempo a que un efecto mal escrito volviera a pedirlas.
      await new Promise((resolver) => setTimeout(resolver, 50))

      // Assert
      expect(servidor.peticiones('GET', '/admin/stats')).to.have.lengthOf(1)
      expect(servidor.peticiones()).to.have.lengthOf(1)
    })

    it('se pinta dentro del presupuesto', async () => {
      // Arrange
      await abrirPanel(ruta, titulo) // calentamiento
      cleanup()
      servidor.reiniciar()

      // Act
      const { ms } = await medir(() => abrirPanel(ruta, titulo))

      // Assert
      expect(ms, `Tardó ${ms.toFixed(1)} ms`).to.be.below(PRESUPUESTO_MS)
    })
  })
})
