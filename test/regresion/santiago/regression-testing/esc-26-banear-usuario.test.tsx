import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { fallo, listado, ok, servidor } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'

/**
 * ESC-26 — Banear usuario · regression-testing (front)
 * Pantalla /admin/users → botón "Banear" → modal → "Confirmar baneo".
 */

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })

async function abrirModal() {
  sesionDeAdmin()
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, filaUsuario()])))
  const user = abrirApp('/admin/users')
  const fila = (await screen.findByText('Ana Torres')).closest('tr') as HTMLElement
  await user.click(within(fila).getByRole('button', { name: /^banear/i }))
  return { user, fila }
}

async function confirmarBaneo(user: ReturnType<typeof abrirApp>, motivo = 'fraude en pagos') {
  await user.type(screen.getByLabelText('Motivo del baneo'), motivo)
  await user.click(screen.getByRole('button', { name: /confirmar baneo/i }))
}

describe('ESC-26 · Regresión (front) — banear usuario', () => {
  it('el modal identifica a quién se va a suspender', async () => {
    // Act
    await abrirModal()

    // Assert
    const modal = screen.getByRole('heading', { name: 'Banear usuario' }).closest('.cp-modal') as HTMLElement
    expect(within(modal).getByText('Ana Torres')).to.exist
    expect(within(modal).getByText(/ana@gmail\.com/)).to.exist
  })

  it('flujo completo: el modal se cierra y la fila queda "Baneado" con su motivo y el botón "Desbanear"', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/ban', ok(filaUsuario({ banned: true, banReason: 'fraude en pagos' })))
    const { user, fila } = await abrirModal()

    // Act
    await confirmarBaneo(user, 'fraude en pagos')

    // Assert
    expect(await within(fila).findByText('Baneado')).to.exist
    expect(within(fila).getByText('fraude en pagos')).to.exist
    expect(within(fila).getByRole('button', { name: /desbanear/i })).to.exist
    expect(screen.queryByRole('heading', { name: 'Banear usuario' })).to.be.null
    // Al back le llegó el motivo que escribió el admin, y nada más.
    const [peticion] = servidor.peticiones('PUT', '/admin/users/user-2/ban')
    expect(peticion.body).to.deep.equal({ reason: 'fraude en pagos' })
  })

  it('"Cancelar" cierra el modal sin enviar nada', async () => {
    // Arrange
    const { user, fila } = await abrirModal()

    // Act
    await user.type(screen.getByLabelText('Motivo del baneo'), 'fraude en pagos')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    // Assert
    expect(screen.queryByRole('heading', { name: 'Banear usuario' })).to.be.null
    expect(servidor.peticiones('PUT')).to.be.empty
    expect(within(fila).getByText('Activo')).to.exist
  })

  it('el modal abre vacío cada vez: no recuerda el motivo de un intento cancelado', async () => {
    // Arrange
    const { user, fila } = await abrirModal()
    await user.type(screen.getByLabelText('Motivo del baneo'), 'motivo viejo')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    // Act
    await user.click(within(fila).getByRole('button', { name: /^banear/i }))

    // Assert
    expect(screen.getByLabelText('Motivo del baneo')).to.have.property('value', '')
  })

  it('tras un error se ve el mensaje y el botón "Banear" de la fila queda habilitado', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/ban', fallo(500, 'Error interno del servidor'))
    const { user, fila } = await abrirModal()

    // Act
    await confirmarBaneo(user)

    // Assert
    expect(await screen.findByText('Error interno del servidor')).to.exist
    expect(within(fila).getByRole('button', { name: /^banear/i })).to.have.property('disabled', false)
    expect(within(fila).queryByText('Baneado')).to.be.null
  })

  it('al reintentar con éxito la fila queda "Baneado" y el error desaparece', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/ban', fallo(500, 'Error interno del servidor'))
    const { user, fila } = await abrirModal()
    await confirmarBaneo(user)
    await screen.findByText('Error interno del servidor')
    servidor.responder('PUT', '/admin/users/user-2/ban', ok(filaUsuario({ banned: true, banReason: 'fraude en pagos' })))

    // Act
    await user.click(within(fila).getByRole('button', { name: /^banear/i }))
    await confirmarBaneo(user)

    // Assert
    expect(await within(fila).findByText('Baneado')).to.exist
    expect(screen.queryByText('Error interno del servidor')).to.be.null
    expect(servidor.peticiones('PUT', '/admin/users/user-2/ban')).to.have.lengthOf(2)
  })
})
