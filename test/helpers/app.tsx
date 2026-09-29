import { onTestFinished } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppRouter } from '../../src/routes/AppRouter'

// Monta la aplicación completa (router, providers y layouts) en la ruta indicada,
// como si el usuario la escribiera en la barra de direcciones.
export function abrirApp(ruta: string) {
  globalThis.history.pushState(null, '', ruta)
  const user = userEvent.setup()
  render(<AppRouter />)
  return user
}

export function rutaActual() {
  return globalThis.location.pathname + globalThis.location.search
}

// api.ts hace location.href = '/login' ante un 401 con sesión. jsdom no navega
// entre páginas, así que se intercepta la asignación para poder verificarla.
export function capturarRedirecciones(): string[] {
  const real = globalThis.location
  const destinos: string[] = []
  const espia = new Proxy(real, {
    get(obj, prop) {
      const valor: unknown = Reflect.get(obj, prop, obj)
      return typeof valor === 'function' ? valor.bind(obj) : valor
    },
    set(obj, prop, valor) {
      if (prop === 'href') {
        destinos.push(String(valor))
        return true
      }
      return Reflect.set(obj, prop, valor, obj)
    },
  })
  Object.defineProperty(globalThis, 'location', { value: espia, configurable: true })
  onTestFinished(() => {
    Object.defineProperty(globalThis, 'location', { value: real, configurable: true })
  })
  return destinos
}
