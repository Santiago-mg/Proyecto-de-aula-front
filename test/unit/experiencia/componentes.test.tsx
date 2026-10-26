import { useRef, useState } from 'react'
import { expect } from 'chai'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, vi } from 'vitest'
import { Aviso } from '../../../src/components/ui/Aviso'
import { BotonMostrar } from '../../../src/components/ui/BotonMostrar'
import { Breadcrumbs } from '../../../src/components/ui/Breadcrumbs'
import { Campo } from '../../../src/components/ui/Campo'
import { ConfirmDialog, useConfirmacion } from '../../../src/components/ui/ConfirmDialog'
import { ConnectionBanner } from '../../../src/components/ui/ConnectionBanner'
import { EmptyState } from '../../../src/components/ui/EmptyState'
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage'
import { ErrorState } from '../../../src/components/ui/ErrorState'
import { HelpTip } from '../../../src/components/ui/HelpTip'
import { OnboardingTip, reabrirGuia } from '../../../src/components/ui/OnboardingTip'
import { Pagination } from '../../../src/components/ui/Pagination'
import { SkipLink } from '../../../src/components/ui/SkipLink'
import { ToastProvider, useToast, useToastOpcional } from '../../../src/context/ToastContext'
import { TITULO_BASE, useDocumentTitle } from '../../../src/hooks/useDocumentTitle'
import { useFocusTrap } from '../../../src/hooks/useFocusTrap'

// Componentes y hooks que se agregaron para subir las heurísticas de Nielsen:
// ayuda contextual (10), prevención y recuperación de errores (5 y 9), estado
// del sistema (1), control del usuario (3) y accesibilidad por teclado.

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.style.overflow = ''
  document.title = ''
})

function errorHttp(status: number) {
  const respuesta = { status, statusText: '', headers: {}, config: {}, data: {} } as AxiosResponse
  return new AxiosError('fallo', AxiosError.ERR_BAD_RESPONSE, undefined, undefined, respuesta)
}

describe('HelpTip — ayuda junto al dato que genera la duda', () => {
  it('empieza cerrado y el botón se anuncia como "Más información"', () => {
    // Arrange / Act
    render(<HelpTip>Es el estado real de la batería.</HelpTip>)

    // Assert
    const boton = screen.getByRole('button', { name: 'Más información' })
    expect(boton.getAttribute('aria-expanded')).to.equal('false')
    expect(screen.queryByRole('note')).to.be.null
  })

  it('al hacer clic muestra la explicación y la enlaza con el botón', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<HelpTip>Es el estado real de la batería.</HelpTip>)
    const boton = screen.getByRole('button', { name: 'Más información' })

    // Act
    await user.click(boton)

    // Assert
    const nota = screen.getByRole('note')
    expect(boton.getAttribute('aria-expanded')).to.equal('true')
    expect(boton.getAttribute('aria-controls')).to.equal(nota.id)
    expect(nota.textContent).to.equal('Es el estado real de la batería.')
  })

  it('se abre con el teclado y otro Enter lo vuelve a cerrar', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<HelpTip>Explicación</HelpTip>)
    screen.getByRole('button', { name: 'Más información' }).focus()

    // Act
    await user.keyboard('{Enter}')
    const abierto = screen.queryByRole('note') !== null
    await user.keyboard('{Enter}')

    // Assert
    expect(abierto).to.equal(true)
    expect(screen.queryByRole('note')).to.be.null
  })

  it('Escape lo cierra', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<HelpTip>Explicación</HelpTip>)
    await user.click(screen.getByRole('button', { name: 'Más información' }))

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(screen.queryByRole('note')).to.be.null
  })

  it('un clic fuera lo cierra, pero un clic dentro de la explicación no', async () => {
    // Arrange
    const user = userEvent.setup()
    render(
      <div>
        <p>Otra parte de la página</p>
        <HelpTip>Explicación</HelpTip>
      </div>,
    )
    await user.click(screen.getByRole('button', { name: 'Más información' }))

    // Act
    await user.click(screen.getByRole('note'))
    const siguioAbierto = screen.queryByRole('note') !== null
    await user.click(screen.getByText('Otra parte de la página'))

    // Assert
    expect(siguioAbierto).to.equal(true)
    expect(screen.queryByRole('note')).to.be.null
  })

  it('con etiqueta visible el botón se llama como ella y no necesita aria-label', () => {
    // Arrange / Act
    render(<HelpTip etiqueta="¿Qué es la salud de batería?">Explicación</HelpTip>)

    // Assert
    const boton = screen.getByRole('button', { name: '¿Qué es la salud de batería?' })
    expect(boton.hasAttribute('aria-label')).to.equal(false)
    expect(boton.className).to.contain('con-texto')
  })
})

