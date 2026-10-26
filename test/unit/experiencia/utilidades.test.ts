import { expect } from 'chai'
import { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, describe, it } from 'vitest'
import {
  VOCABULARIO_BASE,
  aprenderVocabulario,
  clave,
  distancia,
  leerVocabulario,
  normalizar,
  palabrasDe,
  sugerir,
  vocabularioCompleto,
} from '../../../src/utils/busqueda'
import { guardarBorrador, borrarBorrador, leerBorrador, tieneDatosDeEntrega } from '../../../src/utils/borrador'
import { describirError } from '../../../src/utils/errores'
import { ESTADOS_PEDIDO, ORDEN_ESTADOS, PASOS_PEDIDO, infoEstado } from '../../../src/utils/estados'
import { SIN_FILTROS, filtrosActivos } from '../../../src/utils/filtros'
import type { PhonesQuery } from '../../../src/types/phone'
import { formatCOP, formatCOPCorto, formatDiaCorto, formatFecha, formatPrecio } from '../../../src/utils/formato'
import {
  leerSesionVencida,
  limpiarSesionVencida,
  marcarSesionVencida,
  rutaDesde,
  rutaSegura,
} from '../../../src/utils/sesion'
import { borrarVistos, leerVistos, registrarVisto, type Visto } from '../../../src/utils/vistos'

// Utilidades nuevas del front: lo que antes estaba repetido en cada pantalla
// (formatos, estados de pedido) y lo que se agregó para la experiencia de uso
// (búsqueda tolerante, borrador del pago, vistos, filtros activos, errores).

afterEach(() => {
  sessionStorage.clear()
})

describe('formato — dinero y fechas', () => {
  it('formatCOP agrupa miles con punto y agrega la moneda', () => {
    // Arrange
    const precio = 1_200_000

    // Act
    const texto = formatCOP(precio)

    // Assert
    expect(texto).to.equal('$1.200.000 COP')
  })

  it('formatPrecio omite la moneda: en las tablas el encabezado ya la dice', () => {
    // Arrange
    const precio = 1500

    // Act
    const texto = formatPrecio(precio)

    // Assert
    expect(texto).to.equal('$1.500')
  })

  it.each([
    [12_500_000, '$12.5M COP'],
    [2_000_000, '$2M COP'],
    [450_000, '$450K COP'],
    [900, '$900 COP'],
  ])('formatCOPCorto(%i) → %s', (valor, esperado) => {
    // Arrange / Act
    const texto = formatCOPCorto(valor)

    // Assert
    expect(texto).to.equal(esperado)
  })

  it('formatFecha escribe el mes con palabras y devuelve vacío si la fecha no existe', () => {
    // Arrange
    const valida = '2026-10-12T12:00:00.000Z'

    // Act
    const texto = formatFecha(valida)

    // Assert
    expect(texto).to.contain('octubre').and.to.contain('2026')
    expect(formatFecha('no es una fecha')).to.equal('')
  })

  it('formatDiaCorto abrevia "2026-10-01" a "1 oct" y respeta lo que ya viene corto', () => {
    // Arrange
    const iso = '2026-10-01'

    // Act
    const abreviada = formatDiaCorto(iso)

    // Assert
    expect(abreviada).to.equal('1 oct')
    expect(formatDiaCorto('2026-01-15')).to.equal('15 ene')
    expect(formatDiaCorto('Lun')).to.equal('Lun')
  })
})

