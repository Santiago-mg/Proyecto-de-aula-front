import { defineConfig } from 'vitest/config'

// Cada prueba abre un navegador y llama a un modelo de lenguaje: se corren de a una
// y con tiempo amplio. El JUnit sirve de evidencia y se importa en ReportPortal.
export default defineConfig({
  test: {
    include: ['pruebas/**/*.test.ts'],
    environment: 'node',
    testTimeout: 180_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    reporters: ['default', 'junit'],
    outputFile: { junit: 'reports/junit-stagehand.xml' },
  },
})
