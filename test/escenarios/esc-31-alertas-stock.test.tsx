import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../helpers/app'
import { creado, fallo, listado, ok, servidor } from '../helpers/servidor'
import {
  alertaDeStock, celular, celularCompleto, estadisticas, paginado, sesionDeAdmin, sesionIniciada, TOKEN_ADMIN,
} from '../helpers/fixtures'

/**
 * ESC-31 (frontend) — Alertas de stock bajo (funcionalidad 14)
 *
 * "Notifica al administrador cuando el inventario de un producto llega a un
 * umbral mínimo definido." El backend ya levantaba las alertas, pero la
 * pantalla nunca las pedía: el administrador no se enteraba de nada. Estas
 * pruebas recorren lo que ahora ve y hace: la insignia del menú, el aviso del
 * dashboard, la página de alertas, la marca en la tabla de celulares y el
 * campo donde define el umbral.
 */

const pocas = [
  alertaDeStock({ id: 'al-1', type: 'OUT_OF_STOCK', phone: { id: 'p-1', name: 'Pixel 8', stock: 0, minStock: 5 } }),
  alertaDeStock({ id: 'al-2', type: 'LOW_STOCK', phone: { id: 'p-2', name: 'Galaxy S24', stock: 3, minStock: 5 } }),
  alertaDeStock({ id: 'al-3', type: 'LOW_STOCK', phone: { id: 'p-3', name: 'iPhone 15 Pro', stock: 5, minStock: 5 } }),
]

function panelConAlertas(alertas: unknown[] = pocas) {
  sesionDeAdmin()
  servidor.responder('GET', '/admin/stats', ok(estadisticas()))
  servidor.responder('GET', '/admin/alerts', ok(alertas))
}

describe('Insignia del menú — cuántas alertas hay abiertas', () => {
  it('muestra el número de alertas abiertas y lo anuncia a lectores de pantalla', async () => {
    // Arrange
    panelConAlertas()

    // Act
    abrirApp('/admin')

    // Assert
    const insignia = await screen.findByTestId('insignia-alertas')
    expect(insignia.textContent, 'número en la insignia').to.equal('3')
    expect(insignia.getAttribute('aria-label'), 'nombre accesible').to.equal('3 alertas abiertas')
  })

  it('con una sola alerta lo dice en singular', async () => {
    panelConAlertas([pocas[0]])

    abrirApp('/admin')

    expect((await screen.findByTestId('insignia-alertas')).getAttribute('aria-label')).to.equal('1 alerta abierta')
  })

  it('con más de 99 alertas muestra "99+" pero conserva el número exacto para lectores de pantalla', async () => {
    panelConAlertas(Array.from({ length: 120 }, (_, i) => alertaDeStock({ id: `al-${i}`, phone: { id: `p-${i}`, name: `Celular ${i}` } })))

    abrirApp('/admin')

    const insignia = await screen.findByTestId('insignia-alertas')
    expect(insignia.textContent).to.equal('99+')
    expect(insignia.getAttribute('aria-label')).to.equal('120 alertas abiertas')
  })

  it('sin alertas no hay insignia ni aviso en el dashboard', async () => {
    panelConAlertas([])

    abrirApp('/admin')
    await screen.findByRole('heading', { name: 'Panel' })
    await waitFor(() => expect(servidor.peticiones('GET', '/admin/alerts')).to.have.length.greaterThan(0))

    expect(screen.queryByTestId('insignia-alertas')).to.be.null
    expect(document.getElementById('banner-alertas')).to.be.null
  })

  it('se vuelve a pedir al cambiar de página del panel, para no quedar desactualizada', async () => {
    // Arrange: se navega a una página que NO pide alertas por su cuenta (Estadísticas),
    // así que cualquier petición nueva viene del menú y no de la página destino.
    panelConAlertas()
    const user = abrirApp('/admin')
    await screen.findByTestId('insignia-alertas')
    const antes = servidor.peticiones('GET', '/admin/alerts').length

    // Act
    await user.click(screen.getByRole('link', { name: /estadísticas/i }))

    // Assert
    await waitFor(() => expect(servidor.peticiones('GET', '/admin/alerts').length).to.be.greaterThan(antes))
  })

  it('si las alertas no cargan, el panel funciona igual y no inventa una insignia', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas()))
    servidor.responder('GET', '/admin/alerts', fallo(500, 'Error interno del servidor'))

    abrirApp('/admin')

    expect(await screen.findByRole('heading', { name: 'Panel' })).to.exist
    expect(screen.queryByTestId('insignia-alertas')).to.be.null
  })

  it('los botones solo con ícono del menú tienen nombre accesible', async () => {
    panelConAlertas()

    abrirApp('/admin')

    expect(await screen.findByRole('button', { name: 'Abrir menú' })).to.exist
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).to.exist
  })
})