describe('estados de pedido — una sola tabla para todas las pantallas', () => {
  it('cada estado conocido trae etiqueta, paso del recorrido y una frase de ayuda', () => {
    // Arrange
    const estado = 'SHIPPED'

    // Act
    const info = infoEstado(estado)

    // Assert
    expect(info.etiqueta).to.equal('En camino')
    expect(info.paso).to.equal(3)
    expect(info.ayuda).to.contain('salió')
    expect(info.color).to.equal('var(--violet)')
  })

  it('un estado que el front no conoce se muestra tal cual llegó, sin romper', () => {
    // Arrange
    const raro = 'EN_ADUANA'

    // Act
    const info = infoEstado(raro)

    // Assert
    expect(info.etiqueta).to.equal('EN_ADUANA')
    expect(info.paso).to.equal(0)
  })

  it('el recorrido normal tiene 4 pasos y cancelado queda fuera de él', () => {
    // Arrange / Act
    const pasos = ORDEN_ESTADOS.map((e) => ESTADOS_PEDIDO[e].paso)

    // Assert
    expect(PASOS_PEDIDO).to.equal(4)
    expect(ORDEN_ESTADOS).to.have.lengthOf(5)
    expect(pasos).to.deep.equal([1, 2, 3, 4, 0])
  })
})

describe('busqueda — sugerencias cuando no hay resultados', () => {
  it('normalizar quita tildes, mayúsculas y espacios de sobra', () => {
    // Arrange
    const texto = '  ÁÉÍ   Ñandú '

    // Act
    const limpio = normalizar(texto)

    // Assert
    expect(limpio).to.equal('aei nandu')
  })

  it('distancia cuenta una transposición como un solo error', () => {
    // Arrange / Act
    const transpuesta = distancia('ihpone', 'iphone')
    const sustitucion = distancia('samsumg', 'samsung')

    // Assert
    expect(transpuesta).to.equal(1)
    expect(sustitucion).to.equal(1)
    expect(distancia('', 'abc')).to.equal(3)
    expect(distancia('igual', 'igual')).to.equal(0)
  })

  it('clave junta letras que suenan igual al leerlas en español', () => {
    // Arrange / Act
    const a = clave('ifone')
    const b = clave('iphone')

    // Assert
    expect(a).to.equal(b)
    expect(clave('galaksi')).to.equal(clave('galaxy'))
  })

  it.each([
    ['ifone', 'iphone'],
    ['samsumg', 'samsung'],
    ['galaksi', 'galaxy'],
    ['xiaomy', 'xiaomi'],
    ['motorla', 'motorola'],
    ['IFONE 15', 'iphone 15'],
  ])('"%s" se corrige a "%s"', (escrito, esperado) => {
    // Arrange
    const vocabulario = VOCABULARIO_BASE

    // Act
    const sugerencia = sugerir(escrito, vocabulario)

    // Assert
    expect(sugerencia).to.equal(esperado)
  })

  it.each([
    ['iphone', 'ya está bien escrita'],
    ['iphone 15', 'ya está bien escrita y el número no se adivina'],
    ['s24', 'un modelo con número no se toca'],
    ['xyzxyz', 'no se parece a nada'],
    ['ipo', 'una palabra de tres letras no se corrige'],
    ['', 'no hay nada escrito'],
    ['   ', 'solo espacios'],
  ])('"%s" no tiene sugerencia (%s)', (escrito) => {
    // Arrange
    const vocabulario = VOCABULARIO_BASE

    // Act
    const sugerencia = sugerir(escrito, vocabulario)

    // Assert
    expect(sugerencia).to.be.null
  })

  it('usa también las palabras de los equipos que ya llegaron del servidor', () => {
    // Arrange
    aprenderVocabulario(['Zenfone 11 Ultra'])

    // Act
    const sugerencia = sugerir('zenfon', vocabularioCompleto())

    // Assert
    expect(sugerencia).to.equal('zenfone')
  })

  it('palabrasDe se queda con las palabras útiles: sin números y de 3 letras o más', () => {
    // Arrange
    const nombre = 'Galaxy S24 Ultra 5G'

    // Act
    const palabras = palabrasDe(nombre)

    // Assert
    expect(palabras).to.deep.equal(['galaxy', 'ultra'])
  })

  it('el vocabulario aprendido se guarda en el navegador y no repite palabras', () => {
    // Arrange / Act
    aprenderVocabulario(['Redmi Note 13 Pro'])
    aprenderVocabulario(['Redmi Note 14'])

    // Assert
    expect(leerVocabulario()).to.deep.equal(['redmi', 'note', 'pro'])
    expect(vocabularioCompleto()).to.include.members([...VOCABULARIO_BASE, 'redmi'])
  })

  it('guarda como máximo 300 palabras aprendidas y descarta las más viejas', () => {
    // Arrange
    const nombres = Array.from({ length: 320 }, (_, i) => `modelo${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}x`)

    // Act
    aprenderVocabulario(nombres)

    // Assert
    const guardadas = leerVocabulario()
    expect(guardadas).to.have.lengthOf(300)
    expect(guardadas).to.include(normalizar(nombres[319]))
    expect(guardadas).to.not.include(normalizar(nombres[0]))
  })

  it('un vocabulario guardado con basura se ignora en lugar de romper la búsqueda', () => {
    // Arrange
    localStorage.setItem('cp_vocab', '{esto no es json')

    // Act
    const lista = leerVocabulario()

    // Assert
    expect(lista).to.deep.equal([])
    expect(vocabularioCompleto()).to.have.lengthOf(VOCABULARIO_BASE.length)
  })

  it('si lo guardado no es una lista de textos, descarta lo que no sirve', () => {
    // Arrange
    localStorage.setItem('cp_vocab', JSON.stringify(['pixel', 5, null, 'nokia']))

    // Act
    const lista = leerVocabulario()

    // Assert
    expect(lista).to.deep.equal(['pixel', 'nokia'])
  })
})

