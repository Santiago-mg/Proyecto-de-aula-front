import { expect } from 'chai'
import { describe, it } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { listado, ok, servidor, type Respuesta } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'
import { medir } from '../helpers/medicion'
import { respuestaDiferida } from '../helpers/promesas'

/**
 * ESC-27 — Desbanear usuario · performance-testing (front)
 */

const PRESUPUESTO_MS = 1_000
const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })
const BANEADA = filaUsuario({ banned: true, banReason: 'fraude en pagos' })
const ACTIVA = filaUsuario()

async function desbanearAAna(manejador: Respuesta | (() => Promise<Respuesta>)) {
  sesionDeAdmin()
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, BANEADA])))
  servidor.responder('PUT', '/admin/users/user-2/unban', manejador)
  const user = abrirApp('/admin/users')
  const fila = (await screen.findByText('Ana Torres')).closest('tr') as HTMLElement
  await user.click(within(fila).getByRole('button', { name: /desbanear/i }))
  return fila
}

describe('ESC-27 · Performance (front) — desbanear usuario', () => {
  it('la fila vuelve a "Activo" y el botón cambia a "Banear"', async () => {
    // Act
    const fila = await desbanearAAna(ok(ACTIVA))

    // Assert
    expect(await within(fila).findByText('Activo')).to.exist
    expect(within(fila).getByRole('button', { name: /^banear/i })).to.exist
  })

  it('no recarga la lista: una sola petición de usuarios y un solo desbaneo', async () => {
    // Act
    const fila = await desbanearAAna(ok(ACTIVA))
    await within(fila).findByText('Activo')

    // Assert
    expect(servidor.peticiones('GET', '/admin/users')).to.have.lengthOf(1)
    expect(servidor.peticiones('PUT')).to.have.lengthOf(1)
  })

  it('mientras el desbaneo viaja, la fila queda bloqueada (sin doble envío)', async () => {
    // Arrange
    const diferida = respuestaDiferida<Respuesta>()

    // Act
    const fila = await desbanearAAna(() => diferida.promesa)

    // Assert
    expect(within(fila).getByRole('button', { name: /desbanear/i })).to.have.property('disabled', true)
    diferida.entregar(ok(ACTIVA))
    expect(await within(fila).findByText('Activo')).to.exist
    expect(servidor.peticiones('PUT')).to.have.lengthOf(1)
  })

  it('del clic a ver la fila reactivada cumple el presupuesto', async () => {
    // Arrange
    await desbanearAAna(ok(ACTIVA)) // calentamiento
    cleanup()
    servidor.reiniciar()

    // Act
    const { ms } = await medir(async () => {
      const fila = await desbanearAAna(ok(ACTIVA))
      await within(fila).findByText('Activo')
    })

    // Assert
    expect(ms, `Tardó ${ms.toFixed(1)} ms`).to.be.below(PRESUPUESTO_MS)
  })
})