describe('ConfirmDialog — preguntar antes de lo que no se puede deshacer', () => {
  function montar(propiedades: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
    const onConfirmar = vi.fn()
    const onCancelar = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        titulo="¿Eliminar el equipo?"
        mensaje="Se borra del catálogo y no se puede recuperar."
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
        {...propiedades}
      />,
    )
    return { user, onConfirmar, onCancelar }
  }

  it('es un alertdialog con el título y el mensaje enlazados para el lector de pantalla', () => {
    // Arrange / Act
    montar()

    // Assert
    const dialogo = screen.getByRole('alertdialog', { name: '¿Eliminar el equipo?' })
    expect(dialogo.getAttribute('aria-modal')).to.equal('true')
    const idMensaje = dialogo.getAttribute('aria-describedby') as string
    expect(document.getElementById(idMensaje)?.textContent).to.equal('Se borra del catálogo y no se puede recuperar.')
  })

  it('si la acción es peligrosa el foco empieza en la salida segura y el botón es rojo', () => {
    // Arrange / Act
    montar({ peligro: true, confirmar: 'Sí, eliminar' })

    // Assert
    expect(document.activeElement).to.equal(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('button', { name: 'Sí, eliminar' }).className).to.contain('cp-btn-danger')
  })

  it('si no es peligrosa, confirmar es el botón principal', () => {
    // Arrange / Act
    montar({ confirmar: 'Continuar', cancelar: 'Volver' })

    // Assert
    expect(screen.getByRole('button', { name: 'Continuar' }).className).to.contain('cp-btn-primary')
    expect(screen.getByRole('button', { name: 'Volver' })).to.exist
  })

  it('confirmar y cancelar avisan cada uno por su lado', async () => {
    // Arrange
    const { user, onConfirmar, onCancelar } = montar()

    // Act
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    // Assert
    expect(onConfirmar.mock.calls).to.have.lengthOf(1)
    expect(onCancelar.mock.calls).to.have.lengthOf(1)
  })

  it('Escape cancela', async () => {
    // Arrange
    const { user, onConfirmar, onCancelar } = montar()

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(onCancelar.mock.calls).to.have.lengthOf(1)
    expect(onConfirmar.mock.calls).to.have.lengthOf(0)
  })

  it('un clic en el fondo cancela; un clic dentro del cuadro no', async () => {
    // Arrange
    const { user, onCancelar } = montar()

    // Act
    await user.click(screen.getByRole('alertdialog'))
    const clicDentro = onCancelar.mock.calls.length
    await user.click(document.querySelector('.cp-modal-overlay') as HTMLElement)

    // Assert
    expect(clicDentro).to.equal(0)
    expect(onCancelar.mock.calls).to.have.lengthOf(1)
  })

  it('Tab no sale del diálogo: del último botón vuelve al primero y Shift+Tab al revés', async () => {
    // Arrange
    const { user } = montar()
    const cancelar = screen.getByRole('button', { name: 'Cancelar' })
    const confirmar = screen.getByRole('button', { name: 'Confirmar' })

    // Act
    await user.tab()
    const alAvanzar = document.activeElement
    await user.tab()
    const alDarLaVuelta = document.activeElement
    await user.tab({ shift: true })
    const alRetroceder = document.activeElement

    // Assert
    expect(alAvanzar).to.equal(confirmar)
    expect(alDarLaVuelta).to.equal(cancelar)
    expect(alRetroceder).to.equal(confirmar)
  })

  it('mientras está abierto la página de atrás no se desplaza', () => {
    // Arrange / Act
    const { unmount } = render(
      <ConfirmDialog titulo="¿Seguro?" mensaje="Mensaje" onConfirmar={() => undefined} onCancelar={() => undefined} />,
    )
    const abierto = document.body.style.overflow
    unmount()

    // Assert
    expect(abierto).to.equal('hidden')
    expect(document.body.style.overflow).to.equal('')
  })
})