describe('borrador del pago — lo escrito no se pierde', () => {
  it('guarda los datos de entrega y los devuelve tal cual', () => {
    // Arrange
    const datos = { phone: '3001234567', address: 'Calle 10 # 43-25', city: 'Medellín', dept: 'Antioquia' }

    // Act
    guardarBorrador(datos)

    // Assert
    expect(leerBorrador()).to.deep.equal(datos)
    expect(localStorage.getItem('cp_checkout_draft')).to.be.a('string')
  })

  it('solo guarda los campos conocidos y solo si son texto', () => {
    // Arrange
    const sucio = { phone: '300', foo: 'x', city: 5 } as unknown as Parameters<typeof guardarBorrador>[0]

    // Act
    guardarBorrador(sucio)

    // Assert
    expect(leerBorrador()).to.deep.equal({ phone: '300' })
  })

  it('un borrador dañado se trata como vacío', () => {
    // Arrange
    localStorage.setItem('cp_checkout_draft', '[[[')

    // Act
    const borrador = leerBorrador()

    // Assert
    expect(borrador).to.deep.equal({})
  })

  it('un borrador que no es un objeto se trata como vacío', () => {
    // Arrange
    localStorage.setItem('cp_checkout_draft', JSON.stringify('texto'))

    // Act
    const borrador = leerBorrador()

    // Assert
    expect(borrador).to.deep.equal({})
  })

  it('borrarBorrador lo quita del navegador', () => {
    // Arrange
    guardarBorrador({ phone: '300' })

    // Act
    borrarBorrador()

    // Assert
    expect(localStorage.getItem('cp_checkout_draft')).to.be.null
    expect(leerBorrador()).to.deep.equal({})
  })

  it('tieneDatosDeEntrega ignora el nombre y el correo, que vienen de la cuenta', () => {
    // Arrange / Act / Assert
    expect(tieneDatosDeEntrega({ name: 'Ana', email: 'ana@gmail.com' })).to.equal(false)
    expect(tieneDatosDeEntrega({ city: 'Cali' })).to.equal(true)
    expect(tieneDatosDeEntrega({})).to.equal(false)
  })
})

