import { expect } from 'chai'
import { describe, it } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { listado, ok, servidor, type Respuesta } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'
import { medir } from '../helpers/medicion'
import { respuestaDiferida } from '../helpers/promesas'

/**
 * ESC-26 — Banear usuario · performance-testing (front)
 *
 * Banear actualiza solo la fila afectada con lo que devuelve el back, sin
 * recargar la lista completa, y bloquea la fila mientras la petición viaja
 * para que un doble clic no mande dos baneos.
 */

const PRESUPUESTO_MS = 1_000
const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })
const BANEADA = filaUsuario({ banned: true, banReason: 'fraude en pagos' })

async function banearAAna(manejador: Respuesta | (() => Promise<Respuesta>)) {
  sesionDeAdmin()
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, filaUsuario()])))
  servidor.responder('PUT', '/admin/users/user-2/ban', manejador)
  const user = abrirApp('/admin/users')
  const fila = (await screen.findByText('Ana Torres')).closest('tr') as HTMLElement
  await user.click(within(fila).getByRole('button', { name: /^banear/i }))
  await user.type(screen.getByLabelText('Motivo del baneo'), 'fraude en pagos')
  await user.click(screen.getByRole('button', { name: /confirmar baneo/i }))
  return fila
}

describe('ESC-26 · Performance (front) — banear usuario', () => {
  it('la fila pasa a "Baneado" con el motivo que devolvió el back', async () => {
    // Act
    const fila = await banearAAna(ok(BANEADA))

    // Assert
    expect(await within(fila).findByText('Baneado')).to.exist
    expect(within(fila).getByText('fraude en pagos')).to.exist
  })

  it('no recarga la lista: una sola petición de usuarios y un solo baneo', async () => {
    // Act
    const fila = await banearAAna(ok(BANEADA))
    await within(fila).findByText('Baneado')

    // Assert
    expect(servidor.peticiones('GET', '/admin/users')).to.have.lengthOf(1)
    expect(servidor.peticiones('PUT')).to.have.lengthOf(1)
  })

  it('mientras el baneo viaja, los botones de esa fila quedan bloqueados (sin doble envío)', async () => {
    // Arrange
    const diferida = respuestaDiferida<Respuesta>()

    // Act
    const fila = await banearAAna(() => diferida.promesa)

    // Assert
    for (const boton of within(fila).getAllByRole('button')) {
      expect(boton).to.have.property('disabled', true)
    }
    diferida.entregar(ok(BANEADA))
    expect(await within(fila).findByText('Baneado')).to.exist
  })

  it('del clic en "Confirmar" a ver la fila actualizada cumple el presupuesto', async () => {
    // Arrange
    await banearAAna(ok(BANEADA)) // calentamiento
    cleanup()
    servidor.reiniciar()

    // Act
    const { ms } = await medir(async () => {
      const fila = await banearAAna(ok(BANEADA))
      await within(fila).findByText('Baneado')
    })

    // Assert
    expect(ms, `Tardó ${ms.toFixed(1)} ms`).to.be.below(PRESUPUESTO_MS)
  })
})
