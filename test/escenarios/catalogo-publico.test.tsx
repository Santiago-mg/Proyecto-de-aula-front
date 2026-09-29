import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, rutaActual } from '../helpers/app'
import { fallo, listado, ok, servidor } from '../helpers/servidor'
import { celular, celularCompleto, paginado, sesionDeAdmin, sesionIniciada } from '../helpers/fixtures'

// Catálogo público: listado, filtros y detalle
// Casos de tests/escenarios/catalogo-publico.test.ts del back, vistos desde
// /catalog, /phones/:slug, la ficha de edición del admin y las rutas que no existen.

const IPHONE = celular()
const GALAXY = celular({ id: 'phone-2', slug: 'galaxy-s24', name: 'Galaxy S24', brand: 'Samsung', category: 'samsung', price: 2_900_000 })

function ultimaBusqueda() {
  return servidor.peticiones('GET', '/phones').at(-1)?.params ?? {}
}

describe('GET /phones — listado público', () => {
  it('sin filtros → pide la página 1 y muestra la lista con su total', async () => {
    // Arrange
    servidor.responder('GET', '/phones', listado(paginado([IPHONE, GALAXY])))

    // Act
    abrirApp('/catalog')

    // Assert
    expect(await screen.findByText('Galaxy S24')).to.exist
    expect(screen.queryByText('2 equipos')).to.exist
    expect(ultimaBusqueda()).to.deep.equal({
      page: 1,
      category: undefined,
      brand: undefined,
      condition: undefined,
      verified: undefined,
      maxPrice: undefined,
      search: undefined,
    })
  })

  it('un solo resultado se cuenta en singular', async () => {
    // Arrange
    servidor.responder('GET', '/phones', listado(paginado([IPHONE])))

    // Act
    abrirApp('/catalog')

    // Assert
    expect(await screen.findByText('1 equipo')).to.exist
  })

  it('parámetros fuera de rango → 400 y el catálogo avisa que no pudo cargar', async () => {
    // Arrange
    servidor.responder('GET', '/phones', fallo(400, 'Datos inválidos'))

    // Act
    abrirApp('/catalog?page=999999')

    // Assert
    expect(await screen.findByText(/no se pudo cargar el catálogo/i)).to.exist
    expect(ultimaBusqueda()).to.include({ page: 999999 })
  })

  it('"Solo verificados" filtra por verified=true y al desmarcarlo se quita el filtro', async () => {
    // Arrange
    servidor.responder('GET', '/phones', listado(paginado([IPHONE])))
    const user = abrirApp('/catalog')
    await screen.findByText('iPhone 15')
    const casilla = screen.getByLabelText('Solo verificados ✓')

    // Act
    await user.click(casilla)
    await waitFor(() => {
      expect(ultimaBusqueda()).to.include({ verified: true })
    })
    await user.click(casilla)

    // Assert
    await waitFor(() => {
      expect(ultimaBusqueda()).to.include({ verified: undefined })
    })
    expect(rutaActual()).to.equal('/catalog?page=1')
  })

  it('cada filtro se traduce a su parámetro de la consulta', async () => {
    // Arrange
    servidor.responder('GET', '/phones', listado(paginado([GALAXY])))
    const user = abrirApp('/catalog')
    await screen.findByText('Galaxy S24')

    // Act
    await user.click(screen.getByRole('button', { name: 'Certificados' }))
    await user.selectOptions(screen.getByLabelText('Categoría'), 'samsung')
    await user.selectOptions(screen.getByLabelText('Marca'), 'Samsung')
    await user.type(screen.getByLabelText('Precio máximo (COP)'), '3000000')
    await user.type(screen.getByLabelText('Buscar'), 's24')

    // Assert
    await waitFor(() => {
      expect(ultimaBusqueda()).to.deep.include({
        page: 1,
        condition: 'CERTIFIED',
        category: 'samsung',
        brand: 'Samsung',
        maxPrice: 3_000_000,
        search: 's24',
      })
    })
  })

  it('"Limpiar filtros" deja solo la página 1', async () => {
    // Arrange
    servidor.responder('GET', '/phones', listado(paginado([GALAXY])))
    const user = abrirApp('/catalog?condition=USED&brand=Samsung&search=s24&verified=true&maxPrice=100')
    await screen.findByText('Galaxy S24')

    // Act
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    // Assert
    await waitFor(() => {
      expect(rutaActual()).to.equal('/catalog?page=1')
    })
    expect(ultimaBusqueda()).to.deep.include({ page: 1, condition: undefined, brand: undefined, search: undefined })
  })

  it('la segunda página salta los resultados de la primera', async () => {
    // Arrange
    servidor.responder('GET', '/phones', (peticion) =>
      listado(paginado(peticion.params.page === 2 ? [GALAXY] : [IPHONE], { total: 2, totalPages: 2, page: Number(peticion.params.page) })),
    )
    const user = abrirApp('/catalog')
    await screen.findByText('iPhone 15')

    // Act
    await user.click(screen.getByRole('button', { name: /siguiente/i }))

    // Assert
    expect(await screen.findByText('Galaxy S24')).to.exist
    expect(screen.queryByText('iPhone 15')).to.be.null
    expect(ultimaBusqueda()).to.include({ page: 2 })
    expect(screen.getByRole('button', { name: /siguiente/i })).to.have.property('disabled', true)
    expect(screen.getByRole('button', { name: /anterior/i })).to.have.property('disabled', false)
  })

  it('sin resultados → lo dice en vez de mostrar una grilla vacía', async () => {
    // Arrange
    servidor.responder('GET', '/phones', listado(paginado([])))

    // Act
    abrirApp('/catalog?search=nokia')

    // Assert
    expect(await screen.findByText('Sin resultados para estos filtros.')).to.exist
    expect(ultimaBusqueda()).to.include({ search: 'nokia' })
  })

  it('las tarjetas muestran descuento, condición, batería y el aviso de stock', async () => {
    // Arrange
    const usado = celular({
      id: 'phone-3',
      slug: 'iphone-13',
      name: 'iPhone 13',
      condition: 'USED',
      price: 1_500_000,
      compareAt: 2_000_000,
      batteryHealth: 88,
      stock: 2,
      badge: 'Oferta',
      verified: false,
      heroImage: 'https://cdn.celularpro.co/iphone-13.png',
    })
    const agotado = celular({ id: 'phone-4', slug: 'moto-g', name: 'Moto G', stock: 0, storage: null, ram: null })
    servidor.responder('GET', '/phones', listado(paginado([usado, agotado])))

    // Act
    abrirApp('/catalog')
    const tarjeta = (await screen.findByText('iPhone 13')).closest('a') as HTMLElement

    // Assert
    expect(within(tarjeta).queryByText('-25%')).to.exist
    expect(within(tarjeta).queryByText('Usado verificado')).to.exist
    expect(within(tarjeta).queryByText('Oferta')).to.exist
    expect(within(tarjeta).queryByText(/88%/)).to.exist
    expect(within(tarjeta).queryByText('Últimas 2 unidades')).to.exist
    expect(within(tarjeta).queryByText('$2.000.000 COP')).to.exist
    expect(tarjeta.getAttribute('href')).to.equal('/phones/iphone-13')
    expect(screen.queryByText('Sin stock')).to.exist
  })
})