describe('vistos recientemente', () => {
  const visto = (n: number): Visto => ({ slug: `equipo-${n}`, name: `Equipo ${n}`, price: 1000 * n, heroImage: null })

  it('el último equipo visto va primero y no se repite', () => {
    // Arrange
    registrarVisto(visto(1))
    registrarVisto(visto(2))

    // Act
    registrarVisto(visto(1))

    // Assert
    expect(leerVistos().map((v) => v.slug)).to.deep.equal(['equipo-1', 'equipo-2'])
  })

  it('recuerda como máximo 8 equipos', () => {
    // Arrange / Act
    for (let n = 1; n <= 10; n++) registrarVisto(visto(n))

    // Assert
    const slugs = leerVistos().map((v) => v.slug)
    expect(slugs).to.have.lengthOf(8)
    expect(slugs[0]).to.equal('equipo-10')
    expect(slugs).to.not.include('equipo-1')
  })

  it('descarta lo guardado que no tiene la forma de un equipo visto', () => {
    // Arrange
    localStorage.setItem('cp_vistos', JSON.stringify([visto(3), { slug: 4 }, 'texto', null]))

    // Act
    const lista = leerVistos()

    // Assert
    expect(lista).to.deep.equal([visto(3)])
  })

  it('borrarVistos limpia el historial', () => {
    // Arrange
    registrarVisto(visto(1))

    // Act
    borrarVistos()

    // Assert
    expect(leerVistos()).to.deep.equal([])
  })

  it('un historial dañado no rompe la ficha', () => {
    // Arrange
    localStorage.setItem('cp_vistos', 'no-json')

    // Act
    const lista = leerVistos()

    // Assert
    expect(lista).to.deep.equal([])
  })
})

describe('filtros activos del catálogo', () => {
  it('describe cada filtro puesto con las mismas palabras del panel y en su orden', () => {
    // Arrange
    const query: PhonesQuery = { search: 'ifone', condition: 'USED', brand: 'Apple', verified: true, maxPrice: 3_000_000 }

    // Act
    const activos = filtrosActivos(query)

    // Assert
    expect(activos.map((f) => f.etiqueta)).to.deep.equal([
      'Búsqueda: "ifone"',
      'Condición: Usados',
      'Marca: Apple (iPhone)',
      'Solo verificados',
      'Hasta $3.000.000 COP',
    ])
    expect(activos.map((f) => f.id)).to.deep.equal(['search', 'condition', 'brand', 'verified', 'maxPrice'])
  })

  it('cada filtro sabe cómo quitarse solo a sí mismo', () => {
    // Arrange
    const [busqueda, condicion] = filtrosActivos({ search: 'moto', condition: 'NEW' })

    // Act / Assert
    expect(busqueda.quitar).to.deep.equal({ search: undefined })
    expect(condicion.quitar).to.deep.equal({ condition: undefined })
  })

  it('sin filtros no hay etiquetas; con una categoría desconocida se muestra el valor tal cual', () => {
    // Arrange / Act / Assert
    expect(filtrosActivos({})).to.deep.equal([])
    expect(filtrosActivos({ category: 'otra' })[0].etiqueta).to.equal('Categoría: otra')
  })

  it('SIN_FILTROS vacía todo y vuelve a la página 1', () => {
    // Arrange / Act / Assert
    expect(SIN_FILTROS.page).to.equal(1)
    expect(Object.values({ ...SIN_FILTROS, page: undefined }).every((v) => v === undefined)).to.equal(true)
  })
})

