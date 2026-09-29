import { expect } from 'chai'
import { describe, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../helpers/app'
import { creado, fallo, listado, ok, servidor, sinContenido } from '../helpers/servidor'
import { celular, celularCompleto, paginado, sesionDeAdmin, sesionIniciada, TOKEN_ADMIN } from '../helpers/fixtures'

// ESC-30 — Administración del catálogo (V(G)=10)
// Caminos de tests/escenarios/esc-30-administracion-catalogo.test.ts del back:
// POST /phones, PUT /phones/:id y DELETE /phones/:id desde el panel.

type Usuario = ReturnType<typeof abrirApp>

function catalogoCon(...phones: ReturnType<typeof celular>[]) {
  servidor.responder('GET', '/phones', listado(paginado(phones, { limit: 50 })))
}

async function llenarCamposObligatorios(user: Usuario, slug = 'pixel-8') {
  await user.type(screen.getByLabelText('Nombre'), 'Pixel 8')
  await user.type(screen.getByLabelText('Slug (URL)'), slug)
  await user.type(screen.getByLabelText('Marca'), 'Google')
  await user.selectOptions(screen.getByLabelText('Categoría'), 'samsung')
  await user.type(screen.getByLabelText('Precio (COP)'), '2800000')
  await user.type(screen.getByLabelText('Stock'), '4')
}

function confirmarBorrado(respuesta: boolean) {
  vi.spyOn(globalThis, 'confirm').mockReturnValue(respuesta)
}

describe('ESC-30 — Administración del catálogo', () => {
  it('Camino 1 (1-2-19): sin sesión no se entra al panel y se pide iniciar sesión', async () => {
    // Arrange
    const ruta = '/admin/phones/new'

    // Act
    abrirApp(ruta)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(rutaActual()).to.equal('/login')
  })

  it('Camino 2 (1-3-4-19): token inválido → 401, se borra la sesión y se redirige a /login', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones', fallo(401, 'Token inválido o expirado'))
    const redirecciones = capturarRedirecciones()

    // Act
    abrirApp('/admin/phones')

    // Assert
    await waitFor(() => {
      expect(redirecciones).to.deep.equal(['/login'])
    })
    expect(localStorage.getItem('cp_token')).to.be.null
  })

  it('Camino 3 (1-3-5-6-19): rol USER → acceso no autorizado', async () => {
    // Arrange
    sesionIniciada()

    // Act
    abrirApp('/admin/phones')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).to.exist
    expect(servidor.peticiones()).to.be.empty
  })

  it('Camino 4 (1-3-5-7-8-9-19): POST con datos inválidos → el formulario lo frena y no llega al backend', async () => {
    // Arrange
    sesionDeAdmin()
    const user = abrirApp('/admin/phones/new')
    await user.type(await screen.findByLabelText('Nombre'), 'ab')
    await user.type(screen.getByLabelText('Stock'), '-1')

    // Act
    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    // Assert
    expect(await screen.findAllByText('Mínimo 3 caracteres')).to.have.lengthOf(2)
    expect(screen.queryByText('No puede ser negativo')).to.exist
    expect(servidor.peticiones('POST', '/phones')).to.be.empty
  })

  it('Camino 5 (1-3-5-7-8-10-11-19): slug repetido (RN-01) → 409 y el mensaje del backend', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('POST', '/phones', fallo(409, 'Ya existe un celular con ese slug'))
    const user = abrirApp('/admin/phones/new')
    await llenarCamposObligatorios(user, 'iphone-15')

    // Act
    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    // Assert
    expect(await screen.findByText('Ya existe un celular con ese slug')).to.exist
    expect(rutaActual()).to.equal('/admin/phones/new')
  })

  it('Camino 6 (1-3-5-7-8-10-12-19): body válido y slug libre → 201 y vuelve al listado', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('POST', '/phones', creado(celularCompleto({ id: 'phone-9', slug: 'pixel-8', name: 'Pixel 8' })))
    catalogoCon(celular({ id: 'phone-9', slug: 'pixel-8', name: 'Pixel 8', brand: 'Google' }))
    const user = abrirApp('/admin/phones/new')
    await llenarCamposObligatorios(user)
    await user.type(screen.getByLabelText('Características (una por línea)'), 'Tensor G3{enter}{enter}  7 años de updates  ')
    await user.click(screen.getByLabelText('Equipo verificado ✓'))

    // Act
    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Gestión de celulares' })).to.exist
    expect(screen.queryByText('Pixel 8')).to.exist
    const [peticion] = servidor.peticiones('POST', '/phones')
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
    expect(peticion.body).to.deep.include({
      slug: 'pixel-8',
      name: 'Pixel 8',
      brand: 'Google',
      categoryId: 'samsung',
      price: 2_800_000,
      stock: 4,
      condition: 'NEW',
      verified: true,
      features: ['Tensor G3', '7 años de updates'],
    })
  })

  it('Camino 7 (1-3-5-7-13-14-19): PUT sobre un id que ya no existe → 404 Celular no encontrado', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-1', ok(celularCompleto()))
    servidor.responder('PUT', '/phones/phone-1', fallo(404, 'Celular no encontrado'))
    const user = abrirApp('/admin/phones/phone-1/edit')
    await screen.findByDisplayValue('iPhone 15')

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // Assert
    expect(await screen.findByText('Celular no encontrado')).to.exist
    expect(rutaActual()).to.equal('/admin/phones/phone-1/edit')
  })

  it('Camino 8 (1-3-5-7-13-15-19): PUT sobre un celular existente → 200 con los cambios', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-1', ok(celularCompleto()))
    servidor.responder('PUT', '/phones/phone-1', ok(celularCompleto({ price: 2_500_000 })))
    catalogoCon(celular({ price: 2_500_000 }))
    const user = abrirApp('/admin/phones/phone-1/edit')
    const precio = await screen.findByDisplayValue('3000000')
    await user.clear(precio)
    await user.type(precio, '2500000')

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Gestión de celulares' })).to.exist
    const [peticion] = servidor.peticiones('PUT', '/phones/phone-1')
    expect(peticion.body).to.deep.include({ slug: 'iphone-15', price: 2_500_000, features: ['Face ID', 'USB-C'] })
  })

  it('Camino 9 (1-3-5-7-16-17-19): DELETE sobre un id que no existe → 404, aviso y la fila se queda', async () => {
    // Arrange
    sesionDeAdmin()
    catalogoCon(celular())
    servidor.responder('DELETE', '/phones/phone-1', fallo(404, 'Celular no encontrado'))
    confirmarBorrado(true)
    const aviso = vi.spyOn(globalThis, 'alert').mockImplementation(() => {
      // se verifica abajo con qué mensaje se llamó
    })
    const user = abrirApp('/admin/phones')
    await screen.findByText('iPhone 15')

    // Act
    await user.click(screen.getByTitle('Eliminar'))

    // Assert
    await waitFor(() => {
      expect(aviso.mock.calls).to.deep.equal([['Error al eliminar el celular']])
    })
    expect(screen.queryByText('iPhone 15')).to.exist
  })

  it('Camino 10 (1-3-5-7-16-18-19): DELETE sobre un celular existente → 204 y desaparece del listado', async () => {
    // Arrange
    sesionDeAdmin()
    catalogoCon(celular(), celular({ id: 'phone-2', slug: 'galaxy-s24', name: 'Galaxy S24', stock: 0 }))
    servidor.responder('DELETE', '/phones/phone-1', sinContenido())
    confirmarBorrado(true)
    const user = abrirApp('/admin/phones')
    const fila = (await screen.findByText('iPhone 15')).closest('tr') as HTMLElement

    // Act
    await user.click(within(fila).getByTitle('Eliminar'))

    // Assert
    await waitFor(() => {
      expect(screen.queryByText('iPhone 15')).to.be.null
    })
    expect(screen.queryByText('Galaxy S24')).to.exist
    expect(servidor.peticiones('DELETE', '/phones/phone-1')).to.have.lengthOf(1)
  })
})