describe('GET /phones/:slug — detalle público', () => {
  it('slug inexistente → 404 y la ficha lo dice', async () => {
    // Arrange
    servidor.responder('GET', '/phones/no-existe', fallo(404, 'Celular no encontrado'))

    // Act
    abrirApp('/phones/no-existe')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Celular no encontrado' })).to.exist
    expect(screen.queryByRole('link', { name: 'Volver al catálogo' })).to.exist
  })

  it('slug existente → 200 con el celular y sus relaciones', async () => {
    // Arrange
    const certificado = celularCompleto({
      condition: 'CERTIFIED',
      batteryHealth: 91,
      compareAt: 3_500_000,
      badge: 'Top ventas',
      stock: 3,
      images: [
        { url: 'https://cdn.celularpro.co/frente.png', position: 0 },
        { url: 'https://cdn.celularpro.co/atras.png', position: 1 },
      ],
    })
    servidor.responder('GET', '/phones/iphone-15', ok(certificado))
    const user = abrirApp('/phones/iphone-15')
    await screen.findByRole('heading', { name: 'iPhone 15' })

    // Act
    await user.click(screen.getByRole('button', { name: 'Azul' }))
    await user.click(document.querySelectorAll<HTMLElement>('.cp-detail-thumb')[1])

    // Assert
    expect(screen.queryByText('Reacondicionado certificado')).to.exist
    expect(screen.queryByText('Top ventas')).to.exist
    expect(screen.queryByText('$3.500.000 COP')).to.exist
    expect(screen.queryByText('Color — Azul')).to.exist
    expect(screen.queryByText('Solo 3 disponibles')).to.exist
    expect(screen.queryByText('A16 Bionic')).to.exist
    expect(screen.queryByText('USB-C')).to.exist
    expect(screen.queryByText('Descripción larga del equipo.')).to.exist
    expect(screen.getByAltText('iPhone 15').getAttribute('src')).to.equal('https://cdn.celularpro.co/atras.png')
  })

  it('sin galería de fotos usa la imagen principal', async () => {
    // Arrange
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto({ heroImage: 'https://cdn.celularpro.co/hero.png' })))

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    const imagen = await screen.findByAltText('iPhone 15')
    expect(imagen.getAttribute('src')).to.equal('https://cdn.celularpro.co/hero.png')
    expect(document.querySelectorAll('.cp-detail-thumb')).to.have.lengthOf(0)
  })

  it('sin ninguna imagen muestra un ícono y omite las secciones vacías', async () => {
    // Arrange
    const minimo = celularCompleto({ colors: [], features: [], longDesc: null, chip: null, camera: null, screen: null, battery: null, ram: null, storage: null })
    servidor.responder('GET', '/phones/iphone-15', ok(minimo))

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    expect(await screen.findByRole('heading', { name: 'iPhone 15' })).to.exist
    expect(screen.queryByAltText('iPhone 15')).to.be.null
    expect(screen.queryByText('Características')).to.be.null
    expect(screen.queryByText('Especificaciones')).to.be.null
    expect(screen.getByRole('button', { name: 'Agregar al carrito' })).to.have.property('disabled', false)
  })

  it('un celular agotado no deja agregarlo al carrito', async () => {
    // Arrange
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto({ stock: 0 })))

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    expect(await screen.findByRole('button', { name: 'Sin stock' })).to.have.property('disabled', true)
    expect(screen.queryByRole('button', { name: 'Agregar al carrito' })).to.be.null
  })
})