describe('Dashboard — el aviso es la notificación al administrador', () => {
  it('avisa cuántas alertas hay y lleva a la página de alertas', async () => {
    // Arrange
    panelConAlertas()
    servidor.responder('GET', '/phones', listado(paginado([], { limit: 50 })))
    const user = abrirApp('/admin')

    // Act
    const aviso = await waitFor(() => {
      const el = document.getElementById('banner-alertas')
      expect(el).to.exist
      return el as HTMLElement
    })

    // Assert
    expect(aviso.getAttribute('role')).to.equal('status')
    expect(aviso.textContent).to.contain('Hay 3 alertas de inventario sin atender.')
    await user.click(within(aviso).getByRole('link', { name: 'Ver alertas' }))
    await waitFor(() => expect(rutaActual()).to.equal('/admin/alerts'))
  })

  it('con una alerta el texto va en singular', async () => {
    panelConAlertas([pocas[1]])

    abrirApp('/admin')

    await waitFor(() => expect(document.getElementById('banner-alertas')?.textContent).to.contain('Hay 1 alerta de inventario sin atender.'))
  })
})

describe('Página de alertas — /admin/alerts', () => {
  it('lista cada alerta con su tipo, mensaje, stock, mínimo y enlace para reponer', async () => {
    // Arrange
    panelConAlertas()

    // Act
    abrirApp('/admin/alerts')
    const lista = await screen.findByRole('list')

    // Assert
    const items = within(lista).getAllByTestId('alerta')
    expect(items, 'una fila por alerta').to.have.lengthOf(3)
    expect(items.map((i) => i.getAttribute('data-alert-type'))).to.deep.equal(['OUT_OF_STOCK', 'LOW_STOCK', 'LOW_STOCK'])
    expect(within(items[0]).getByText('Sin stock')).to.exist
    expect(within(items[1]).getByText('Stock bajo')).to.exist
    expect(items[1].textContent).to.contain('Stock 3 · Mínimo 5')
    const reponer = within(items[0]).getByRole('link', { name: 'Reponer Pixel 8' })
    expect(reponer.getAttribute('href')).to.equal('/admin/phones/p-1/edit')
  })

  it('el umbral es inclusivo: 5 de 5 aparece como alerta de stock bajo', async () => {
    panelConAlertas()

    abrirApp('/admin/alerts')

    const item = (await screen.findAllByTestId('alerta'))[2]
    expect(item.textContent).to.contain('iPhone 15 Pro')
    expect(item.textContent).to.contain('Stock 5 · Mínimo 5')
    expect(item.getAttribute('data-alert-type')).to.equal('LOW_STOCK')
  })

  it('resume cuántas están agotadas y cuántas tienen poco stock', async () => {
    panelConAlertas()

    abrirApp('/admin/alerts')

    expect((await screen.findByText(/sin stock · /)).textContent).to.equal('1 sin stock · 2 con poco stock')
  })

  it('sin alertas explica que el inventario está sano', async () => {
    panelConAlertas([])

    abrirApp('/admin/alerts')

    const vacio = await screen.findByText(/No hay alertas abiertas/)
    expect(vacio.getAttribute('role')).to.equal('status')
    expect(screen.queryByRole('list')).to.be.null
  })

  it('si el servidor falla muestra el error y "Reintentar" las vuelve a pedir', async () => {
    // Arrange: la primera respuesta falla y la segunda funciona
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas()))
    let llamadas = 0
    servidor.responder('GET', '/admin/alerts', () => {
      llamadas += 1
      return llamadas === 1 ? { status: 500, body: { error: 'Error interno del servidor' } } : { status: 200, body: { data: [pocas[0]] } }
    })
    const user = abrirApp('/admin/alerts')
    expect((await screen.findByRole('alert')).textContent).to.equal('Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.')

    // Act
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // Assert
    expect((await screen.findAllByTestId('alerta'))).to.have.lengthOf(1)
    expect(screen.queryByRole('alert')).to.be.null
  })

  it('el nombre de un celular con HTML se muestra como texto y no se interpreta', async () => {
    const malicioso = '<img src="x" onerror="alert(1)">Pixel'
    panelConAlertas([alertaDeStock({ phone: { id: 'p-9', name: malicioso } })])

    abrirApp('/admin/alerts')

    const item = await screen.findByTestId('alerta')
    expect(item.textContent).to.contain(malicioso)
    expect(item.querySelector('img'), 'no se creó ningún <img>').to.be.null
  })

  it('un cliente (sin rol de admin) no puede entrar → pantalla de acceso no autorizado', async () => {
    sesionIniciada()
    const destinos = capturarRedirecciones()

    abrirApp('/admin/alerts')

    await waitFor(() => expect(rutaActual()).to.equal('/unauthorized'))
    expect(destinos).to.not.include('/admin/alerts')
    expect(servidor.peticiones('GET', '/admin/alerts')).to.be.empty
  })

  it('sin sesión lleva a /login', async () => {
    abrirApp('/admin/alerts')

    await waitFor(() => expect(rutaActual()).to.equal('/login'))
    expect(servidor.peticiones('GET', '/admin/alerts')).to.be.empty
  })

  it('pide las alertas con el token del administrador', async () => {
    panelConAlertas()

    abrirApp('/admin/alerts')
    await screen.findAllByTestId('alerta')

    expect(servidor.peticiones('GET', '/admin/alerts')[0].authorization).to.equal(`Bearer ${TOKEN_ADMIN}`)
  })
})