describe('Panel de celulares — detalles del listado y del formulario', () => {
  it('si el admin cancela la confirmación no se borra nada', async () => {
    // Arrange
    sesionDeAdmin()
    catalogoCon(celular())
    confirmarBorrado(false)
    const user = abrirApp('/admin/phones')
    await screen.findByText('iPhone 15')

    // Act
    await user.click(screen.getByTitle('Eliminar'))

    // Assert
    expect(servidor.peticiones('DELETE')).to.be.empty
    expect(screen.queryByText('iPhone 15')).to.exist
  })

  it('sin celulares invita a crear el primero', async () => {
    // Arrange
    sesionDeAdmin()
    catalogoCon()

    // Act
    abrirApp('/admin/phones')

    // Assert
    expect(await screen.findByText('No hay celulares. Crea el primero.')).to.exist
    expect(servidor.peticiones('GET', '/phones')[0].params).to.deep.equal({ limit: 50 })
  })

  it('marca el stock según quede: agotado, poco o suficiente', async () => {
    // Arrange
    sesionDeAdmin()
    catalogoCon(
      celular({ id: 'a', name: 'Agotado', stock: 0, verified: false, heroImage: 'https://cdn.celularpro.co/a.png' }),
      celular({ id: 'b', name: 'Pocos', stock: 2, condition: 'USED' }),
      celular({ id: 'c', name: 'Muchos', stock: 9, condition: 'CERTIFIED' }),
    )

    // Act
    abrirApp('/admin/phones')
    await screen.findByText('Agotado')

    // Assert
    const colorDe = (nombre: string) =>
      ((screen.getByText(nombre).closest('tr') as HTMLElement).querySelectorAll('td')[3].firstElementChild as HTMLElement).style.color
    expect(colorDe('Agotado')).to.equal('rgb(224, 82, 82)')
    expect(colorDe('Pocos')).to.equal('rgb(224, 144, 82)')
    expect(colorDe('Muchos')).to.equal('inherit')
    expect(screen.queryByText('Usado')).to.exist
    expect(screen.queryByText('Certificado')).to.exist
  })

  it('si el celular a editar no existe, el formulario explica por qué está vacío', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/no-existe', fallo(404, 'Celular no encontrado'))

    // Act
    abrirApp('/admin/phones/no-existe/edit')

    // Assert
    expect(await screen.findByText('Celular no encontrado')).to.exist
    expect(screen.queryByRole('heading', { name: 'Editar celular' })).to.exist
  })

  it('Cancelar vuelve al listado sin guardar', async () => {
    // Arrange
    sesionDeAdmin()
    catalogoCon(celular())
    const user = abrirApp('/admin/phones/new')
    await screen.findByRole('heading', { name: 'Nuevo celular' })

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Gestión de celulares' })).to.exist
    expect(servidor.peticiones('POST')).to.be.empty
  })
})

