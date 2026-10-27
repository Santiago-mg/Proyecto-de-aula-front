import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import pendientesQa from './test/pendiente-qa-mario.json'

// Corre SOLO las pruebas de la rama pruebas-qa-mario que verifican código que este
// front todavía no tiene (ver INTEGRACION-QA.md). Fallan a propósito hasta que se
// integre el código de Mario; mientras tanto no entran en `npm test`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: pendientesQa,
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
})
