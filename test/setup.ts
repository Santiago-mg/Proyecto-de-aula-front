// Se ejecuta antes de cada archivo de prueba (igual que tests/setup.ts del back):
//   1. Reemplaza la red por el doble de helpers/servidor.ts.
//   2. Completa lo que le falta a jsdom (helpers/navegador.ts).
//   3. Deja todo en blanco antes de cada prueba: rutas del doble, sesión y URL.
//
// Las aserciones usan la sintaxis fluida de Chai que trae Vitest
// (expect(x).to.equal(y), .to.be.null, .to.exist, .to.deep.include(...)).
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { servidor } from './helpers/servidor'
import './helpers/navegador'

servidor.instalar()

beforeEach(() => {
  servidor.reiniciar()
  localStorage.clear()
  globalThis.history.replaceState(null, '', '/')
})

// Desmonta lo que renderizó cada prueba para que no se cruce con la siguiente.
afterEach(() => {
  cleanup()
})
