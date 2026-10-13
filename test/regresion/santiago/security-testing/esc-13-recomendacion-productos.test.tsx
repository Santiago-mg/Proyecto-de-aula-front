import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { phonesService } from '../../../../src/services/phones.service'
import { abrirApp } from '../../../helpers/app'
import { ok, servidor } from '../../../helpers/servidor'
import { celular, celularCompleto } from '../../../helpers/fixtures'
import { XSS_IMAGEN, XSS_SCRIPT, hayHtmlInyectado } from '../helpers/seguridad'

/**
 * ESC-13 — Recomendación de productos · security-testing (front)
 *
 * El slug viene de la URL, que la escribe cualquiera: no debe poder dirigir
 * la petición a otro endpoint del back. Y lo que llega del catálogo se pinta
 * como texto, nunca como HTML.
 */

describe('ESC-13 · Seguridad (front) — recomendaciones', () => {
  it.each([
    ['../admin/stats', '/phones/..%2Fadmin%2Fstats/similares', 'recorrido de rutas'],
    ['iphone?limit=1000', '/phones/iphone%3Flimit%3D1000/similares', 'parámetros inyectados'],
    ['iphone#x', '/phones/iphone%23x/similares', 'fragmento'],
  ])('slug %j se codifica y la petición sale a %s (%s)', async (slug, urlEsperada) => {
    // Arrange
    servidor.responder('GET', urlEsperada, ok([]))

    // Act
    // Si la URL saliera mal armada, el doble respondería 404. Aquí solo
    // importa a dónde fue la petición, así que el resultado se ignora y la
    // prueba falla con la aserción de abajo (que muestra la URL real).
    await phonesService.getSimilar(slug).catch(() => undefined)

    // Assert
    const peticiones = servidor.peticiones('GET')
    expect(peticiones.map((p) => p.url)).to.deep.equal([urlEsperada])
    // Y el límite sigue siendo el que puso el servicio, no el del atacante.
    expect(peticiones[0].params).to.deep.equal({ limit: 4 })
  })

  it.each([
    [XSS_IMAGEN, 'imagen con onerror'],
    [XSS_SCRIPT, 'etiqueta script'],
  ])('un nombre con %j (%s) se muestra como texto, sin crear elementos', async (nombre) => {
    // Arrange
    servidor.responder('GET', '/phones/iphone-15', ok(celularCompleto()))
    servidor.responder('GET', '/phones/iphone-15/similares', ok([celular({ id: 'p-9', slug: 'malicioso', name: nombre })]))

    // Act
    abrirApp('/phones/iphone-15')

    // Assert
    const seccion = await screen.findByRole('region', { name: 'También te puede interesar' })
    expect(within(seccion).getByText(nombre)).to.exist
    expect(hayHtmlInyectado(seccion)).to.equal(false)
  })
})