describe('useConfirmacion — pedir confirmación desde un manejador de eventos', () => {
  function Pantalla({ alResolver }: Readonly<{ alResolver(valor: boolean): void }>) {
    const { pedir, dialogo } = useConfirmacion()
    return (
      <>
        <button
          type="button"
          onClick={async () => {
            alResolver(await pedir({ titulo: '¿Vaciar el carrito?', mensaje: 'Se quitan todos los equipos.', peligro: true }))
          }}
        >
          Vaciar
        </button>
        {dialogo}
      </>
    )
  }

  it('confirmar resuelve true y cierra el diálogo', async () => {
    // Arrange
    const user = userEvent.setup()
    const respuestas: boolean[] = []
    render(<Pantalla alResolver={(v) => respuestas.push(v)} />)
    await user.click(screen.getByRole('button', { name: 'Vaciar' }))

    // Act
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    // Assert
    expect(respuestas).to.deep.equal([true])
    expect(screen.queryByRole('alertdialog')).to.be.null
  })

  it('cancelar resuelve false', async () => {
    // Arrange
    const user = userEvent.setup()
    const respuestas: boolean[] = []
    render(<Pantalla alResolver={(v) => respuestas.push(v)} />)
    await user.click(screen.getByRole('button', { name: 'Vaciar' }))

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    // Assert
    expect(respuestas).to.deep.equal([false])
  })

  it('al cerrar con Escape el foco regresa al botón que abrió la pregunta', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Pantalla alResolver={() => undefined} />)
    const origen = screen.getByRole('button', { name: 'Vaciar' })
    await user.click(origen)

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(screen.queryByRole('alertdialog')).to.be.null
    expect(document.activeElement).to.equal(origen)
  })
})

describe('useFocusTrap', () => {
  function Caja({ activo, sinEnfocables = false, bloquearScroll }: Readonly<{ activo: boolean; sinEnfocables?: boolean; bloquearScroll?: boolean }>) {
    const ref = useRef<HTMLDivElement>(null)
    useFocusTrap(ref, activo, { bloquearScroll })
    return (
      <>
        <button type="button">Fuera</button>
        <div ref={ref} tabIndex={-1} data-testid="caja">
          {sinEnfocables ? (
            <p>Solo texto</p>
          ) : (
            <>
              <button type="button">Uno</button>
              <button type="button" hidden>
                Oculto
              </button>
              <button type="button" disabled>
                Apagado
              </button>
              <button type="button">Dos</button>
            </>
          )}
        </div>
      </>
    )
  }

  it('lleva el foco al primer elemento enfocable y salta los ocultos y los deshabilitados', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    render(<Caja activo />)
    const alAbrir = document.activeElement
    await user.tab()

    // Assert
    expect(alAbrir).to.equal(screen.getByRole('button', { name: 'Uno' }))
    expect(document.activeElement).to.equal(screen.getByRole('button', { name: 'Dos' }))
  })

  it('si dentro no hay nada enfocable, el foco se queda en la caja', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    render(<Caja activo sinEnfocables />)
    await user.tab()

    // Assert
    expect(document.activeElement).to.equal(screen.getByTestId('caja'))
  })

  it('inactivo no toca el foco ni el scroll', () => {
    // Arrange / Act
    render(<Caja activo={false} />)

    // Assert
    expect(document.activeElement).to.equal(document.body)
    expect(document.body.style.overflow).to.equal('')
  })

  it('con bloquearScroll en falso deja desplazar la página de atrás', () => {
    // Arrange / Act
    render(<Caja activo bloquearScroll={false} />)

    // Assert
    expect(document.body.style.overflow).to.equal('')
  })

  it('al desactivarse devuelve el foco a donde estaba', () => {
    // Arrange
    const { rerender } = render(<Caja activo={false} />)
    const fuera = screen.getByRole('button', { name: 'Fuera' })
    fuera.focus()

    // Act
    rerender(<Caja activo />)
    const adentro = document.activeElement
    rerender(<Caja activo={false} />)

    // Assert
    expect(adentro).to.equal(screen.getByRole('button', { name: 'Uno' }))
    expect(document.activeElement).to.equal(fuera)
  })
})

