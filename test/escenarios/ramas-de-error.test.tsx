import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { abrirApp } from '../helpers/app'
import { fallo, listado, ok, servidor } from '../helpers/servidor'
import { administrador, celularCompleto, filaUsuario, paginado, sesionDeAdmin, sesionIniciada } from '../helpers/fixtures'

// Ramas de error: cambio de rol, fallos inesperados y edición con relaciones
// Casos de tests/escenarios/ramas-de-error.test.ts del back.

const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })
const ANA = filaUsuario()
const OTRO_ADMIN = filaUsuario({ id: 'admin-2', name: 'Carla Admin', email: 'carla@gmail.com', role: 'ADMIN' })

async function abrirUsuarios(...filas: ReturnType<typeof filaUsuario>[]) {
  sesionDeAdmin()
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, ...filas])))
  const user = abrirApp('/admin/users')
  await screen.findByText('(tú)')
  return user
}

function filaDe(nombre: string) {
  return screen.getByText(nombre).closest('tr') as HTMLElement
}

describe('Cambio de rol — PUT /admin/users/:id/role', () => {
  it('rol USER → no llega al panel de usuarios', async () => {
    // Arrange
    sesionIniciada()

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).to.exist
    expect(servidor.peticiones('PUT')).to.be.empty
  })

  it('un admin no puede cambiar su propio rol: su fila no tiene el botón', async () => {
    // Arrange
    const filas = [ANA]

    // Act
    await abrirUsuarios(...filas)

    // Assert
    expect(within(filaDe('(tú)').closest('tr') as HTMLElement).queryByRole('button', { name: /admin/i })).to.be.null
    expect(within(filaDe('Ana Torres')).queryByRole('button', { name: /hacer admin/i })).to.exist
  })

  it('cambia el rol de otro usuario → 200 y la fila pasa a Admin', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/role', ok({ ...ANA, role: 'ADMIN' }))
    const user = await abrirUsuarios(ANA)

    // Act
    await user.click(within(filaDe('Ana Torres')).getByRole('button', { name: /hacer admin/i }))
    await user.click(screen.getByRole('button', { name: 'Sí, hacer admin' }))

    // Assert
    expect(await within(filaDe('Ana Torres')).findByRole('button', { name: /quitar admin/i })).to.exist
    expect(within(filaDe('Ana Torres')).queryByText('Admin')).to.exist
    expect(servidor.peticiones('PUT', '/admin/users/user-2/role')[0].body).to.deep.equal({ role: 'ADMIN' })
  })

  it('quitar el rol a otro admin lo deja como USER', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/admin-2/role', ok({ ...OTRO_ADMIN, role: 'USER' }))
    const user = await abrirUsuarios(OTRO_ADMIN)

    // Act
    await user.click(within(filaDe('Carla Admin')).getByRole('button', { name: /quitar admin/i }))
    await user.click(screen.getByRole('button', { name: 'Sí, quitar admin' }))

    // Assert
    expect(await within(filaDe('Carla Admin')).findByText('Usuario')).to.exist
    expect(servidor.peticiones('PUT', '/admin/users/admin-2/role')[0].body).to.deep.equal({ role: 'USER' })
  })

  it('el id no existe → 404 y el mensaje del backend', async () => {
    // Arrange
    servidor.responder('PUT', '/admin/users/user-2/role', fallo(404, 'Usuario no encontrado'))
    const user = await abrirUsuarios(ANA)

    // Act
    await user.click(within(filaDe('Ana Torres')).getByRole('button', { name: /hacer admin/i }))
    await user.click(screen.getByRole('button', { name: 'Sí, hacer admin' }))

    // Assert
    expect(await screen.findByText('Usuario no encontrado')).to.exist
    expect(within(filaDe('Ana Torres')).queryByRole('button', { name: /hacer admin/i })).to.exist
  })
})

describe('Fallos inesperados de la capa de datos → 500', () => {
  it('el listado de usuarios muestra el error en vez de quedarse cargando', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/admin/users', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/admin/users')

    // Assert
    expect(await screen.findByText('Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.')).to.exist
    expect(screen.queryByText('Cargando usuarios...')).to.be.null
  })

  it('el listado de celulares del panel también', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/admin/phones')

    // Assert
    expect(await screen.findByText('Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.')).to.exist
  })

  it('y el listado de órdenes', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/orders', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/admin/orders')

    // Assert
    expect(await screen.findByText('Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.')).to.exist
    expect(screen.queryByText('Cargando órdenes...')).to.be.null
  })
})

describe('Actualización de celular con relaciones', () => {
  it('reemplaza las características cuando vienen editadas', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-1', ok(celularCompleto()))
    servidor.responder('PUT', '/phones/phone-1', ok(celularCompleto()))
    servidor.responder('GET', '/phones', listado(paginado([])))
    const user = abrirApp('/admin/phones/phone-1/edit')
    const caracteristicas = await screen.findByDisplayValue(/Face ID/)
    await user.clear(caracteristicas)
    await user.type(caracteristicas, 'Carga inalámbrica{enter}Resistente al agua')

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // Assert
    await screen.findByRole('heading', { name: 'Gestión de celulares' })
    expect(servidor.peticiones('PUT', '/phones/phone-1')[0].body).to.deep.include({
      features: ['Carga inalámbrica', 'Resistente al agua'],
    })
  })

  it('sin características en el formulario manda la lista vacía', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-1', ok(celularCompleto({ features: [] })))
    servidor.responder('PUT', '/phones/phone-1', ok(celularCompleto({ features: [] })))
    servidor.responder('GET', '/phones', listado(paginado([])))
    const user = abrirApp('/admin/phones/phone-1/edit')
    await screen.findByDisplayValue('iphone-15')

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // Assert
    await screen.findByRole('heading', { name: 'Gestión de celulares' })
    expect(servidor.peticiones('PUT', '/phones/phone-1')[0].body).to.deep.include({ features: [] })
  })
})