describe('GET /phones/id/:id — ficha de edición (solo admin)', () => {
  it('sin sesión → se pide iniciar sesión', async () => {
    // Arrange
    const ruta = '/admin/phones/phone-1/edit'

    // Act
    abrirApp(ruta)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(servidor.peticiones('GET', '/phones/id/phone-1')).to.be.empty
  })

  it('rol USER → acceso no autorizado, porque expone el registro completo', async () => {
    // Arrange
    sesionIniciada()

    // Act
    abrirApp('/admin/phones/phone-1/edit')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).to.exist
    expect(servidor.peticiones('GET', '/phones/id/phone-1')).to.be.empty
  })

  it('admin con id existente → 200 y el formulario precargado', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-1', ok(celularCompleto({ compareAt: 3_300_000, batteryHealth: 95, badge: 'Nuevo' })))

    // Act
    abrirApp('/admin/phones/phone-1/edit')

    // Assert
    expect(await screen.findByDisplayValue('iphone-15')).to.exist
    expect(screen.queryByDisplayValue('3300000')).to.exist
    expect(screen.queryByDisplayValue('A16 Bionic')).to.exist
    expect(screen.getByLabelText<HTMLTextAreaElement>('Características (una por línea)').value).to.equal('Face ID\nUSB-C')
  })
})

describe('Rutas que no existen', () => {
  it('una URL desconocida lleva a la página 404', async () => {
    // Arrange
    const ruta = '/esto/no/existe'

    // Act
    abrirApp(ruta)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).to.exist
    expect(rutaActual()).to.equal('/404')
  })
})

describe('Inicio — destacados (GET /phones?limit=6)', () => {
  it('muestra los celulares destacados que devuelve el backend', async () => {
    // Arrange
    servidor.responder('GET', '/phones', listado(paginado([IPHONE, GALAXY])))

    // Act
    abrirApp('/')

    // Assert
    expect(await screen.findByText('Galaxy S24')).to.exist
    expect(servidor.peticiones('GET', '/phones')[0].params).to.deep.equal({ limit: 6 })
  })

  it('si el backend falla o no hay equipos, lo anuncia sin romper la portada', async () => {
    // Arrange
    servidor.responder('GET', '/phones', fallo(500, 'Error interno del servidor'))

    // Act
    abrirApp('/')

    // Assert
    expect(await screen.findByText('Pronto habrá equipos disponibles.')).to.exist
    expect(screen.queryByText(/compra un celular/i)).to.exist
  })
})
