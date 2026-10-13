import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { abrirApp, rutaActual } from '../../../helpers/app'
import { listado, servidor } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'
import { SIN_PERMISO_DE_ADMIN, XSS_IMAGEN, XSS_SCRIPT, hayHtmlInyectado } from '../helpers/seguridad'

/**
 * ESC-28 — Consultar usuarios · security-testing (front)
 *
 * El listado muestra datos personales: solo lo ve un administrador, pinta lo
 * que escriben los usuarios como texto y no enseña nada que no deba aunque el
 * back lo mande por error.
 */

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })

describe('ESC-28 · Seguridad (front) — consultar usuarios', () => {
  it.each(SIN_PERMISO_DE_ADMIN)('%s no ve el listado y no se pide al back', async (_caso, prepararSesion, titulo, destino) => {
    // Arrange
    prepararSesion()

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByRole('heading', { name: titulo })).to.exist
    expect(rutaActual()).to.equal(destino)
    expect(servidor.peticiones()).to.be.empty
  })

  it.each([
    [XSS_IMAGEN, 'imagen con onerror'],
    [XSS_SCRIPT, 'etiqueta script'],
  ])('nombre y email con %j (%s) se muestran como texto', async (payload) => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', listado(paginado([
      FILA_ADMIN,
      filaUsuario({ name: payload, email: `${payload}@gmail.com` }),
    ])))

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByText(payload)).to.exist
    expect(screen.getByText(`${payload}@gmail.com`)).to.exist
    expect(hayHtmlInyectado()).to.equal(false)
  })

  it('aunque el back mandara la contraseña por error, la tabla no la muestra', async () => {
    // Arrange
    sesionDeAdmin()
    const filaConFuga = { ...filaUsuario(), password: 'hash:clave-de-ana' }
    servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, filaConFuga])))

    // Act
    abrirApp('/admin/users')
    await screen.findByText('Ana Torres')

    // Assert
    expect(document.body.textContent).to.not.include('clave-de-ana')
  })

  it('un término de búsqueda con HTML viaja como parámetro y se queda como texto en el buscador', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN])))
    const user = abrirApp('/admin/users')
    const buscador = await screen.findByPlaceholderText(/buscar por nombre o email/i)

    // Act
    await user.type(buscador, XSS_SCRIPT)

    // Assert
    await waitFor(
      () => {
        const busquedas = servidor.peticiones('GET', '/admin/users').filter((p) => p.params.search)
        expect(busquedas.map((p) => p.params.search)).to.deep.equal([XSS_SCRIPT])
      },
      { timeout: 2000 },
    )
    expect((buscador as HTMLInputElement).value).to.equal(XSS_SCRIPT)
    expect(hayHtmlInyectado()).to.equal(false)
  })
})