describe('Toast — avisos que no estorban', () => {
  function Disparador({ mensaje = 'Guardado', opciones }: Readonly<{ mensaje?: string; opciones?: Parameters<ReturnType<typeof useToast>['showToast']>[1] }>) {
    const { showToast } = useToast()
    const [n, setN] = useState(0)
    return (
      <button
        type="button"
        onClick={() => {
          setN((v) => v + 1)
          showToast(n === 0 ? mensaje : `${mensaje} ${n + 1}`, opciones)
        }}
      >
        Avisar
      </button>
    )
  }

  function montar(propiedades: Parameters<typeof Disparador>[0] = {}) {
    render(
      <ToastProvider>
        <Disparador {...propiedades} />
      </ToastProvider>,
    )
    return () => fireEvent.click(screen.getByRole('button', { name: 'Avisar' }))
  }

  const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

  it('la región de avisos existe desde el principio, con aria-live, para que se anuncien los nuevos', () => {
    // Arrange / Act
    montar()

    // Assert
    const region = document.querySelector('.cp-toasts') as HTMLElement
    expect(region.getAttribute('aria-live')).to.equal('polite')
    expect(region.children).to.have.lengthOf(0)
  })

  it('un aviso normal se va solo a los 2,8 segundos', () => {
    // Arrange
    vi.useFakeTimers()
    const avisar = montar()

    // Act
    avisar()
    const apareceAlInstante = screen.queryByText('Guardado') !== null
    pasar(2799)
    const aunVisible = screen.queryByText('Guardado') !== null
    pasar(1)

    // Assert
    expect(apareceAlInstante).to.equal(true)
    expect(aunVisible).to.equal(true)
    expect(screen.queryByText('Guardado')).to.be.null
  })

  it('un aviso con botón dura 7 segundos para dar tiempo de decidir', () => {
    // Arrange
    vi.useFakeTimers()
    const avisar = montar({ opciones: { accion: { etiqueta: 'Deshacer', onClick: () => undefined } } })

    // Act
    avisar()
    pasar(6999)
    const aunVisible = screen.queryByText('Guardado') !== null
    pasar(1)

    // Assert
    expect(aunVisible).to.equal(true)
    expect(screen.queryByText('Guardado')).to.be.null
  })

  it('el botón del aviso ejecuta su acción y lo cierra', () => {
    // Arrange
    const alDeshacer = vi.fn()
    const avisar = montar({ opciones: { accion: { etiqueta: 'Deshacer', onClick: alDeshacer } } })
    avisar()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))

    // Assert
    expect(alDeshacer.mock.calls).to.have.lengthOf(1)
    expect(screen.queryByText('Guardado')).to.be.null
  })

  it('"Cerrar aviso" lo quita antes de tiempo', () => {
    // Arrange
    const avisar = montar()
    avisar()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))

    // Assert
    expect(screen.queryByText('Guardado')).to.be.null
  })

  it('se ven como máximo 3: cuando llega otro, se va el más viejo', () => {
    // Arrange
    const avisar = montar({ mensaje: 'Aviso' })

    // Act
    for (let i = 0; i < 4; i++) avisar()

    // Assert
    const textos = [...document.querySelectorAll('.cp-toast-msg')].map((el) => el.textContent)
    expect(textos).to.deep.equal(['Aviso 2', 'Aviso 3', 'Aviso 4'])
  })

  it('un aviso de error dice "Error:" para quien no distingue el color', () => {
    // Arrange
    const avisar = montar({ mensaje: 'No se pudo guardar', opciones: { tono: 'error' } })

    // Act
    avisar()

    // Assert
    const aviso = document.querySelector('.cp-toast') as HTMLElement
    expect(aviso.className).to.contain('cp-toast-error')
    expect(within(aviso).getByText('Error:', { exact: false }).className).to.contain('cp-sr-only')
  })

  it('con el cursor encima el reloj se detiene y al salir quedan al menos 1,5 segundos', () => {
    // Arrange
    vi.useFakeTimers()
    const avisar = montar()
    avisar()
    const aviso = document.querySelector('.cp-toast') as HTMLElement

    // Act
    pasar(2000)
    fireEvent.mouseEnter(aviso)
    pasar(20_000)
    const sigueAhi = screen.queryByText('Guardado') !== null
    fireEvent.mouseLeave(aviso)
    pasar(1499)
    const aunQuedaUnPoco = screen.queryByText('Guardado') !== null
    pasar(1)

    // Assert
    expect(sigueAhi).to.equal(true)
    expect(aunQuedaUnPoco).to.equal(true)
    expect(screen.queryByText('Guardado')).to.be.null
  })

  it('con el foco dentro del aviso (teclado) también se detiene', () => {
    // Arrange
    vi.useFakeTimers()
    const avisar = montar({ opciones: { accion: { etiqueta: 'Deshacer', onClick: () => undefined } } })
    avisar()
    const boton = screen.getByRole('button', { name: 'Deshacer' })

    // Act
    pasar(1000)
    fireEvent.focus(boton)
    pasar(30_000)
    const sigueAhi = screen.queryByText('Guardado') !== null
    fireEvent.blur(boton)
    pasar(6000)

    // Assert
    expect(sigueAhi).to.equal(true)
    expect(screen.queryByText('Guardado')).to.be.null
  })

  it('showToast devuelve el id y descartar lo quita', () => {
    // Arrange
    let descartarAviso: (id: number) => void = () => undefined
    let idAviso = -1
    function Panel() {
      const { showToast, descartar } = useToast()
      descartarAviso = descartar
      return (
        <button type="button" onClick={() => (idAviso = showToast('Listo'))}>
          Avisar
        </button>
      )
    }
    render(
      <ToastProvider>
        <Panel />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avisar' }))

    // Act
    act(() => descartarAviso(idAviso))

    // Assert
    expect(idAviso).to.be.greaterThan(0)
    expect(screen.queryByText('Listo')).to.be.null
  })

  it('useToast avisa con claridad si se usa fuera del proveedor', () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function SinProveedor() {
      useToast()
      return null
    }

    // Act / Assert
    expect(() => render(<SinProveedor />)).to.throw('useToast debe usarse dentro de ToastProvider')
  })

  it('useToastOpcional no rompe fuera del proveedor: el aviso simplemente no sale', () => {
    // Arrange
    let id = -1
    function SinProveedor() {
      const { showToast } = useToastOpcional()
      return (
        <button type="button" onClick={() => (id = showToast('Hola'))}>
          Avisar
        </button>
      )
    }
    render(<SinProveedor />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Avisar' }))

    // Assert
    expect(id).to.equal(0)
    expect(screen.queryByText('Hola')).to.be.null
  })
})