describe('Tabla de celulares — el estado sale de las alertas, no de números fijos', () => {
  function tablaCon(alertas: unknown[]) {
    sesionDeAdmin()
    servidor.responder('GET', '/phones', listado(paginado([
      celular({ id: 'p-1', name: 'En el mínimo', stock: 5 }),
      celular({ id: 'p-2', name: 'Sobre el mínimo', stock: 3 }),
    ], { limit: 50 })))
    servidor.responder('GET', '/admin/alerts', ok(alertas))
  }

  it('stock 5 con mínimo 5 se marca como bajo (antes solo se marcaba hasta 3)', async () => {
    tablaCon([alertaDeStock({ phone: { id: 'p-1', name: 'En el mínimo', stock: 5, minStock: 5 } })])

    abrirApp('/admin/phones')
    await screen.findByText('En el mínimo')

    const fila = screen.getByText('En el mínimo').closest('tr') as HTMLElement
    await waitFor(() => expect(within(fila).queryByText('Stock bajo')).to.exist)
  })

  it('stock 3 con un mínimo menor NO se marca: no tiene alerta abierta', async () => {
    tablaCon([alertaDeStock({ phone: { id: 'p-1', name: 'En el mínimo', stock: 5, minStock: 5 } })])

    abrirApp('/admin/phones')
    await screen.findByText('Sobre el mínimo')
    await waitFor(() => expect(servidor.peticiones('GET', '/admin/alerts')).to.have.length.greaterThan(0))

    const fila = screen.getByText('Sobre el mínimo').closest('tr') as HTMLElement
    expect(within(fila).queryByText('Stock bajo')).to.be.null
    expect(within(fila).queryByText('Sin stock')).to.be.null
  })

  it('si las alertas no cargan, la tabla se muestra completa y sin marcas', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/phones', listado(paginado([celular({ id: 'p-1', name: 'Pixel 8', stock: 0 })], { limit: 50 })))
    servidor.responder('GET', '/admin/alerts', fallo(500, 'Error interno del servidor'))

    abrirApp('/admin/phones')

    expect(await screen.findByText('Pixel 8')).to.exist
    expect(screen.queryByText('Sin stock')).to.be.null
  })
})

