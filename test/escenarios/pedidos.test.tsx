import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, rutaActual } from '../helpers/app'
import { creado, fallo, listado, ok, servidor } from '../helpers/servidor'
import {
  celularCompleto,
  itemCarrito,
  paginado,
  pedido,
  sesionDeAdmin,
  sesionIniciada,
  TOKEN_USUARIO,
} from '../helpers/fixtures'

// Pedidos: crear, consultar y cambiar estado (+ el carrito que los alimenta)
// Casos de tests/escenarios/pedidos.test.ts del back.

type Usuario = ReturnType<typeof abrirApp>

function carritoGuardado(...items: ReturnType<typeof itemCarrito>[]) {
  localStorage.setItem('cp_cart', JSON.stringify(items))
}

function carritoActual() {
  return JSON.parse(localStorage.getItem('cp_cart') ?? '[]')
}

async function llenarEntrega(user: Usuario) {
  await user.type(await screen.findByLabelText('Teléfono'), '3001234567')
  await user.type(screen.getByLabelText('Dirección'), 'Calle 10 # 43-25')
  await user.type(screen.getByLabelText('Ciudad'), 'Medellín')
  await user.type(screen.getByLabelText('Departamento'), 'Antioquia')
}

describe('POST /orders — crear pedido', () => {
  it('sin sesión → el checkout pide iniciar sesión', async () => {
    // Arrange
    carritoGuardado(itemCarrito())

    // Act
    abrirApp('/checkout')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(servidor.peticiones('POST', '/orders')).to.be.empty
  })

  it('con el carrito vacío no hay nada que pagar y vuelve al catálogo', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('GET', '/phones', listado(paginado([])))

    // Act
    abrirApp('/checkout')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Catálogo' })).to.exist
    expect(rutaActual()).to.equal('/catalog')
  })

  it('datos inválidos → el formulario los frena y no llega al backend', async () => {
    // Arrange
    sesionIniciada()
    carritoGuardado(itemCarrito())
    const user = abrirApp('/checkout')
    await user.type(await screen.findByLabelText('Teléfono'), '123')

    // Act
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    // Assert
    expect(await screen.findByText('Teléfono inválido')).to.exist
    expect(screen.queryByText('Dirección requerida')).to.exist
    expect(screen.queryByText('Ciudad requerida')).to.exist
    expect(screen.queryByText('Departamento requerido')).to.exist
    expect(servidor.peticiones('POST', '/orders')).to.be.empty
  })

  it('celular inexistente → 404, se muestra el error y el carrito se conserva', async () => {
    // Arrange
    sesionIniciada()
    carritoGuardado(itemCarrito({ phoneId: 'ya-no-existe', key: 'ya-no-existe-negro' }))
    servidor.responder('POST', '/orders', fallo(404, 'Celular no encontrado'))
    const user = abrirApp('/checkout')
    await llenarEntrega(user)

    // Act
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    // Assert
    expect(await screen.findByText('Celular no encontrado')).to.exist
    expect(carritoActual()).to.have.lengthOf(1)
    expect(rutaActual()).to.equal('/checkout')
  })

  it('datos correctos → 201, vacía el carrito y abre el panel con el pedido', async () => {
    // Arrange
    sesionIniciada()
    carritoGuardado(itemCarrito({ qty: 2 }))
    servidor.responder('POST', '/orders', creado(pedido({ orderRef: 'CP-0042' })))
    servidor.responder('GET', '/orders/my', ok([pedido({ orderRef: 'CP-0042' })]))
    const user = abrirApp('/checkout')
    await llenarEntrega(user)

    // Act
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    // Assert
    expect(await screen.findByText('CP-0042')).to.exist
    expect(rutaActual()).to.equal('/dashboard?order=CP-0042')
    expect(carritoActual()).to.deep.equal([])
    const [peticion] = servidor.peticiones('POST', '/orders')
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_USUARIO}`)
    expect(peticion.body).to.deep.equal({
      email: 'mario@gmail.com',
      name: 'Mario Andrade',
      phone: '3001234567',
      address: 'Calle 10 # 43-25',
      city: 'Medellín',
      dept: 'Antioquia',
      items: [{ phoneId: 'phone-1', qty: 2, colorId: 'negro', colorName: 'Negro' }],
    })
  })

  it('mientras se procesa el pedido el botón lo indica y no deja enviarlo dos veces', async () => {
    // Arrange
    sesionIniciada()
    carritoGuardado(itemCarrito())
    servidor.colgar('POST', '/orders')
    const user = abrirApp('/checkout')
    await llenarEntrega(user)

    // Act
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Procesando...' })).to.have.property('disabled', true)
    expect(servidor.peticiones('POST', '/orders')).to.have.lengthOf(1)
  })

  it('el envío es gratis por encima de $500.000 y cuesta $20.000 por debajo', async () => {
    // Arrange
    sesionIniciada()
    carritoGuardado(itemCarrito({ price: 300_000, heroImage: 'https://cdn.celularpro.co/moto.png', name: 'Moto E' }))

    // Act
    abrirApp('/checkout')

    // Assert
    await screen.findByRole('heading', { name: 'Finalizar compra' })
    const resumen = document.querySelector('.cp-checkout-summary') as HTMLElement
    const envio = within(resumen).getByText('Envío').closest('.cp-checkout-row') as HTMLElement
    expect(within(envio).queryByText('$20.000 COP')).to.exist
    expect(screen.getByRole('button', { name: /confirmar pedido/i }).textContent).to.include('$320.000 COP')
  })

  it('un equipo sin color viaja sin colorId ni colorName', async () => {
    // Arrange
    sesionIniciada()
    carritoGuardado(itemCarrito({ key: 'phone-1', colorId: null, colorName: null }))
    servidor.responder('POST', '/orders', creado(pedido({ orderRef: 'CP-0043' })))
    servidor.responder('GET', '/orders/my', ok([pedido({ orderRef: 'CP-0043' })]))
    const user = abrirApp('/checkout')
    await llenarEntrega(user)

    // Act
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    // Assert
    expect(await screen.findByText('CP-0043')).to.exist
    const [peticion] = servidor.peticiones('POST', '/orders')
    expect(peticion.body, 'cuerpo del pedido')
      .to.have.property('items')
      .that.deep.equals([{ phoneId: 'phone-1', qty: 1 }])
  })
})

describe('GET /orders/my — mis pedidos', () => {
  it('con sesión → muestra cada pedido con su estado, artículos y total', async () => {
    // Arrange
    sesionIniciada()
    const enCamino = pedido({
      id: 'order-2',
      orderRef: 'CP-0002',
      status: 'SHIPPED',
      total: 6_020_000,
      items: [{ id: 7, phoneId: 'phone-1', name: 'iPhone 15', heroImage: 'https://cdn.celularpro.co/i15.png', price: 3_000_000, qty: 2, colorId: null, colorName: null }],
    })
    servidor.responder('GET', '/orders/my', ok([pedido(), enCamino]))

    // Act
    abrirApp('/dashboard')
    const tarjeta = (await screen.findByText('CP-0002')).closest('.cp-order-card') as HTMLElement

    // Assert
    expect(within(tarjeta).queryByText('En camino')).to.exist
    expect(within(tarjeta).queryByText('×2')).to.exist
    expect(within(tarjeta).queryByText('$6.020.000 COP')).to.exist
    expect(screen.queryByText('Pendiente')).to.exist
  })

  it('sin pedidos → invita a ver el catálogo', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([]))

    // Act
    abrirApp('/dashboard')

    // Assert
    expect(await screen.findByText('Todavía no tienes pedidos')).to.exist
    expect(screen.queryByRole('link', { name: 'Ver catálogo →' })).to.exist
  })
})

describe('GET /orders — listado de admin', () => {
  it('rol USER → acceso no autorizado', async () => {
    // Arrange
    sesionIniciada()

    // Act
    abrirApp('/admin/orders')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).to.exist
    expect(servidor.peticiones('GET', '/orders')).to.be.empty
  })

  it('admin → lista paginada con cliente, productos y estado', async () => {
    // Arrange
    sesionDeAdmin()
    servidor.responder('GET', '/orders', (peticion) =>
      listado(
        peticion.params.page === 2
          ? paginado([pedido({ id: 'order-9', orderRef: 'CP-0009', name: 'Beto Ruiz' })], { total: 2, totalPages: 2, page: 2 })
          : paginado([pedido({ items: [{ ...pedido().items[0], heroImage: 'https://cdn.celularpro.co/i15.png' }] })], { total: 2, totalPages: 2 }),
      ),
    )
    const user = abrirApp('/admin/orders')
    const fila = (await screen.findByText('CP-0001')).closest('tr') as HTMLElement

    // Act
    await user.click(screen.getByRole('button', { name: /siguiente/i }))

    // Assert
    expect(within(fila).queryByText('Mario Andrade')).to.exist
    expect(within(fila).queryByText('Medellín, Antioquia')).to.exist
    expect(within(fila).queryByText('iPhone 15 ×1')).to.exist
    expect(await screen.findByText('CP-0009')).to.exist
    expect(screen.queryByText('2 órdenes totales')).to.exist
    expect(servidor.peticiones('GET', '/orders').map((p) => p.params)).to.deep.equal([
      { page: 1, limit: 20 },
      { page: 2, limit: 20 },
    ])
  })
})

describe('PUT /orders/:id/status — cambiar estado', () => {
  async function abrirOrdenes(estado: 'CONFIRMED' | 'DELIVERED' = 'CONFIRMED') {
    sesionDeAdmin()
    servidor.responder('GET', '/orders', listado(paginado([pedido({ status: estado })])))
    const user = abrirApp('/admin/orders')
    const fila = (await screen.findByText('CP-0001')).closest('tr') as HTMLElement
    return { user, fila, selector: within(fila).getByRole<HTMLSelectElement>('combobox') }
  }

  it('estado inválido → 400, se muestra el error y el estado no cambia', async () => {
    // Arrange
    servidor.responder('PUT', '/orders/order-1/status', fallo(400, 'Datos inválidos'))
    const { user, selector } = await abrirOrdenes()

    // Act
    await user.selectOptions(selector, 'PENDING')

    // Assert
    expect(await screen.findByText('Datos inválidos')).to.exist
    expect(selector.value).to.equal('CONFIRMED')
  })

  it('pedido inexistente → 404 y el mensaje del backend', async () => {
    // Arrange
    servidor.responder('PUT', '/orders/order-1/status', fallo(404, 'Pedido no encontrado'))
    const { user, selector } = await abrirOrdenes()

    // Act
    await user.selectOptions(selector, 'SHIPPED')

    // Assert
    expect(await screen.findByText('Pedido no encontrado')).to.exist
  })

  it('transición válida → 200 con el estado nuevo', async () => {
    // Arrange
    servidor.responder('PUT', '/orders/order-1/status', ok(pedido({ status: 'SHIPPED' })))
    const { user, fila, selector } = await abrirOrdenes()

    // Act
    await user.selectOptions(selector, 'SHIPPED')

    // Assert
    await waitFor(() => {
      expect(selector.value).to.equal('SHIPPED')
    })
    expect(within(fila).queryAllByText('En camino')).to.have.lengthOf(2)
    expect(servidor.peticiones('PUT', '/orders/order-1/status')[0].body).to.deep.equal({ status: 'SHIPPED' })
  })

  it('un pedido entregado no admite más cambios', async () => {
    // Arrange
    servidor.responder('PUT', '/orders/order-1/status', fallo(400, 'Un pedido entregado no puede cambiar de estado'))
    const { user, selector } = await abrirOrdenes('DELIVERED')

    // Act
    await user.selectOptions(selector, 'CANCELLED')
    await user.click(screen.getByRole('button', { name: 'Sí, marcar como cancelado' }))

    // Assert
    expect(await screen.findByText('Un pedido entregado no puede cambiar de estado')).to.exist
    expect(selector.value).to.equal('DELIVERED')
  })

  it('cancelar un pedido pide confirmación y, si la persona se arrepiente, no envía nada', async () => {
    // Arrange
    const { user, selector } = await abrirOrdenes()

    // Act
    await user.selectOptions(selector, 'CANCELLED')
    const dialogo = screen.getByRole('alertdialog', { name: 'Marcar como cancelado' })
    const mencionaElPedido = within(dialogo).queryByText('CP-0001') !== null
    await user.click(within(dialogo).getByRole('button', { name: 'Volver' }))

    // Assert
    expect(mencionaElPedido).to.be.true
    expect(screen.queryByRole('alertdialog')).to.be.null
    expect(servidor.peticiones('PUT')).to.be.empty
    expect(selector.value).to.equal('CONFIRMED')
  })

  it('confirmar la cancelación sí cambia el estado', async () => {
    // Arrange
    servidor.responder('PUT', '/orders/order-1/status', ok(pedido({ status: 'CANCELLED' })))
    const { user, selector } = await abrirOrdenes()

    // Act
    await user.selectOptions(selector, 'CANCELLED')
    await user.click(screen.getByRole('button', { name: 'Sí, marcar como cancelado' }))

    // Assert
    await waitFor(() => {
      expect(selector.value).to.equal('CANCELLED')
    })
    expect(servidor.peticiones('PUT', '/orders/order-1/status')[0].body).to.deep.equal({ status: 'CANCELLED' })
  })

  it('pasar a un estado intermedio no pregunta nada', async () => {
    // Arrange
    servidor.responder('PUT', '/orders/order-1/status', ok(pedido({ status: 'SHIPPED' })))
    const { user, selector } = await abrirOrdenes()

    // Act
    await user.selectOptions(selector, 'SHIPPED')

    // Assert
    await waitFor(() => {
      expect(selector.value).to.equal('SHIPPED')
    })
    expect(screen.queryByRole('alertdialog')).to.be.null
  })
})

describe('Carrito — lo que termina en POST /orders', () => {
  it('agregar desde la ficha suma al carrito, avisa y actualiza el contador', async () => {
    // Arrange
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto()))
    const user = abrirApp('/phones/iphone-15')
    await screen.findByRole('heading', { name: 'iPhone 15' })
    await user.click(screen.getByRole('button', { name: '+' }))

    // Act
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

    // Assert
    expect(await screen.findByText('✓ iPhone 15 añadido al carrito')).to.exist
    expect(within(screen.getByRole('button', { name: 'Carrito' })).queryByText('2')).to.exist
    expect(carritoActual()).to.deep.equal([itemCarrito({ qty: 2 })])
  })

  it('un equipo sin colores también se agrega, como una línea sin color', async () => {
    // Arrange
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto({ colors: [] })))
    const user = abrirApp('/phones/iphone-15')
    await screen.findByRole('heading', { name: 'iPhone 15' })

    // Act
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

    // Assert
    expect(await screen.findByText('✓ iPhone 15 añadido al carrito')).to.exist
    expect(carritoActual(), 'carrito guardado').to.deep.equal([
      itemCarrito({ key: 'phone-1', colorId: null, colorName: null }),
    ])
  })

  it('el mismo equipo y color se acumula en una sola línea', async () => {
    // Arrange
    carritoGuardado(itemCarrito())
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto()))
    const user = abrirApp('/phones/iphone-15')
    await screen.findByRole('heading', { name: 'iPhone 15' })

    // Act
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    await user.click(screen.getByRole('button', { name: 'Azul' }))
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

    // Assert
    expect(carritoActual().map((i: { key: string; qty: number }) => [i.key, i.qty])).to.deep.equal([
      ['phone-1-negro', 2],
      ['phone-1-azul', 1],
    ])
  })

  it('en el carrito se cambian cantidades, se quita un equipo y se vacía', async () => {
    // Arrange
    carritoGuardado(itemCarrito({ heroImage: 'https://cdn.celularpro.co/i15.png' }), itemCarrito({ key: 'phone-2-gris', phoneId: 'phone-2', name: 'Galaxy S24', colorId: 'gris', colorName: 'Gris' }))
    servidor.responder('GET', '/phones', listado(paginado([])))
    const user = abrirApp('/catalog')
    await user.click(screen.getByRole('button', { name: 'Carrito' }))
    const carrito = screen.getByRole('dialog', { name: 'Carrito' })
    const lineaIphone = within(carrito).getByText('iPhone 15').closest('.cp-drawer-item') as HTMLElement

    // Act
    await user.click(within(lineaIphone).getByRole('button', { name: '+' }))
    await user.click(within(lineaIphone).getByRole('button', { name: '−' }))
    await user.click(within(lineaIphone).getByRole('button', { name: '+' }))
    const trasSumar = carritoActual()[0].qty
    await user.click(within(carrito).getAllByRole('button', { name: 'Eliminar' })[1])
    const trasQuitar = carritoActual().length
    await user.click(within(carrito).getByRole('button', { name: 'Vaciar carrito' }))

    // Assert
    expect(trasSumar).to.equal(2)
    expect(trasQuitar).to.equal(1)
    expect(within(carrito).queryByText('Tu carrito está vacío')).to.exist
    expect(carritoActual()).to.deep.equal([])
  })

  it('"Proceder al pago" cierra el carrito y abre el checkout', async () => {
    // Arrange
    sesionIniciada()
    carritoGuardado(itemCarrito())
    servidor.responder('GET', '/phones', listado(paginado([])))
    const user = abrirApp('/catalog')
    await user.click(screen.getByRole('button', { name: 'Carrito' }))

    // Act
    await user.click(screen.getByRole('button', { name: 'Proceder al pago →' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Finalizar compra' })).to.exist
    expect(screen.getByRole('dialog', { name: 'Carrito' }).className).to.not.include('open')
  })

  it('con el carrito vacío ofrece ir a ver celulares', async () => {
    // Arrange
    servidor.responder('GET', '/phones', listado(paginado([])))
    const user = abrirApp('/')
    await user.click(screen.getByRole('button', { name: 'Carrito' }))

    // Act
    await user.click(screen.getByRole('button', { name: 'Ver celulares' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Catálogo' })).to.exist
    expect(rutaActual()).to.equal('/catalog')
  })
})
