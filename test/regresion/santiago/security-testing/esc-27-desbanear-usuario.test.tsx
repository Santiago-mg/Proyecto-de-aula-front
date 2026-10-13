import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { abrirApp, rutaActual } from '../../../helpers/app'
import { fallo, listado, servidor } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'
import { SIN_PERMISO_DE_ADMIN, XSS_IMAGEN, hayHtmlInyectado } from '../helpers/seguridad'

/**
 * ESC-27 — Desbanear usuario · security-testing (front)
 */

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })
const BANEADA = filaUsuario({ banned: true, banReason: 'fraude en pagos', bannedAt: '2026-03-01T00:00:00.000Z' })

describe('ESC-27 · Seguridad (front) — desbanear usuario', () => {
  it.each(SIN_PERMISO_DE_ADMIN)('%s no llega al botón de desbanear: la pantalla ni se abre', async (_caso, prepararSesion, titulo, destino) => {
    // Arrange
    prepararSesion()

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByRole('heading', { name: titulo })).to.exist
    expect(rutaActual()).to.equal(destino)
    expect(servidor.peticiones('PUT')).to.be.empty
  })

  it('el botón "Desbanear" solo aparece en las filas suspendidas de otros usuarios', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', listado(paginado([
      FILA_ADMIN,
      BANEADA,
      filaUsuario({ id: 'user-3', name: 'Beto Ruiz', email: 'beto@gmail.com' }),
    ])))

    // Act
    abrirApp('/admin/users')
    await screen.findByText('Ana Torres')

    // Assert
    const botones = screen.getAllByRole('button', { name: /desbanear/i })
    expect(botones).to.have.lengthOf(1)
    expect(botones[0].closest('tr')?.textContent).to.include('Ana Torres')
  })

  it('si el back rechaza el desbaneo (403), se muestra el motivo y la fila sigue suspendida', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, BANEADA])))
    servidor.responder('PUT', '/admin/users/user-2/unban', fallo(403, 'Acceso restringido a administradores'))
    const user = abrirApp('/admin/users')
    const fila = (await screen.findByText('Ana Torres')).closest('tr') as HTMLElement

    // Act
    await user.click(within(fila).getByRole('button', { name: /desbanear/i }))

    // Assert
    expect(await screen.findByText('Acceso restringido a administradores')).to.exist
    expect(within(fila).getByText('Baneado')).to.exist
  })

  it('un motivo de baneo con HTML se muestra como texto bajo la etiqueta "Baneado"', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, { ...BANEADA, banReason: XSS_IMAGEN }])))

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByText(XSS_IMAGEN)).to.exist
    expect(hayHtmlInyectado()).to.equal(false)
  })
})
