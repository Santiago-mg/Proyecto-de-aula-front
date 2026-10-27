/**
 * Corre las pruebas con el proveedor de IA elegido en .env (AI_PROVIDER) y deja
 * el reporte junit en resultados/<proveedor>/. Es lo que ejecutan los npm run test.
 *
 *   npm test               → todos los escenarios
 *   npm run test:esc26     → un escenario
 *   AI_PROVIDER=gemini npm test → el mismo conjunto con otro proveedor
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables que ya estén en el entorno.
}

const RAIZ = path.resolve(import.meta.dirname, '..');
const proveedor = (process.env.AI_PROVIDER ?? 'openai').trim().toLowerCase();
const grupo = process.argv[2] ?? 'todo';

const archivos = readdirSync(path.join(RAIZ, 'tests'))
  .filter((a) => a.endsWith('.test.ts'))
  .sort()
  .filter((a) => grupo === 'todo' || a.startsWith(grupo === 'humo' ? '00-' : `${grupo.replace(/^esc/, 'esc-')}-`));

if (archivos.length === 0) {
  console.error(`No hay pruebas para «${grupo}». Usa: todo, humo, esc13, esc26, esc27, esc28, esc29 o esc30.`);
  process.exit(1);
}

mkdirSync(path.join(RAIZ, 'resultados', proveedor), { recursive: true });
console.log(`Proveedor: ${proveedor} · Pruebas: ${archivos.join(', ')}`);

const r = spawnSync(
  process.execPath,
  [
    '--import', 'tsx',
    '--test', '--test-concurrency=1',
    '--test-reporter=spec', '--test-reporter-destination=stdout',
    '--test-reporter=junit', `--test-reporter-destination=resultados/${proveedor}/junit-${grupo}.xml`,
    ...archivos.map((a) => path.join('tests', a)),
  ],
  { cwd: RAIZ, stdio: 'inherit' },
);
process.exit(r.status ?? 1);
