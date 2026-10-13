import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Corre SOLO las pruebas de Mario que esperan código que este front todavía no
// tiene. Fallan a propósito; ver test/regresion/mario/README.md.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['test/regresion/mario/pendiente-codigo-de-mario/**/*.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
})
