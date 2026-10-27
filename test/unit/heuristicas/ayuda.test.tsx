import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { abrirApp } from '../../helpers/app'

// H10 (ayuda y documentación) — antes 0,99 de 5: solo un correo en el pie,
// sin FAQ, sin guías, sin ejemplos, y ausente en Ingresar y Crear cuenta.
// H4.1 — "Garantías" del pie llevaba al catálogo.

describe('H10 — Centro de ayuda (/ayuda)', () => {
  it('tiene preguntas frecuentes, guías de problemas, garantías, atajos y contacto', async () => {
    abrirApp('/ayuda')

    expect(await screen.findByRole('heading', { name: 'Centro de ayuda', level: 1 })).to.exist
    for (const seccion of ['Preguntas frecuentes', 'Resolver problemas', 'Garantías', 'Atajos de teclado', 'Contacto']) {
      expect(screen.getByRole('heading', { name: seccion, level: 2 })).to.exist
    }
    expect(screen.getByRole('link', { name: 'soporte@celularpro.co' }).getAttribute('href')).to.equal('mailto:soporte@celularpro.co')
  })

  it('las respuestas usan ejemplos concretos (correos y contraseñas válidas e inválidas)', async () => {
    abrirApp('/ayuda')

    expect(await screen.findByText('ana.perez@gmail.com — se acepta')).to.exist
    expect(screen.getByText('ana@miempresa.com — no se acepta')).to.exist
    expect(screen.getByText('Medellin2026 — cumple')).to.exist
    expect(screen.getByText('medellin2026 — le falta una mayúscula')).to.exist
  })

  it('la guía "No puedo ingresar" está orientada a resolver el problema, paso a paso', async () => {
    abrirApp('/ayuda')

    const guia = (await screen.findByRole('heading', { name: 'No puedo ingresar' })).closest('article') as HTMLElement
    expect(within(guia).getAllByRole('listitem').length).to.be.at.least(4)
    expect(within(guia).getByText(/Demasiados intentos fallidos/)).to.exist
  })

  it('un enlace con #ancla abre esa pregunta frecuente', async () => {
    abrirApp('/ayuda#faq-correo')

    const pregunta = (await screen.findByText('¿Qué correos puedo usar para crear mi cuenta?')).closest('details') as HTMLDetailsElement
    await waitFor(() => expect(pregunta.open).to.equal(true))
  })

  it('pone "Ayuda" en el título de la pestaña', async () => {
    abrirApp('/ayuda')
    await screen.findByRole('heading', { name: 'Centro de ayuda' })
    expect(document.title).to.equal('Ayuda · CelularPro')
  })
})

describe('H10 — la ayuda está donde se necesita', () => {
  it.each([
    ['/login', '/ayuda#guia-no-puedo-ingresar'],
    ['/register', '/ayuda#preguntas'],
  ])('%s enlaza a la ayuda', async (ruta, destino) => {
    abrirApp(ruta)
    const enlaces = await screen.findAllByRole('link')
    expect(enlaces.map((e) => e.getAttribute('href'))).to.include(destino)
  })

  it('"Acceso no autorizado" explica por qué con un enlace a la ayuda', async () => {
    abrirApp('/unauthorized')
    expect((await screen.findByRole('link', { name: '¿Por qué veo esto?' })).getAttribute('href')).to.equal('/ayuda#faq-admin')
  })
})

describe('H4.1 — el pie lleva a donde dice', () => {
  it.each([
    ['Garantías', '/ayuda#garantias'],
    ['Contacto', '/ayuda#contacto'],
    ['Preguntas frecuentes', '/ayuda#preguntas'],
  ])('"%s" → %s', async (texto, destino) => {
    abrirApp('/unauthorized')
    const pie = (await screen.findByRole('contentinfo')) as HTMLElement
    expect(within(pie).getByRole('link', { name: texto }).getAttribute('href')).to.equal(destino)
  })
})