describe('ErrorMessage — qué pasó y qué hacer', () => {
  it('ofrece "Reintentar" cuando la pantalla sabe cómo volver a intentarlo', async () => {
    // Arrange
    const user = userEvent.setup()
    const reintentar = vi.fn()
    render(<ErrorMessage error={errorHttp(503)} onReintentar={reintentar} />)

    // Act
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // Assert
    expect(reintentar.mock.calls).to.have.lengthOf(1)
  })

  it('sin función para reintentar no hay botón', () => {
    // Arrange / Act
    render(<ErrorMessage error={errorHttp(503)} />)

    // Assert
    expect(screen.queryByRole('button', { name: 'Reintentar' })).to.be.null
  })

  it('deja una referencia para soporte con el código del fallo', () => {
    // Arrange / Act
    render(<ErrorMessage error={errorHttp(503)} />)

    // Assert
    expect(screen.getByText('Referencia para soporte: HTTP 503')).to.exist
  })

  it('la pista que da la pantalla gana sobre la genérica', () => {
    // Arrange / Act
    render(<ErrorMessage error={errorHttp(503)} pista="Guarda tu carrito y vuelve en unos minutos." />)

    // Assert
    expect(screen.getByText('Guarda tu carrito y vuelve en unos minutos.')).to.exist
    expect(screen.queryByText(/nuestro lado/)).to.be.null
  })

  it('sin error deja la región de alerta vacía, lista para anunciar el siguiente', () => {
    // Arrange / Act
    render(<ErrorMessage error={null} />)

    // Assert
    const alerta = screen.getByRole('alert')
    expect(alerta.textContent).to.equal('')
  })
})

describe('ErrorState — error de una sección completa', () => {
  it('dice qué no se pudo hacer y propone qué probar', () => {
    // Arrange / Act
    render(<ErrorState titulo="No se pudo cargar el catálogo" />)

    // Assert
    expect(screen.getByRole('alert')).to.exist
    expect(screen.getByRole('heading', { level: 2, name: 'No se pudo cargar el catálogo' })).to.exist
    expect(screen.getByText(/Inténtalo de nuevo/)).to.exist
  })

  it('usa el detalle de la pantalla cuando el error no trae pista propia', () => {
    // Arrange / Act
    render(<ErrorState titulo="No se pudo cargar" error={new Error('x')} detalle="Revisa los filtros e inténtalo otra vez." />)

    // Assert
    expect(screen.getByText('Revisa los filtros e inténtalo otra vez.')).to.exist
  })

  it('si el error trae pista, esa manda; y se muestra el código para soporte', () => {
    // Arrange / Act
    render(<ErrorState titulo="No se pudo cargar" error={errorHttp(500)} detalle="Detalle de la pantalla" />)

    // Assert
    expect(screen.getByText(/nuestro lado/)).to.exist
    expect(screen.queryByText('Detalle de la pantalla')).to.be.null
    expect(screen.getByText('Referencia para soporte: HTTP 500')).to.exist
  })

  it('siempre deja una salida: reintentar y las acciones extra', async () => {
    // Arrange
    const user = userEvent.setup()
    const reintentar = vi.fn()
    render(<ErrorState titulo="No se pudo cargar" onReintentar={reintentar} acciones={<a href="/catalog">Ver todo el catálogo</a>} />)

    // Act
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // Assert
    expect(reintentar.mock.calls).to.have.lengthOf(1)
    expect(screen.getByRole('link', { name: 'Ver todo el catálogo' })).to.exist
  })

  it('sin reintento ni acciones no dibuja botones vacíos', () => {
    // Arrange / Act
    const { container } = render(<ErrorState titulo="No se pudo cargar" />)

    // Assert
    expect(container.querySelector('.cp-empty-actions')).to.be.null
  })
})

