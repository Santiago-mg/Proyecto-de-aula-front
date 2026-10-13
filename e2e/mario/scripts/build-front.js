/**
 * Compila el frontend apuntando a la API que usarán las pruebas.
 *
 * Modo simulado (E2E_SIMULADO=true): VITE_API_URL = API simulada de support/.
 * Modo real (por defecto): no compila nada, las pruebas usan el frontend que
 * ya esté corriendo contra el backend real.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { API_URL_SIMULADA } = require('./puertos');

if (process.env.E2E_SIMULADO !== 'true') {
  console.log('Modo real: se usa el front que ya está corriendo, no se compila nada.');
  process.exit(0);
}

const raizFront = path.resolve(__dirname, '..', '..', '..');
const resultado = spawnSync(
  'npx',
  ['vite', 'build', '--outDir', path.join('e2e', 'mario', '.front-dist'), '--emptyOutDir'],
  {
    cwd: raizFront,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, VITE_API_URL: API_URL_SIMULADA },
  },
);

process.exit(resultado.status ?? 1);
