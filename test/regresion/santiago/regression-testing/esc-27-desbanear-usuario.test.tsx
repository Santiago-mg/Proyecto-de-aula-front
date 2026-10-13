import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { fallo, listado, ok, servidor } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'

/**
 * ESC-27 — Desbanear usuario · regression-testing (front)
 */

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })
const BANEADA = filaUsuario({ banned: true, banReason: 'fraude en pagos', bannedAt: '2026-03-01T00:00:00.000Z' })
const ACTIVA = filaUsuario()

async function listaCon(...filas: ReturnType<typeof filaUsuario>[]) {
  sesionDeAdmin()
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, ...filas])))
  const user = abrirApp('/admin/users')
  const fila = (await screen.findByText('Ana Torres')).closest('tr') as HTMLElement
  return { user, fila }
}

describe('ESC-27 · Regresión (front) — desbanear usuario', () => {
  it('desbanear devuelve la fila a "Activo", quita el motivo y vuelve a ofrecer "Banear"', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/unban', ok(ACTIVA))
    const { user, fila } = await listaCon(BANEADA)

    // Act
    await user.click(within(fila).getByRole('button', { name: /desbanear/i }))

    // Assert
    expect(await within(fila).findByText('Activo')).to.exist
    expect(within(fila).queryByText('fraude en pagos')).to.equal(null)
    expect(within(fila).getByRole('button', { name: /^banear/i })).to.exist
  })

  it('desbanear no pide confirmación ni abre un modal', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/unban', ok(ACTIVA))
    const { user, fila } = await listaCon(BANEADA)

    // Act
    await user.click(within(fila).getByRole('button', { name: /desbanear/i }))

    // Assert
    await within(fila).findByText('Activo')
    expect(screen.queryByRole('heading', { name: 'Banear usuario' })).to.equal(null)
    expect(servidor.peticiones('PUT')).to.have.lengthOf(1)
  })

  it('si el back responde 404, se muestra el error y la fila sigue suspendida y reintentable', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/unban', fallo(404, 'Usuario no encontrado'))
    const { user, fila } = await listaCon(BANEADA)

    // Act
    await user.click(within(fila).getByRole('button', { name: /desbanear/i }))

    // Assert
    expect(await screen.findByText('Usuario no encontrado')).to.exist
    expect(within(fila).getByText('Baneado')).to.exist
    expect(within(fila).getByRole('button', { name: /desbanear/i })).to.have.property('disabled', false)
  })

  it('ciclo completo en la misma pantalla: banear y luego desbanear a la misma persona', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/ban', ok(BANEADA))
    servidor.responder('PUT', '/admin/users/user-2/unban', ok(ACTIVA))
    const { user, fila } = await listaCon(ACTIVA)

    // Act
    await user.click(within(fila).getByRole('button', { name: /^banear/i }))
    await user.type(screen.getByLabelText('Motivo del baneo'), 'fraude en pagos')
    await user.click(screen.getByRole('button', { name: /confirmar baneo/i }))
    await within(fila).findByText('Baneado')
    await user.click(within(fila).getByRole('button', { name: /desbanear/i }))

    // Assert
    expect(await within(fila).findByText('Activo')).to.exist
    expect(servidor.peticiones('PUT').map((p) => p.url)).to.deep.equal([
      '/admin/users/user-2/ban',
      '/admin/users/user-2/unban',
    ])
  })
})