describe('EmptyState — pantalla sin nada que mostrar', () => {
  it('por defecto el título es un párrafo, para no ensuciar la jerarquía de encabezados', () => {
    // Arrange / Act
    render(<EmptyState titulo="Tu carrito está vacío" />)

    // Assert
    expect(screen.queryByRole('heading')).to.be.null
    expect(screen.getByText('Tu carrito está vacío').tagName).to.equal('P')
  })

  it('cuando es lo único de la pantalla se escribe como encabezado del nivel pedido', () => {
    // Arrange / Act
    render(<EmptyState titulo="Sin pedidos todavía" nivel={1} />)

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Sin pedidos todavía' })).to.exist
  })

  it('el icono es decorativo y las acciones dejan una salida', () => {
    // Arrange / Act
    render(
      <EmptyState titulo="Nada por aquí" icono={<svg data-testid="icono" />} acciones={<a href="/catalog">Ir al catálogo</a>}>
        Prueba con otro filtro.
      </EmptyState>,
    )

    // Assert
    expect((screen.getByTestId('icono').parentElement as HTMLElement).getAttribute('aria-hidden')).to.equal('true')
    expect(screen.getByText('Prueba con otro filtro.')).to.exist
    expect(screen.getByRole('link', { name: 'Ir al catálogo' })).to.exist
  })
})

describe('Breadcrumbs — dónde estoy y cómo subir', () => {
  const migas = [{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Catálogo', to: '/catalog' }, { etiqueta: 'iPhone 15' }]

  it('muestra el camino con enlaces y marca la página actual', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <Breadcrumbs migas={migas} />
      </MemoryRouter>,
    )

    // Assert
    const nav = screen.getByRole('navigation', { name: 'Ruta de navegación' })
    expect(within(nav).getByRole('link', { name: 'Inicio' }).getAttribute('href')).to.equal('/')
    expect(within(nav).getByRole('link', { name: 'Catálogo' }).getAttribute('href')).to.equal('/catalog')
    const actual = within(nav).getByText('iPhone 15')
    expect(actual.getAttribute('aria-current')).to.equal('page')
    expect(within(nav).queryByRole('link', { name: 'iPhone 15' })).to.be.null
  })

  it('la última miga nunca es un enlace aunque traiga destino', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <Breadcrumbs migas={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Aquí', to: '/aqui' }]} />
      </MemoryRouter>,
    )

    // Assert
    expect(screen.queryByRole('link', { name: 'Aquí' })).to.be.null
    expect(screen.getByText('Aquí').getAttribute('aria-current')).to.equal('page')
  })

  it('una miga intermedia sin destino queda como texto', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <Breadcrumbs migas={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Sección' }, { etiqueta: 'Detalle' }]} />
      </MemoryRouter>,
    )

    // Assert
    const seccion = screen.getByText('Sección')
    expect(seccion.tagName).to.equal('SPAN')
    expect(seccion.hasAttribute('aria-current')).to.equal(false)
  })
})

describe('Pagination', () => {
  it('con una sola página no se dibuja', () => {
    // Arrange / Act
    const { container } = render(<Pagination page={1} totalPages={1} onPage={() => undefined} />)

    // Assert
    expect(container.firstChild).to.be.null
  })

  it('dice en qué página está, también para el lector de pantalla, y se nombra según la lista', () => {
    // Arrange / Act
    render(<Pagination page={2} totalPages={5} onPage={() => undefined} etiqueta="Páginas de pedidos" />)

    // Assert
    const nav = screen.getByRole('navigation', { name: 'Páginas de pedidos' })
    expect(nav.textContent).to.contain('Página 2 / 5')
  })

  it('en la primera página no se puede retroceder y en la última no se puede avanzar', () => {
    // Arrange / Act
    const { rerender } = render(<Pagination page={1} totalPages={3} onPage={() => undefined} />)
    const anteriorEnPrimera = (screen.getByRole('button', { name: '← Anterior' }) as HTMLButtonElement).disabled
    rerender(<Pagination page={3} totalPages={3} onPage={() => undefined} />)

    // Assert
    expect(anteriorEnPrimera).to.equal(true)
    expect((screen.getByRole('button', { name: 'Siguiente →' }) as HTMLButtonElement).disabled).to.equal(true)
    expect((screen.getByRole('button', { name: '← Anterior' }) as HTMLButtonElement).disabled).to.equal(false)
  })

  it('pide la página vecina', async () => {
    // Arrange
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<Pagination page={2} totalPages={4} onPage={alCambiar} />)

    // Act
    await user.click(screen.getByRole('button', { name: 'Siguiente →' }))
    await user.click(screen.getByRole('button', { name: '← Anterior' }))

    // Assert
    expect(alCambiar.mock.calls.map((c) => c[0])).to.deep.equal([3, 1])
  })
})

