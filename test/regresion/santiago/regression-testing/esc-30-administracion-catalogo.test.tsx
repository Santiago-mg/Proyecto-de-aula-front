import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { abrirApp, rutaActual } from '../../../helpers/app'
import { creado, fallo, listado, ok, servidor } from '../../../helpers/servidor'
import { celularCompleto, paginado, sesionDeAdmin } from '../../../helpers/fixtures'

/**
 * ESC-30 — Administración del catálogo · regression-testing (front)
 * Formulario /admin/phones/new y /admin/phones/:id/edit, y la tabla vacía.
 */

/** Llena los campos obligatorios del formulario de creación. */
async function llenarObligatorios(user: UserEvent, cambios: Partial<Record<string, string>> = {}) {
  const valores = {
    Nombre: 'Galaxy S24',
    'Slug (URL)': 'galaxy-s24',
    Marca: 'Samsung',
    'Precio (COP)': '3500000',
    Stock: '4',
    ...cambios,
  }
  for (const [etiqueta, valor] of Object.entries(valores)) {
    const campo = screen.getByLabelText(etiqueta)
    await user.clear(campo)
    if (valor) await user.type(campo, valor)
  }
  await user.selectOptions(screen.getByLabelText('Categoría'), 'samsung')
}

async function abrirFormularioNuevo() {
  sesionDeAdmin()
  servidor.responder('GET', '/phones', listado(paginado([])))
  const user = abrirApp('/admin/phones/new')
  await screen.findByRole('heading', { name: 'Nuevo celular' })
  return user
}

describe('ESC-30 · Regresión (front) — administración del catálogo', () => {
  describe('Crear', () => {
    it('envía los datos con números de verdad y las características por línea, y vuelve a la tabla', async () => {
      // Arrange
      servidor.responder('POST', '/phones', creado(celularCompleto()))
      const user = await abrirFormularioNuevo()
      await llenarObligatorios(user)

      // Act
      await user.type(screen.getByLabelText('Características (una por línea)'), '  Pantalla AMOLED  {enter}{enter}5G{enter}   ')
      await user.click(screen.getByRole('button', { name: 'Crear celular' }))

      // Assert
      await waitFor(() => {
        expect(rutaActual()).to.equal('/admin/phones')
      })
      const [peticion] = servidor.peticiones('POST', '/phones')
      expect(peticion.body).to.deep.include({
        slug: 'galaxy-s24',
        name: 'Galaxy S24',
        brand: 'Samsung',
        categoryId: 'samsung',
        price: 3_500_000,
        stock: 4,
        condition: 'NEW',
        verified: false,
      })
      // Recortadas y sin líneas vacías.
      expect((peticion.body as { features: string[] }).features).to.deep.equal(['Pantalla AMOLED', '5G'])
    })

    it.each([
      [{ Nombre: 'ab' }, 'Mínimo 3 caracteres'],
      [{ 'Precio (COP)': '0' }, 'Debe ser positivo'],
      [{ Stock: '-1' }, 'No puede ser negativo'],
    ])('con %j muestra "%s" y no envía nada', async (cambios, mensaje) => {
      // Arrange
      const user = await abrirFormularioNuevo()
      await llenarObligatorios(user, cambios)

      // Act
      await user.click(screen.getByRole('button', { name: 'Crear celular' }))

      // Assert
      expect(await screen.findByText(mensaje)).to.exist
      expect(servidor.peticiones('POST')).to.be.empty
    })

    // Valores límite de la salud de batería (0 a 100): justo afuera de cada
    // extremo se rechaza y en el extremo se acepta.
    it.each(['-1', '101'])('la salud de batería %s se rechaza sin enviar nada', async (valor) => {
      // Arrange
      const user = await abrirFormularioNuevo()
      await llenarObligatorios(user)

      // Act
      await user.type(screen.getByLabelText('Salud de batería % (opcional)'), valor)
      await user.click(screen.getByRole('button', { name: 'Crear celular' }))

      // Assert
      expect(await screen.findByText('Entre 0 y 100')).to.exist
      expect(servidor.peticiones('POST')).to.be.empty
    })

    it('la salud de batería 100 se acepta y viaja como número', async () => {
      // Arrange
      servidor.responder('POST', '/phones', creado(celularCompleto()))
      const user = await abrirFormularioNuevo()
      await llenarObligatorios(user)

      // Act
      await user.type(screen.getByLabelText('Salud de batería % (opcional)'), '100')
      await user.click(screen.getByRole('button', { name: 'Crear celular' }))

      // Assert
      await waitFor(() => {
        expect(servidor.peticiones('POST', '/phones')).to.have.lengthOf(1)
      })
      expect(servidor.peticiones('POST', '/phones')[0].body).to.deep.include({ batteryHealth: 100 })
      expect(screen.queryByText('Entre 0 y 100')).to.equal(null)
    })

    it('un slug repetido (409) se explica y el formulario conserva lo escrito', async () => {
      // Arrange
      servidor.responder('POST', '/phones', fallo(409, 'Ya existe un celular con ese slug'))
      const user = await abrirFormularioNuevo()
      await llenarObligatorios(user)

      // Act
      await user.click(screen.getByRole('button', { name: 'Crear celular' }))

      // Assert
      expect(await screen.findByText('Ya existe un celular con ese slug')).to.exist
      expect(rutaActual()).to.equal('/admin/phones/new')
      expect(screen.getByLabelText('Nombre')).to.have.property('value', 'Galaxy S24')
    })

    it('"Cancelar" vuelve a la tabla sin enviar nada', async () => {
      // Arrange
      const user = await abrirFormularioNuevo()
      await llenarObligatorios(user)

      // Act
      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      // Assert
      await waitFor(() => {
        expect(rutaActual()).to.equal('/admin/phones')
      })
      expect(servidor.peticiones('POST')).to.be.empty
    })
  })

  describe('Editar', () => {
    it('precarga el celular, envía solo un PUT con los cambios y vuelve a la tabla', async () => {
      // Arrange
      sesionDeAdmin()
      servidor.responder('GET', '/phones/id/phone-1', ok(celularCompleto({ id: 'phone-1' })))
      servidor.responder('PUT', '/phones/phone-1', ok(celularCompleto({ price: 2_800_000 })))
      servidor.responder('GET', '/phones', listado(paginado([])))
      const user = abrirApp('/admin/phones/phone-1/edit')

      // Act
      const precio = await screen.findByLabelText('Precio (COP)')
      await user.clear(precio)
      await user.type(precio, '2800000')
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

      // Assert
      await waitFor(() => {
        expect(rutaActual()).to.equal('/admin/phones')
      })
      const [peticion] = servidor.peticiones('PUT', '/phones/phone-1')
      expect(peticion.body).to.deep.include({ slug: 'iphone-15', name: 'iPhone 15', price: 2_800_000 })
      expect((peticion.body as { features: string[] }).features).to.deep.equal(['Face ID', 'USB-C'])
      expect(servidor.peticiones('POST')).to.be.empty
    })

    it('si el celular ya no existe (404), el formulario explica por qué quedó vacío', async () => {
      // Arrange
      sesionDeAdmin()
      servidor.responder('GET', '/phones/id/phone-1', fallo(404, 'Celular no encontrado'))

      // Act
      abrirApp('/admin/phones/phone-1/edit')

      // Assert
      expect(await screen.findByText('Celular no encontrado')).to.exist
    })
  })

  it('con el catálogo vacío, la tabla invita a crear el primero', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones', listado(paginado([])))

    // Act
    abrirApp('/admin/phones')

    // Assert
    expect(await screen.findByText('No hay celulares. Crea el primero.')).to.exist
  })
})
