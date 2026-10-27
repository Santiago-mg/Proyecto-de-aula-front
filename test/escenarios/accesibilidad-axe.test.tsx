import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { abrirApp } from '../helpers/app'
import { fallo, listado, ok, servidor } from '../helpers/servidor'
import {
  alertaDeStock, celular, estadisticas, paginado, sesionDeAdmin, sesionIniciada, usuario,
} from '../helpers/fixtures'

/**
 * Auditoría de accesibilidad automática (axe-core) de las pantallas de las 6 funcionalidades:
 * registro, inicio de sesión, perfil, validación de credenciales (sesión vencida), control de
 * roles y alertas de stock bajo.
 *
 * Qué cubre: etiquetas de formularios, nombres accesibles de botones y enlaces, roles y atributos
 * ARIA válidos, orden de los títulos, zonas de referencia (main, header, nav) y duplicados de id.
 *
 * Qué NO cubre: el contraste de color (jsdom no calcula estilos reales; se midió aparte con la
 * fórmula WCAG), el orden del foco con teclado ni la lectura con un lector de pantalla real.
 * Para eso hay que usar Lighthouse o un lector de pantalla en un navegador.
 */

async function violaciones() {
  const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
  return r.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
}
const sinViolaciones = async () => expect(await violaciones(), 'violaciones de accesibilidad').to.deep.equal([])

describe('Accesibilidad (axe) — acceso y cuenta', () => {
  it('Registro de usuario', async () => {
    abrirApp('/register')
    await screen.findByRole('heading', { name: /crear cuenta/i })
    await sinViolaciones()
  })

  it('Registro con errores de validación a la vista (mensajes asociados a sus campos)', async () => {
    const user = abrirApp('/register')
    await user.click(await screen.findByRole('button', { name: /crear cuenta/i }))
    await screen.findAllByText(/inválido|al menos/i)
    await sinViolaciones()
  })

  it('Inicio de sesión', async () => {
    abrirApp('/login')
    await screen.findByRole('heading', { name: /ingresar/i })
    await sinViolaciones()
  })

  it('Inicio de sesión con el error del servidor anunciado (role="alert")', async () => {
    servidor.responder('POST', '/auth/login', fallo(401, 'Credenciales inválidas'))
    const user = abrirApp('/login')
    await user.type(await screen.findByLabelText('Email'), 'a@correo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Clave2026x')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    await screen.findByRole('alert')
    await sinViolaciones()
  })

  it('Gestión de perfil (nombre y contraseña)', async () => {
    sesionIniciada(usuario({ name: 'Ana Pérez' }))
    abrirApp('/profile')
    await screen.findByRole('heading', { name: /mi perfil/i })
    await sinViolaciones()
  })

  it('Sesión vencida: el aviso de /login es un mensaje de estado', async () => {
    sessionStorage.setItem('cp_aviso', 'Tu sesión ha vencido. Inicia sesión de nuevo.')
    abrirApp('/login')
    await screen.findByRole('status')
    await sinViolaciones()
  })
})

describe('Accesibilidad (axe) — roles y alertas de stock', () => {
  it('Control de roles: pantalla de acceso no autorizado', async () => {
    sesionIniciada()
    abrirApp('/admin/alerts')
    await screen.findByRole('heading', { name: /no autorizado/i })
    await sinViolaciones()
  })

  it('Alertas de stock: lista con alertas', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas()))
    servidor.responder('GET', '/admin/alerts', ok([
      alertaDeStock({ id: 'a1', type: 'OUT_OF_STOCK', phone: { id: 'p1', name: 'Pixel 8', stock: 0 } }),
      alertaDeStock({ id: 'a2', type: 'LOW_STOCK', phone: { id: 'p2', name: 'Galaxy S24', stock: 3 } }),
    ]))
    abrirApp('/admin/alerts')
    await screen.findAllByTestId('alerta')
    await sinViolaciones()
  })

  it('Alertas de stock: estado vacío', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas()))
    servidor.responder('GET', '/admin/alerts', ok([]))
    abrirApp('/admin/alerts')
    await screen.findByText(/No hay alertas abiertas/)
    await sinViolaciones()
  })

  it('Alertas de stock: error del servidor con "Reintentar"', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas()))
    servidor.responder('GET', '/admin/alerts', fallo(500, 'Error interno del servidor'))
    abrirApp('/admin/alerts')
    await screen.findByRole('button', { name: 'Reintentar' })
    await sinViolaciones()
  })

  it('Panel con la insignia y el aviso de alertas', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/admin/stats', ok(estadisticas()))
    servidor.responder('GET', '/admin/alerts', ok([alertaDeStock()]))
    abrirApp('/admin')
    await screen.findByTestId('insignia-alertas')
    await waitFor(() => expect(document.getElementById('banner-alertas')).to.exist)
    await sinViolaciones()
  })

  it('Formulario de celular con el campo del umbral mínimo', async () => {
    sesionDeAdmin()
    abrirApp('/admin/phones/new')
    await screen.findByLabelText('Stock mínimo (umbral de alerta)')
    await sinViolaciones()
  })

  it('Tabla de celulares con las etiquetas de estado de stock', async () => {
    sesionDeAdmin()
    servidor.responder('GET', '/phones', listado(paginado([celular({ id: 'p1', name: 'Pixel 8', stock: 0 })], { limit: 50 })))
    servidor.responder('GET', '/admin/alerts', ok([alertaDeStock({ type: 'OUT_OF_STOCK', phone: { id: 'p1', name: 'Pixel 8', stock: 0 } })]))
    abrirApp('/admin/phones')
    await screen.findByText('Sin stock')
    await sinViolaciones()
  })
})

describe('Accesibilidad (axe) — pantallas de la refactorización por heurísticas', () => {
  it('Centro de ayuda (FAQ desplegable, guías, tabla de atajos)', async () => {
    abrirApp('/ayuda#faq-correo')
    await screen.findByRole('heading', { name: 'Centro de ayuda' })
    await sinViolaciones()
  })

  it('Registro con los requisitos de la contraseña marcándose', async () => {
    const user = abrirApp('/register')
    await user.type(await screen.findByLabelText('Contraseña'), 'medellin2026')
    await screen.findByText('3 de 4 requisitos cumplidos')
    await sinViolaciones()
  })

  it('Mi cuenta con el error de pedidos y "Reintentar"', async () => {
    sesionIniciada()
    servidor.responder('GET', '/orders/my', fallo(500, 'Error interno del servidor'))
    abrirApp('/dashboard')
    await screen.findByRole('button', { name: 'Reintentar' })
    await sinViolaciones()
  })
})