describe('sesión — volver a donde se estaba', () => {
  it.each([
    ['/checkout', '/checkout'],
    ['/catalog?condition=USED', '/catalog?condition=USED'],
    ['/phones/galaxy-s24#colores', '/phones/galaxy-s24#colores'],
  ])('acepta la ruta interna %s', (ruta, esperada) => {
    // Arrange / Act
    const resultado = rutaSegura(ruta)

    // Assert
    expect(resultado).to.equal(esperada)
  })

  it.each([
    ['https://sitio-malo.com', 'dirección externa'],
    ['//sitio-malo.com', 'dirección sin protocolo'],
    ['/\\sitio-malo.com', 'barra invertida'],
    ['javascript:alert(1)', 'script'],
    ['/login', 'volver al login sería un círculo'],
    ['/login?x=1', 'el login con parámetros'],
    ['/register', 'el registro'],
    [42, 'no es texto'],
    [null, 'no hay ruta'],
  ])('rechaza %s (%s)', (ruta, _motivo) => {
    // Arrange / Act
    const resultado = rutaSegura(ruta)

    // Assert
    expect(resultado).to.be.null
  })

  it('rutaDesde arma la ruta completa con parámetros y ancla, y la valida', () => {
    // Arrange
    const from = { pathname: '/checkout', search: '?a=1', hash: '#pago' }

    // Act
    const ruta = rutaDesde(from)

    // Assert
    expect(ruta).to.equal('/checkout?a=1#pago')
    expect(rutaDesde({ pathname: '/login' })).to.be.null
    expect(rutaDesde({ pathname: 'https://externa.com' })).to.be.null
    expect(rutaDesde(null)).to.be.null
    expect(rutaDesde('texto')).to.be.null
  })

  it('recuerda dónde venció la sesión y se olvida al leerla una vez', () => {
    // Arrange
    marcarSesionVencida('/dashboard')

    // Act
    const dondeEstaba = leerSesionVencida()
    limpiarSesionVencida()

    // Assert
    expect(dondeEstaba).to.equal('/dashboard')
    expect(leerSesionVencida()).to.be.null
  })
})

describe('describirError — qué pasó y qué hacer', () => {
  function errorHttp(status: number | undefined, mensaje?: string) {
    const respuesta =
      status === undefined
        ? undefined
        : ({ status, statusText: '', headers: {}, config: {}, data: mensaje ? { error: mensaje } : {} } as AxiosResponse)
    return new AxiosError('fallo', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta)
  }

  it('sin error no hay nada que describir', () => {
    // Arrange / Act / Assert
    expect(describirError(null)).to.be.null
  })

  it('un error común conserva su mensaje y no sugiere reintentar', () => {
    // Arrange
    const error = new Error('algo salió mal')

    // Act
    const descripcion = describirError(error)

    // Assert
    expect(descripcion).to.deep.equal({ mensaje: 'algo salió mal', reintentable: false })
  })

  it('sin respuesta del servidor pide revisar la conexión y deja una referencia', () => {
    // Arrange
    const error = errorHttp(undefined)

    // Act
    const descripcion = describirError(error)

    // Assert
    expect(descripcion?.reintentable).to.equal(true)
    expect(descripcion?.codigo).to.equal('SIN-RED')
    expect(descripcion?.pista).to.contain('conexión')
    expect(descripcion?.mensaje).to.equal('Error de conexión con el servidor')
  })

  it('un fallo del servidor (5xx) aclara que no es culpa de la persona', () => {
    // Arrange
    const error = errorHttp(503)

    // Act
    const descripcion = describirError(error)

    // Assert
    expect(descripcion?.reintentable).to.equal(true)
    expect(descripcion?.codigo).to.equal('HTTP 503')
    expect(descripcion?.pista).to.contain('nuestro lado')
  })

  it('el mensaje que redactó el servidor manda sobre el genérico', () => {
    // Arrange
    const error = errorHttp(409, 'El email ya está registrado')

    // Act
    const descripcion = describirError(error)

    // Assert
    expect(descripcion).to.deep.equal({ mensaje: 'El email ya está registrado', reintentable: false })
  })

  it.each([
    [401, 'sesión', false],
    [403, 'permiso', false],
    [429, 'Espera', true],
  ])('el código %i trae una pista que habla de "%s" (reintentable: %s)', (status, palabra, reintentable) => {
    // Arrange
    const error = errorHttp(status, 'mensaje del servidor')

    // Act
    const descripcion = describirError(error)

    // Assert
    expect(descripcion?.pista).to.contain(palabra)
    expect(descripcion?.reintentable).to.equal(reintentable)
  })
})
