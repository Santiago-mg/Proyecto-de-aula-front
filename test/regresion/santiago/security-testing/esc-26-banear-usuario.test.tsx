import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../../../helpers/app'
import { fallo, listado, ok, servidor } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'
import { SIN_PERMISO_DE_ADMIN, XSS_IMAGEN, XSS_SCRIPT, hayHtmlInyectado } from '../helpers/seguridad'

/**
 * ESC-26 — Banear usuario · security-testing (front)
 *
 * El panel no se abre sin permiso, no deja que el admin se banee a sí mismo,
 * aplica la misma regla del motivo que el back, escapa lo que escriben los
 * usuarios y no muestra detalles internos de un error del servidor.
 */

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })

function listadoCon(...filas: ReturnType<typeof filaUsuario>[]) {
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, ...filas])))
}

async function abrirModalDeBaneo(nombre: string) {
  const user = abrirApp('/admin/users')
  const fila = (await screen.findByText(nombre)).closest('tr') as HTMLElement
  await user.click(within(fila).getByRole('button', { name: /^banear/i }))
  return { user, fila }
}

describe('ESC-26 · Seguridad (front) — banear usuario', () => {
  it.each(SIN_PERMISO_DE_ADMIN)('%s no entra a /admin/users y no se pide la lista', async (_caso, prepararSesion, titulo, destino) => {
    // Arrange
    prepararSesion()

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByRole('heading', { name: titulo })).to.exist
    expect(rutaActual()).to.equal(destino)
    expect(servidor.peticiones('GET', '/admin/users')).to.be.empty
  })

  it('en su propia fila el admin no tiene botón para banearse ni para cambiar su rol', async () => {
    // Arrange
    sesionDeAdmin()
    listadoCon(filaUsuario())

    // Act
    abrirApp('/admin/users')
    const filaPropia = (await screen.findByText('(tú)')).closest('tr') as HTMLElement

    // Assert
    expect(within(filaPropia).queryAllByRole('button')).to.be.empty
  })

  it.each([
    ['abc', true],
    ['   abc   ', true],
    ['abcd', false],
    ['   abcd   ', false],
  ])('motivo %j → botón deshabilitado: %s (misma regla que el back)', async (motivo, deshabilitado) => {
    // Arrange
    sesionDeAdmin()
    listadoCon(filaUsuario())
    const { user } = await abrirModalDeBaneo('Ana Torres')

    // Act
    await user.type(screen.getByLabelText('Motivo del baneo'), motivo)

    // Assert
    expect(screen.getByRole('button', { name: /confirmar baneo/i })).to.have.property('disabled', deshabilitado)
  })

  it('el motivo se envía recortado, sin los espacios de los lados', async () => {
    // Arrange
    sesionDeAdmin()
    listadoCon(filaUsuario())
    servidor.responder('PUT', '/admin/users/user-2/ban', ok(filaUsuario({ banned: true, banReason: 'fraude' })))
    const { user } = await abrirModalDeBaneo('Ana Torres')

    // Act
    await user.type(screen.getByLabelText('Motivo del baneo'), '   fraude   ')
    await user.click(screen.getByRole('button', { name: /confirmar baneo/i }))

    // Assert
    await waitFor(() => {
      expect(servidor.peticiones('PUT')).to.have.lengthOf(1)
    })
    expect(servidor.peticiones('PUT')[0].body).to.deep.equal({ reason: 'fraude' })
  })

  it.each([
    [XSS_IMAGEN, 'imagen con onerror'],
    [XSS_SCRIPT, 'etiqueta script'],
  ])('nombre y motivo con %j (%s) se muestran como texto en la tabla y en el modal', async (payload) => {
    // Arrange
    sesionDeAdmin()
    listadoCon(
      filaUsuario({ id: 'user-2', name: payload, email: 'x@gmail.com' }),
      filaUsuario({ id: 'user-3', name: 'Beto', banned: true, banReason: payload }),
    )
    const user = abrirApp('/admin/users')
    const fila = (await screen.findByText('x@gmail.com')).closest('tr') as HTMLElement

    // Act
    await user.click(within(fila).getByRole('button', { name: /^banear/i }))

    // Assert
    expect(screen.getAllByText(payload).length).to.be.at.least(3) // tabla, motivo y modal
    expect(hayHtmlInyectado()).to.equal(false)
  })

  it('un 500 muestra el mensaje genérico, nunca el detalle interno del servidor', async () => {
    // Arrange
    sesionDeAdmin()
    listadoCon(filaUsuario())
    servidor.responder('PUT', '/admin/users/user-2/ban', {
      status: 500,
      body: { error: 'Error interno del servidor', detail: 'connect ECONNREFUSED 127.0.0.1:5432' },
    })
    const { user } = await abrirModalDeBaneo('Ana Torres')

    // Act
    await user.type(screen.getByLabelText('Motivo del baneo'), 'fraude en pagos')
    await user.click(screen.getByRole('button', { name: /confirmar baneo/i }))

    // Assert
    expect(await screen.findByText('Error interno del servidor')).to.exist
    expect(screen.queryByText(/ECONNREFUSED/)).to.be.null
  })

  it('si la sesión venció a mitad del baneo (401), se borra y se vuelve a /login', async () => {
    // Arrange
    sesionDeAdmin()
    listadoCon(filaUsuario())
    servidor.responder('PUT', '/admin/users/user-2/ban', fallo(401, 'Token inválido o expirado'))
    const { user } = await abrirModalDeBaneo('Ana Torres')
    const redirecciones = capturarRedirecciones()

    // Act
    await user.type(screen.getByLabelText('Motivo del baneo'), 'fraude en pagos')
    await user.click(screen.getByRole('button', { name: /confirmar baneo/i }))

    // Assert
    await waitFor(() => {
      expect(redirecciones).to.deep.equal(['/login'])
    })
    expect(localStorage.getItem('cp_token')).to.be.null
  })
})
