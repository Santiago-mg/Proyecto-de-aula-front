import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../helpers/app'
import { fallo, listado, servidor, type Peticion } from '../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin, sesionIniciada } from '../helpers/fixtures'

// ESC-28 — Consultar usuarios (V(G)=6)
// Caminos de tests/escenarios/esc-28-consultar-usuarios.test.ts del back.

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })
const ANA = filaUsuario()
const BETO = filaUsuario({ id: 'user-4', name: 'Beto Ruiz', email: 'beto@outlook.com' })

// Responde como el backend: con search filtra por nombre o email (sin distinguir
// mayúsculas) en una sola página; sin search pagina de a dos filas.
function responderComoElBackend(peticion: Peticion) {
  const termino = String(peticion.params.search ?? '').toLowerCase()
  if (termino) {
    const filtrados = [FILA_ADMIN, ANA, BETO].filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(termino))
    return listado(paginado(filtrados))
  }
  const pagina = Number(peticion.params.page)
  return listado(paginado(pagina === 2 ? [BETO] : [FILA_ADMIN, ANA], { total: 3, totalPages: 2, page: pagina }))
}

describe('ESC-28 — Consultar usuarios', () => {
  it('Camino 1 (1-2-14): sin sesión no se entra al panel y se pide iniciar sesión', async () => {
    // Arrange
    const ruta = '/admin/users'

    // Act
    abrirApp(ruta)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(rutaActual()).to.equal('/login')
  })

  it('Camino 2 (1-3-4-14): token inválido → 401, se borra la sesión y se redirige a /login', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', fallo(401, 'Token inválido o expirado'))
    const redirecciones = capturarRedirecciones()

    // Act
    abrirApp('/admin/users')

    // Assert
    await waitFor(() => {
      expect(redirecciones).to.deep.equal(['/login'])
    })
    expect(localStorage.getItem('cp_token')).to.be.null
  })

  it('Camino 3 (1-3-5-6-14): rol USER → acceso no autorizado', async () => {
    // Arrange
    sesionIniciada()

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).to.exist
    expect(servidor.peticiones()).to.be.empty
  })

  it('Camino 4 (1-3-5-7-8-14): el backend rechaza la página pedida → 400 y se muestra el motivo', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', fallo(400, 'Datos inválidos'))

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByText('Algunos datos no son válidos. Revisa el formulario e inténtalo de nuevo.')).to.exist
    expect(screen.queryByText('Ana Torres')).to.be.null
  })

  it('Camino 5 (1-3-5-7-9-10-12-13-14): con search → vuelve a la página 1 y muestra solo lo filtrado', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', responderComoElBackend)
    const user = abrirApp('/admin/users')
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await screen.findByText('Beto Ruiz')

    // Act
    await user.type(screen.getByPlaceholderText(/buscar por nombre o email/i), 'ANA')

    // Assert
    expect(await screen.findByText('Ana Torres', {}, { timeout: 1500 })).to.exist
    expect(screen.queryByText('Beto Ruiz')).to.be.null
    const ultima = servidor.peticiones('GET', '/admin/users').at(-1)
    expect(ultima?.params).to.deep.equal({ page: 1, limit: 20, search: 'ANA' })
  })

  it('Camino 6 (1-3-5-7-9-11-12-13-14): sin search → lista completa paginada y se puede avanzar de página', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', responderComoElBackend)
    const user = abrirApp('/admin/users')
    await screen.findByText('Ana Torres')

    // Act
    await user.click(screen.getByRole('button', { name: /siguiente/i }))

    // Assert
    expect(await screen.findByText('Beto Ruiz')).to.exist
    expect(screen.queryByText('3 usuarios registrados')).to.exist
    const [primera, segunda] = servidor.peticiones('GET', '/admin/users')
    expect(primera.params).to.deep.equal({ page: 1, limit: 20, search: undefined })
    expect(segunda.params).to.deep.equal({ page: 2, limit: 20, search: undefined })
  })

  it('La contraseña nunca se muestra, aunque llegara en la respuesta', async () => {
    // Arrange
    sesionDeAdmin()
    const hashFiltrado = 'hash:no-deberia-verse'
    const conHash = { ...ANA, password: hashFiltrado }
    servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, conHash])))

    // Act
    abrirApp('/admin/users')
    const fila = (await screen.findByText('Ana Torres')).closest('tr') as HTMLElement

    // Assert
    expect(within(fila).queryByText(/hash:/)).to.be.null
    expect(document.body.textContent).to.not.include('no-deberia-verse')
  })
})