describe('ConnectionBanner — estado de la conexión', () => {
  it('con internet no muestra nada, pero la región de anuncios ya existe', () => {
    // Arrange / Act
    const { container } = render(<ConnectionBanner />)

    // Assert
    expect(container.querySelector('.cp-connection-banner')).to.be.null
    expect(container.querySelector('[aria-live="polite"]')).to.exist
  })

  it('avisa al perder la conexión y desaparece al recuperarla', () => {
    // Arrange
    const { container } = render(<ConnectionBanner />)

    // Act
    act(() => void window.dispatchEvent(new Event('offline')))
    const alPerder = container.querySelector('.cp-connection-banner')?.textContent
    act(() => void window.dispatchEvent(new Event('online')))

    // Assert
    expect(alPerder).to.contain('Sin conexión a internet')
    expect(container.querySelector('.cp-connection-banner')).to.be.null
  })

  it('si la página ya abre sin internet, avisa desde el primer momento', () => {
    // Arrange
    vi.spyOn(globalThis.navigator, 'onLine', 'get').mockReturnValue(false)

    // Act
    const { container } = render(<ConnectionBanner />)

    // Assert
    expect(container.querySelector('.cp-connection-banner')).to.exist
  })

  it('el mensaje se puede cambiar según la pantalla', () => {
    // Arrange
    render(<ConnectionBanner mensaje="Sin conexión: los cambios del panel no se guardarán." />)

    // Act
    act(() => void window.dispatchEvent(new Event('offline')))

    // Assert
    expect(screen.getByText('Sin conexión: los cambios del panel no se guardarán.')).to.exist
  })
})

describe('OnboardingTip — guía de primera visita', () => {
  function montar() {
    const user = userEvent.setup()
    const vista = render(
      <MemoryRouter>
        <OnboardingTip />
      </MemoryRouter>,
    )
    return { user, ...vista }
  }

  it('aparece en la primera visita, con salida a la ayuda', () => {
    // Arrange / Act
    montar()

    // Assert
    expect(screen.getByRole('heading', { name: '¿Primera vez por aquí?' })).to.exist
    expect(screen.getByRole('link', { name: 'Ver la ayuda' }).getAttribute('href')).to.equal('/ayuda')
  })

  it('"Entendido" la cierra y no vuelve a aparecer en las siguientes visitas', async () => {
    // Arrange
    const { user, unmount } = montar()

    // Act
    await user.click(screen.getByRole('button', { name: 'Entendido' }))
    const alCerrar = screen.queryByRole('heading', { name: '¿Primera vez por aquí?' })
    unmount()
    montar()

    // Assert
    expect(alCerrar).to.be.null
    expect(localStorage.getItem('cp_onboarding_done')).to.equal('1')
    expect(screen.queryByRole('heading', { name: '¿Primera vez por aquí?' })).to.be.null
  })

  it('reabrirGuia la hace volver (se usa desde el centro de ayuda)', () => {
    // Arrange
    localStorage.setItem('cp_onboarding_done', '1')

    // Act
    reabrirGuia()
    montar()

    // Assert
    expect(localStorage.getItem('cp_onboarding_done')).to.be.null
    expect(screen.getByRole('heading', { name: '¿Primera vez por aquí?' })).to.exist
  })

  it('si el navegador no deja guardar, no insiste con la guía', () => {
    // Arrange
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('sin almacenamiento')
    })

    // Act
    montar()

    // Assert
    expect(screen.queryByRole('heading', { name: '¿Primera vez por aquí?' })).to.be.null
  })
})

describe('SkipLink — saltar al contenido', () => {
  it('lleva el foco al contenido principal sin ensuciar la URL ni el historial', async () => {
    // Arrange
    const user = userEvent.setup()
    render(
      <>
        <SkipLink />
        <nav>
          <a href="/">Inicio</a>
        </nav>
        <main id="contenido" tabIndex={-1}>
          Contenido
        </main>
      </>,
    )

    // Act
    await user.click(screen.getByRole('link', { name: 'Saltar al contenido' }))

    // Assert
    expect(document.activeElement).to.equal(document.getElementById('contenido'))
    expect(globalThis.location.hash).to.equal('')
  })

  it('es lo primero que alcanza quien navega con Tab', async () => {
    // Arrange
    const user = userEvent.setup()
    render(
      <>
        <SkipLink />
        <a href="/">Inicio</a>
        <main id="contenido" tabIndex={-1} />
      </>,
    )

    // Act
    await user.tab()

    // Assert
    expect(document.activeElement).to.equal(screen.getByRole('link', { name: 'Saltar al contenido' }))
  })

  it('si la página no tiene #contenido, no falla', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<SkipLink />)

    // Act
    await user.click(screen.getByRole('link', { name: 'Saltar al contenido' }))

    // Assert
    expect(globalThis.location.hash).to.equal('')
  })
})