describe('Formulario de celulares — campos opcionales', () => {
  it('precio tachado, batería, imagen y condición se envían con su tipo', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('POST', '/phones', creado(celularCompleto()))
    catalogoCon()
    const user = abrirApp('/admin/phones/new')
    await llenarCamposObligatorios(user)
    await user.type(screen.getByLabelText('Precio tachado (opcional)'), '3100000')
    await user.type(screen.getByLabelText('Salud de batería % (opcional)'), '87')
    await user.type(screen.getByLabelText('URL imagen principal'), 'https://cdn.celularpro.co/pixel.png')
    await user.selectOptions(screen.getByLabelText('Condición'), 'USED')

    // Act
    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    // Assert
    await screen.findByRole('heading', { name: 'Gestión de celulares' })
    expect(servidor.peticiones('POST', '/phones')[0].body).to.deep.include({
      compareAt: 3_100_000,
      batteryHealth: 87,
      heroImage: 'https://cdn.celularpro.co/pixel.png',
      condition: 'USED',
    })
  })

  it('una URL de imagen mal escrita no se envía', async () => {
    // Arrange
    sesionDeAdmin()
    const user = abrirApp('/admin/phones/new')
    await llenarCamposObligatorios(user)
    await user.type(screen.getByLabelText('URL imagen principal'), 'no-es-url')

    // Act
    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    // Assert
    expect(await screen.findByText('URL inválida')).to.exist
    expect(servidor.peticiones('POST', '/phones')).to.be.empty
  })

  it('un celular sin datos opcionales deja esos campos en blanco al editar', async () => {
    // Arrange
    sesionDeAdmin()
    const sinOpcionales = celularCompleto({
      camera: null,
      battery: null,
      screen: null,
      chip: null,
      shortDesc: null,
      longDesc: null,
      ram: null,
      storage: null,
    })
    servidor.responder('GET', '/phones/id/phone-1', ok(sinOpcionales))

    // Act
    abrirApp('/admin/phones/phone-1/edit')
    await screen.findByDisplayValue('iphone-15')

    // Assert
    for (const campo of ['Precio tachado (opcional)', 'Salud de batería % (opcional)', 'URL imagen principal', 'Procesador', 'Cámara', 'Badge (opcional)']) {
      expect(screen.getByLabelText<HTMLInputElement>(campo).value, campo).to.equal('')
    }
  })

  it('una salud de batería fuera de 0–100 se explica y no se envía', async () => {
    // Arrange
    sesionDeAdmin()
    const user = abrirApp('/admin/phones/new')
    await llenarCamposObligatorios(user)
    await user.type(screen.getByLabelText('Salud de batería % (opcional)'), '150')

    // Act
    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    // Assert
    expect(await screen.findByText('Entre 0 y 100')).to.exist
    expect(servidor.peticiones('POST', '/phones')).to.be.empty
  })

  it('mientras guarda, el botón dice "Guardando..." y queda deshabilitado', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-1', ok(celularCompleto()))
    servidor.colgar('PUT', '/phones/phone-1')
    const user = abrirApp('/admin/phones/phone-1/edit')
    await screen.findByDisplayValue('iphone-15')

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Guardando...' })).to.have.property('disabled', true)
  })
})
