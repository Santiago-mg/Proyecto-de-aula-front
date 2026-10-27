import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { RPReporter } from '@reportportal/agent-js-vitest'
import rp from './reportportal/config.cjs'

// En Jenkins (y en cualquier CI) la variable CI=true activa el reporte JUnit,
// que es el que Jenkins lee para mostrar cada prueba en su interfaz. En local
// no hace falta y solo llenaria el arbol de archivos en reports/.
const enCI = process.env.CI === 'true'

// ReportPortal: se suma como reporter solo si hay RP_API_KEY (ver reportportal/config.cjs).
// Cada prueba llega con su archivo y su describe, para clasificar fallos y buscar errores similares.
const reportePortal = rp.activo()
  ? [new RPReporter(rp.opciones('vitest', 'Pruebas unitarias y de escenarios del frontend (Vitest + Testing Library)'))]
  : []

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['test/unit/**/*.test.{ts,tsx}', 'test/escenarios/**/*.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['./test/setup.ts'],

    reporters: [...(enCI ? ['default', 'junit'] : ['default']), ...reportePortal],
    outputFile: { junit: 'reports/junit.xml' },

    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',

      // Se mide todo src/, tambien lo que ninguna prueba toca: asi el
      // porcentaje global es el real y no solo el de los archivos probados.
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Arranque de la app: monta React en el DOM, no tiene logica que probar.
        'src/main.tsx',
        // Solo declaran tipos: al compilar no queda ninguna linea ejecutable.
        'src/types/**',
        'src/vite-env.d.ts',
      ],

      // text        -> tabla en la consola y en el log de Jenkins
      // lcov        -> coverage/lcov.info, el que lee SonarQube
      // html        -> coverage/index.html, navegable desde el artefacto
      // cobertura   -> coverage/cobertura-coverage.xml, para el plugin Coverage
      reporter: ['text', 'text-summary', 'lcov', 'html', 'cobertura'],
    },
  },
})