describe('useDocumentTitle — cada pantalla con su título', () => {
  function Pantalla({ titulo }: Readonly<{ titulo?: string | null }>) {
    useDocumentTitle(titulo)
    return null
  }

  it('escribe "Título · CelularPro"', () => {
    // Arrange / Act
    render(<Pantalla titulo="Catálogo" />)

    // Assert
    expect(document.title).to.equal('Catálogo · CelularPro')
  })

  it('sin título vuelve al nombre general de la tienda', () => {
    // Arrange / Act
    render(<Pantalla />)

    // Assert
    expect(document.title).to.equal(TITULO_BASE)
    expect(TITULO_BASE).to.equal('CelularPro — Celulares certificados')
  })

  it('sigue al texto cuando cambia y también cuando se vacía', () => {
    // Arrange
    const { rerender } = render(<Pantalla titulo="Galaxy S24" />)

    // Act
    rerender(<Pantalla titulo="Tu carrito" />)
    const cambiado = document.title
    rerender(<Pantalla titulo={null} />)

    // Assert
    expect(cambiado).to.equal('Tu carrito · CelularPro')
    expect(document.title).to.equal(TITULO_BASE)
  })
})

describe('Aviso — mensaje que se queda en la página', () => {
  it('es un status con icono y texto: no depende solo del color', () => {
    // Arrange / Act
    const { container } = render(<Aviso tono="warn">Tu sesión venció.</Aviso>)

    // Assert
    const aviso = screen.getByRole('status')
    expect(aviso.className).to.contain('cp-notice-warn')
    expect(aviso.textContent).to.equal('Tu sesión venció.')
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).to.equal('true')
  })

  it('por defecto es informativo y puede traer acciones', () => {
    // Arrange / Act
    render(<Aviso acciones={<button type="button">Borrar borrador</button>}>Recuperamos tus datos.</Aviso>)

    // Assert
    expect(screen.getByRole('status').className).to.contain('cp-notice-info')
    expect(screen.getByRole('button', { name: 'Borrar borrador' })).to.exist
  })
})

describe('BotonMostrar — ver lo que se escribe', () => {
  it('cambia su texto según el estado y declara qué campo controla', async () => {
    // Arrange
    const user = userEvent.setup()
    function Campito() {
      const [visible, setVisible] = useState(false)
      return (
        <>
          <input id="password" type={visible ? 'text' : 'password'} aria-label="Contraseña" />
          <BotonMostrar visible={visible} alternar={() => setVisible((v) => !v)} controla="password" />
        </>
      )
    }
    render(<Campito />)

    // Act
    const antes = screen.getByRole('button', { name: 'Mostrar' })
    const controla = antes.getAttribute('aria-controls')
    await user.click(antes)

    // Assert
    expect(controla).to.equal('password')
    expect(screen.getByLabelText('Contraseña').getAttribute('type')).to.equal('text')
    expect(screen.getByRole('button', { name: 'Ocultar' }).getAttribute('title')).to.equal('Volver a ocultar lo que escribes')
  })
})

describe('Campo — etiqueta, ayuda y error enlazados', () => {
  function Formulario({ error, ayuda }: Readonly<{ error?: string; ayuda?: string }>) {
    const { register } = useForm<{ email: string }>()
    return <Campo id="email" etiqueta="Correo" registro={register('email')} error={error} ayuda={ayuda} type="email" />
  }

  it('sin ayuda ni error no declara descripciones', () => {
    // Arrange / Act
    render(<Formulario />)

    // Assert
    const entrada = screen.getByLabelText('Correo')
    expect(entrada.hasAttribute('aria-describedby')).to.equal(false)
    expect(entrada.hasAttribute('aria-invalid')).to.equal(false)
  })

  it('la ayuda se ve siempre y queda enlazada al campo', () => {
    // Arrange / Act
    render(<Formulario ayuda="Usa el correo con el que compraste." />)

    // Assert
    const entrada = screen.getByLabelText('Correo')
    expect(entrada.getAttribute('aria-describedby')).to.equal('email-ayuda')
    expect(document.getElementById('email-ayuda')?.textContent).to.equal('Usa el correo con el que compraste.')
  })

  it('con error marca el campo como inválido y enlaza ayuda y error, en ese orden', () => {
    // Arrange / Act
    render(<Formulario ayuda="Usa el correo con el que compraste." error="Escribe un correo válido." />)

    // Assert
    const entrada = screen.getByLabelText('Correo')
    expect(entrada.getAttribute('aria-invalid')).to.equal('true')
    expect(entrada.getAttribute('aria-describedby')).to.equal('email-ayuda email-error')
    expect(entrada.className).to.contain('error')
    expect(document.getElementById('email-error')?.textContent).to.equal('Escribe un correo válido.')
  })
})
