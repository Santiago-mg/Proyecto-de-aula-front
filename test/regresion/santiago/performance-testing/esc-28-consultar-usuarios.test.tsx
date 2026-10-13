import { expect } from 'chai'
import { describe, it } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import { abrirApp } from '../../../helpers/app'
import { listado, servidor } from '../../../helpers/servidor'
import { administrador, filaUsuario, paginado, sesionDeAdmin } from '../../../helpers/fixtures'
import { mediana, medir } from '../helpers/medicion'

/**
 * ESC-28 — Consultar usuarios · performance-testing (front)
 *
 * El buscador espera 400 ms a que el admin deje de escribir antes de pedir
 * (debounce): escribir "ana torres" debe producir UNA búsqueda, no diez. Y la
 * tabla debe crecer de forma lineal con el número de filas.
 */

const PRESUPUESTO_MS = 1_000
const FILA_ADMIN = filaUsuario({ ...administrador(), orderCount: 0 })

function usuarios(n: number) {
  return Array.from({ length: n }, (_, i) =>
    filaUsuario({ id: `user-${i}`, name: `Usuario ${i}`, email: `usuario${i}@gmail.com` }),
  )
}

/** Abre el listado con n usuarios y espera a ver el último. */
async function tablaCon(n: number) {
  sesionDeAdmin()
  servidor.responder('GET', '/admin/users', listado(paginado([FILA_ADMIN, ...usuarios(n)])))
  const user = abrirApp('/admin/users')
  // Margen amplio: en Jenkins jsdom puede ir bastante más lento.
  await screen.findByText(`usuario${n - 1}@gmail.com`, {}, { timeout: 5_000 })
  return user
}

/** Lo mismo, pero dejando todo limpio para poder repetirlo. */
async function tablaConLimpieza(n: number) {
  await tablaCon(n)
  cleanup()
  servidor.reiniciar()
  localStorage.clear()
}

describe('ESC-28 · Performance (front) — consultar usuarios', () => {
  it('pinta todas las filas de la página', async () => {
    // Act
    await tablaCon(20)

    // Assert
    expect(screen.getAllByRole('row')).to.have.lengthOf(1 + 1 + 20) // cabecera + admin + 20
  })

  it('escribir "ana torres" (10 teclas) produce una sola búsqueda, no una por tecla', async () => {
    // Arrange
    const user = await tablaCon(3)
    const buscador = screen.getByPlaceholderText(/buscar por nombre o email/i)

    // Act
    await user.type(buscador, 'ana torres')

    // Assert
    await waitFor(
      () => {
        expect(servidor.peticiones('GET', '/admin/users').filter((p) => p.params.search)).to.have.lengthOf(1)
      },
      { timeout: 2_000 },
    )
    // Pasado otro intervalo completo del debounce (400 ms) sigue habiendo
    // una sola: no quedó ninguna búsqueda atrasada por salir.
    await new Promise((resolver) => setTimeout(resolver, 500))
    const busquedas = servidor.peticiones('GET', '/admin/users').filter((p) => p.params.search)
    expect(busquedas).to.have.lengthOf(1)
    expect(busquedas[0].params).to.deep.equal({ page: 1, limit: 20, search: 'ana torres' })
  })

  it('una página de 50 usuarios (el máximo que acepta el back) cumple el presupuesto', async () => {
    // Arrange
    await tablaConLimpieza(50) // calentamiento

    // Act
    const { ms } = await medir(() => tablaCon(50))

    // Assert
    expect(ms, `Tardó ${ms.toFixed(1)} ms`).to.be.below(PRESUPUESTO_MS)
  })

  it('10 veces más filas (5 → 50, el máximo del back) cuestan menos de 15 veces más', async () => {
    // Arrange
    await tablaConLimpieza(5) // calentamiento
    const tiempos5: number[] = []
    const tiempos50: number[] = []

    // Act
    // Las mediciones se intercalan (5, 50, 5, 50…) para que una pausa del
    // equipo afecte a las dos series por igual y no solo a una.
    for (let i = 0; i < 5; i++) {
      tiempos5.push((await medir(() => tablaConLimpieza(5))).ms)
      tiempos50.push((await medir(() => tablaConLimpieza(50))).ms)
    }

    // Assert
    // Montar la pantalla tiene un costo fijo y cada fila suma un poco: si el
    // pintado es lineal, 10 veces más filas cuestan a lo sumo 10 veces más. Un
    // pintado cuadrático (por ejemplo, buscar cada fila dentro de la lista en
    // cada pintado) lo llevaría hacia ~100. El 15 deja margen para el ruido
    // de jsdom sin dejar pasar ese caso.
    const proporcion = mediana(tiempos50) / mediana(tiempos5)
    expect(proporcion, `50 filas costaron ${proporcion.toFixed(1)} veces lo de 5`).to.be.below(15)
  }, 30_000)
})
