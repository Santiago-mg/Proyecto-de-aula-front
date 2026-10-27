import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { abrirApp } from '../../helpers/app'
import { ok, servidor } from '../../helpers/servidor'
import { sesionIniciada, usuario } from '../../helpers/fixtures'

// H5, H7.2 y H8.2 — la regla de la contraseña solo se conocía al fallar.
// H3.3 — no había forma de volver al estado anterior en el perfil.
// H1.2 y H3 — Ingresar y Crear cuenta no tenían salida visible a la tienda.

function estadoDeRegla(id: string) {
  return document.querySelector(`[data-regla="${id}"]`)?.getAttribute('data-cumple')
}

describe('H5/H7/H8 — requisitos de la contraseña en tiempo real', () => {
  it('antes de escribir, los 4 requisitos se ven pendientes', async () => {
    abrirApp('/register')
    await screen.findByRole('heading', { name: 'Crear cuenta' })

    for (const id of ['largo', 'mayuscula', 'minuscula', 'numero']) expect(estadoDeRegla(id)).to.equal('false')
  })

  it('cada requisito se marca mientras se escribe, sin enviar el formulario', async () => {
    const user = abrirApp('/register')
    const campo = await screen.findByLabelText('Contraseña')

    await user.type(campo, 'medellin')
    const parcial = ['largo', 'mayuscula', 'minuscula', 'numero'].map(estadoDeRegla)
    await user.clear(campo)
    await user.type(campo, 'Medellin2026')

    expect(parcial).to.deep.equal(['true', 'false', 'true', 'false'])
    for (const id of ['largo', 'mayuscula', 'minuscula', 'numero']) expect(estadoDeRegla(id)).to.equal('true')
    expect(screen.getByText('4 de 4 requisitos cumplidos')).to.exist
    expect(servidor.peticiones('POST', '/auth/register')).to.be.empty
  })

  it('el campo de correo dice qué dominios se aceptan antes de fallar (H8.2)', async () => {
    abrirApp('/register')
    const correo = await screen.findByLabelText('Email')

    expect(correo.getAttribute('placeholder')).to.equal('tu@gmail.com')
    expect(correo.getAttribute('aria-describedby')).to.include('email-hint')
    expect(screen.getByText(/Gmail, Outlook, Hotmail, Yahoo o iCloud\./)).to.exist
  })

  it('la confirmación vacía tiene su propio mensaje', async () => {
    const user = abrirApp('/register')
    await user.type(await screen.findByLabelText('Contraseña'), 'Medellin2026')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText('Confirma tu contraseña')).to.exist
  })

  it('en Mi perfil, la contraseña nueva también muestra los requisitos', async () => {
    sesionIniciada()
    const user = abrirApp('/profile')

    await user.type(await screen.findByLabelText('Contraseña nueva'), 'Abc')

    expect(estadoDeRegla('mayuscula')).to.equal('true')
    expect(estadoDeRegla('largo')).to.equal('false')
  })
})

describe('H3.3 — volver al estado anterior en Mi perfil', () => {
  it('"Descartar cambios" está apagado hasta que se edita y devuelve el nombre guardado', async () => {
    sesionIniciada(usuario({ name: 'Mario Andrade' }))
    const user = abrirApp('/profile')
    const campo = (await screen.findByLabelText('Nombre completo')) as HTMLInputElement
    const descartar = screen.getByRole('button', { name: 'Descartar cambios' }) as HTMLButtonElement
    const apagadoAlInicio = descartar.disabled

    await user.clear(campo)
    await user.type(campo, 'Otro Nombre')
    const encendidoAlEditar = !descartar.disabled
    await user.click(descartar)

    expect(apagadoAlInicio).to.equal(true)
    expect(encendidoAlEditar).to.equal(true)
    expect(campo.value).to.equal('Mario Andrade')
    expect(servidor.peticiones('PATCH', '/auth/me')).to.be.empty
  })

  it('después de guardar, el nombre nuevo pasa a ser el estado al que se vuelve', async () => {
    sesionIniciada(usuario({ name: 'Mario Andrade' }))
    servidor.responder('PATCH', '/auth/me', ok(usuario({ name: 'Mario Nuevo' })))
    const user = abrirApp('/profile')
    const campo = (await screen.findByLabelText('Nombre completo')) as HTMLInputElement

    await user.clear(campo)
    await user.type(campo, 'Mario Nuevo')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByText('Perfil actualizado')

    expect((screen.getByRole('button', { name: 'Descartar cambios' }) as HTMLButtonElement).disabled).to.equal(true)
  })

  it('"Limpiar campos" vacía el formulario de contraseña', async () => {
    sesionIniciada()
    const user = abrirApp('/profile')
    const actual = (await screen.findByLabelText('Contraseña actual')) as HTMLInputElement

    await user.type(actual, 'algo')
    await user.click(screen.getByRole('button', { name: 'Limpiar campos' }))

    await waitFor(() => expect(actual.value).to.equal(''))
  })

  it('la ruta de navegación indica dónde se está (H1.2)', async () => {
    sesionIniciada()
    abrirApp('/profile')

    const ruta = await screen.findByRole('navigation', { name: 'Ruta de navegación' })
    expect(ruta.querySelector('[aria-current="page"]')?.textContent).to.equal('Mi perfil')
  })
})

describe('H1/H3 — salida visible desde Ingresar y Crear cuenta', () => {
  it.each(['/login', '/register'])('%s tiene "← Volver a la tienda"', async (ruta) => {
    const user = abrirApp(ruta)

    await user.click(await screen.findByRole('link', { name: '← Volver a la tienda' }))

    expect(globalThis.location.pathname).to.equal('/')
  })
})
