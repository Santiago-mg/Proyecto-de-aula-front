import { expect } from 'chai'
import { describe, it } from 'vitest'
import { phonesService } from '../../../../src/services/phones.service'
import type { PhoneFormData } from '../../../../src/types/phone'
import { creado, fallo, ok, servidor, sinContenido } from '../../../helpers/servidor'
import { celularCompleto, sesionDeAdmin, TOKEN_ADMIN } from '../../../helpers/fixtures'
import { capturarErrorHttp } from '../helpers/promesas'

/**
 * ESC-30 — Administración del catálogo · API testing (front)
 * phonesService.getById / create / update / remove
 */

function formulario(cambios: Partial<PhoneFormData> = {}): PhoneFormData {
  return {
    slug: 'galaxy-s24',
    name: 'Galaxy S24',
    brand: 'Samsung',
    categoryId: 'samsung',
    price: 3_500_000,
    stock: 4,
    condition: 'NEW',
    verified: true,
    features: ['Pantalla AMOLED'],
    ...cambios,
  }
}

describe('ESC-30 · API (front) — administración del catálogo', () => {
  it('getById → GET /phones/id/:id con el token y devuelve el celular completo', async () => {
    // Arrange
    sesionDeAdmin()
    const telefono = celularCompleto({ id: 'phone-9' })
    servidor.responder('GET', '/phones/id/phone-9', ok(telefono))

    // Act
    const resultado = await phonesService.getById('phone-9')

    // Assert
    expect(resultado).to.deep.equal(telefono)
    expect(servidor.peticiones('GET', '/phones/id/phone-9')[0].authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })

  it('create → POST /phones con el formulario en el cuerpo y devuelve lo creado', async () => {
    // Arrange
    sesionDeAdmin()
    const datos = formulario()
    servidor.responder('POST', '/phones', creado(celularCompleto({ slug: datos.slug, name: datos.name })))

    // Act
    const resultado = await phonesService.create(datos)

    // Assert
    expect(resultado).to.include({ slug: 'galaxy-s24', name: 'Galaxy S24' })
    expect(servidor.peticiones('POST', '/phones')[0].body).to.deep.equal(datos)
  })

  it('update → PUT /phones/:id con el cuerpo que recibe, tal cual', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('PUT', '/phones/phone-9', ok(celularCompleto({ price: 2_900_000 })))

    // Act
    await phonesService.update('phone-9', { price: 2_900_000 })

    // Assert
    expect(servidor.peticiones('PUT', '/phones/phone-9')[0].body).to.deep.equal({ price: 2_900_000 })
  })

  it('remove → DELETE /phones/:id y con un 204 se resuelve sin valor', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('DELETE', '/phones/phone-9', sinContenido())

    // Act
    const resultado = await phonesService.remove('phone-9')

    // Assert
    expect(resultado).to.be.undefined
    expect(servidor.peticiones('DELETE', '/phones/phone-9')).to.have.lengthOf(1)
  })

  it.each([
    ['POST', '/phones', () => phonesService.create(formulario()), 409, 'Ya existe un celular con ese slug'],
    ['POST', '/phones', () => phonesService.create(formulario()), 400, 'Datos inválidos'],
    ['PUT', '/phones/phone-9', () => phonesService.update('phone-9', { price: 1 }), 404, 'Celular no encontrado'],
    ['DELETE', '/phones/phone-9', () => phonesService.remove('phone-9'), 404, 'Celular no encontrado'],
  ] as const)('%s %s responde %i → el error llega con "%s"', async (metodo, ruta, operacion, estado, mensaje) => {
    // Arrange
    sesionDeAdmin()
    servidor.responder(metodo, ruta, fallo(estado, mensaje))

    // Act
    const error = await capturarErrorHttp(operacion())

    // Assert
    expect(error.response?.status).to.equal(estado)
    expect(error.response?.data.error).to.equal(mensaje)
  })
})
