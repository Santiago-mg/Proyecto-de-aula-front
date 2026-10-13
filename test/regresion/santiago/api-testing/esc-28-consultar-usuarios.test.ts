import { expect } from 'chai'
import { describe, it } from 'vitest'
import { adminService } from '../../../../src/services/admin.service'
import { fallo, listado, servidor } from '../../../helpers/servidor'
import { filaUsuario, paginado, sesionDeAdmin, TOKEN_ADMIN } from '../../../helpers/fixtures'
import { capturarErrorHttp } from '../helpers/promesas'

/**
 * ESC-28 — Consultar usuarios · API testing (front)
 * adminService.getUsers(page, search) → GET /admin/users?page&limit&search
 */

const RUTA = '/admin/users'

describe('ESC-28 · API (front) — adminService.getUsers', () => {
  it('sin argumentos pide la página 1 de 20 y no manda búsqueda', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', RUTA, listado(paginado([filaUsuario()])))

    // Act
    await adminService.getUsers()

    // Assert
    const [peticion] = servidor.peticiones('GET', RUTA)
    expect(peticion.params).to.deep.equal({ page: 1, limit: 20, search: undefined })
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })

  it.each([
    [1, 'ana', { page: 1, limit: 20, search: 'ana' }],
    [3, undefined, { page: 3, limit: 20, search: undefined }],
    [2, 'torres@gmail.com', { page: 2, limit: 20, search: 'torres@gmail.com' }],
  ])('getUsers(%i, %j) → params %j', async (pagina, busqueda, params) => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', RUTA, listado(paginado([])))

    // Act
    await adminService.getUsers(pagina, busqueda)

    // Assert
    expect(servidor.peticiones('GET', RUTA)[0].params).to.deep.equal(params)
  })

  it('devuelve { data, meta } tal como llega, sin desenvolver', async () => {
    // Arrange
    sesionDeAdmin()
    const respuesta = paginado([filaUsuario(), filaUsuario({ id: 'user-3', name: 'Beto' })], { total: 22, totalPages: 2 })
    servidor.responder('GET', RUTA, listado(respuesta))

    // Act
    const resultado = await adminService.getUsers()

    // Assert
    expect(resultado).to.deep.equal(respuesta)
    expect(resultado.meta).to.include({ total: 22, totalPages: 2 })
  })

  it.each([
    [400, 'Datos inválidos'],
    [403, 'Acceso restringido a administradores'],
  ])('si el back responde %i, el error llega con su mensaje', async (estado, mensaje) => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', RUTA, fallo(estado, mensaje))

    // Act
    const error = await capturarErrorHttp(adminService.getUsers())

    // Assert
    expect(error.response?.status).to.equal(estado)
    expect(error.response?.data.error).to.equal(mensaje)
  })
})