describe('Formulario de celular — definir el umbral mínimo', () => {
  async function rellenarBasico(user: ReturnType<typeof abrirApp>, stock = '4') {
    await user.type(screen.getByLabelText('Nombre'), 'Pixel 8')
    await user.type(screen.getByLabelText('Slug (URL)'), 'pixel-8')
    await user.type(screen.getByLabelText('Marca'), 'Google')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'samsung')
    await user.type(screen.getByLabelText('Precio (COP)'), '2800000')
    await user.type(screen.getByLabelText('Stock'), stock)
  }

  it('el campo existe, arranca en 5 y explica para qué sirve', () => {
    sesionDeAdmin()
    abrirApp('/admin/phones/new')

    const campo = screen.getByLabelText('Stock mínimo (umbral de alerta)') as HTMLInputElement
    expect(campo.value).to.equal('5')
    expect(screen.getByText('Cuando el stock llegue a este número, el panel te avisa para reponerlo.')).to.exist
  })

  it('crear sin tocar el campo envía el mínimo por defecto (5)', async () => {
    sesionDeAdmin()
    servidor.responder('POST', '/phones', creado(celularCompleto({ id: 'p-9' })))
    servidor.responder('GET', '/phones', listado(paginado([], { limit: 50 })))
    const user = abrirApp('/admin/phones/new')
    await rellenarBasico(user)

    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    await waitFor(() => expect(servidor.peticiones('POST', '/phones')).to.have.length(1))
    expect(servidor.peticiones('POST', '/phones')[0].body).to.deep.include({ stock: 4, minStock: 5 })
  })

  it('un umbral propio viaja al backend', async () => {
    sesionDeAdmin()
    servidor.responder('POST', '/phones', creado(celularCompleto({ id: 'p-9' })))
    servidor.responder('GET', '/phones', listado(paginado([], { limit: 50 })))
    const user = abrirApp('/admin/phones/new')
    await rellenarBasico(user)
    const campo = screen.getByLabelText('Stock mínimo (umbral de alerta)')
    await user.clear(campo)
    await user.type(campo, '12')

    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    await waitFor(() => expect(servidor.peticiones('POST', '/phones')).to.have.length(1))
    expect(servidor.peticiones('POST', '/phones')[0].body).to.deep.include({ minStock: 12 })
  })

  it('al editar carga el umbral guardado y lo conserva al guardar', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-7', ok(celularCompleto({ id: 'phone-7', stock: 20, minStock: 7 })))
    servidor.responder('PUT', '/phones/phone-7', ok(celularCompleto({ id: 'phone-7' })))
    servidor.responder('GET', '/phones', listado(paginado([], { limit: 50 })))
    const user = abrirApp('/admin/phones/phone-7/edit')
    const campo = (await screen.findByLabelText('Stock mínimo (umbral de alerta)')) as HTMLInputElement
    expect(campo.value, 'umbral cargado').to.equal('7')

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(servidor.peticiones('PUT', '/phones/phone-7')).to.have.length(1))
    expect(servidor.peticiones('PUT', '/phones/phone-7')[0].body).to.deep.include({ minStock: 7 })
  })

  it('si el backend no manda el umbral, al editar se propone el valor por defecto (5)', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/phones/id/phone-7', ok(celularCompleto({ id: 'phone-7' })))

    abrirApp('/admin/phones/phone-7/edit')

    expect(((await screen.findByLabelText('Stock mínimo (umbral de alerta)')) as HTMLInputElement).value).to.equal('5')
  })

  it.each([
    ['negativo', '-1', 'No puede ser negativo'],
    ['decimal', '2.5', 'Debe ser un número entero'],
    ['sobre el tope', '1000001', 'No puede superar 1.000.000'],
  ])('un umbral %s se frena en el formulario y no llega al backend', async (_caso, valor, mensaje) => {
    sesionDeAdmin()
    const user = abrirApp('/admin/phones/new')
    await rellenarBasico(user)
    const campo = screen.getByLabelText('Stock mínimo (umbral de alerta)')
    await user.clear(campo)
    await user.type(campo, valor)

    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    expect(await screen.findByText(mensaje)).to.exist
    expect(servidor.peticiones('POST', '/phones')).to.be.empty
  })

  it('un stock sobre el tope (3.000.000.000) se frena aquí y no vuelve como un error genérico del servidor', async () => {
    sesionDeAdmin()
    const user = abrirApp('/admin/phones/new')
    await rellenarBasico(user, '3000000000')

    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    expect(await screen.findByText('No puede superar 1.000.000')).to.exist
    expect(servidor.peticiones('POST', '/phones')).to.be.empty
  })

  it('un precio sobre el tope se frena en el formulario', async () => {
    sesionDeAdmin()
    const user = abrirApp('/admin/phones/new')
    await user.type(screen.getByLabelText('Nombre'), 'Pixel 8')
    await user.type(screen.getByLabelText('Slug (URL)'), 'pixel-8')
    await user.type(screen.getByLabelText('Marca'), 'Google')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'samsung')
    await user.type(screen.getByLabelText('Precio (COP)'), '3000000000')
    await user.type(screen.getByLabelText('Stock'), '4')

    await user.click(screen.getByRole('button', { name: 'Crear celular' }))

    expect(await screen.findByText('No puede superar 100.000.000')).to.exist
    expect(servidor.peticiones('POST', '/phones')).to.be.empty
  })
})
