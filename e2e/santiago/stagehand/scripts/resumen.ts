/**
 * Junta lo que dejaron las corridas en resultados/RESUMEN.md, proveedor por proveedor
 * (openai, gemini, ollama) para poder compararlos:
 *   - resultados/<proveedor>/junit-*.xml   → qué casos pasaron y cuáles fallaron
 *   - resultados/<proveedor>/<prueba>.json → llamadas act/observe/extract, tiempo y
 *                                            tokens de cada sesión
 *
 * Uso: npm run resumen
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const CARPETA = path.join(RAIZ, 'resultados');

interface Sesion {
  prueba: string;
  proveedor: string;
  modelo: string;
  fecha: string;
  segundos: number;
  llamadas: { act: number; observe: number; extract: number };
  tokensEntrada: number;
  tokensSalida: number;
  capturas: string[];
  pasos: Array<{ exito: boolean }>;
}

interface Caso {
  suite: string;
  nombre: string;
  segundos: number;
  aprobado: boolean;
  motivo: string;
}

interface Corrida {
  proveedor: string;
  modelo: string;
  casos: Caso[];
  sesiones: Sesion[];
}

const decodificar = (t: string) =>
  t
    .replace(/&#10;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

// El reporter junit de Node escapa dos veces (&amp;quot;), por eso se decodifica dos veces.
const atributo = (texto: string, nombre: string) =>
  decodificar(decodificar(new RegExp(`\\b${nombre}="([^"]*)"`).exec(texto)?.[1] ?? ''));

/** Primera línea del error, sin el prefijo "Error [ERR_TEST_FAILURE]:". */
function motivoDe(trozo: string): string {
  const cuerpo = trozo.split('</testcase>')[0].replace(/^[\s\S]*?<failure\s[^>]*>/, '');
  const linea = cuerpo.split('\n').map((l) => l.trim()).find((l) => l !== '') ?? '';
  return decodificar(decodificar(linea)).replace(/^\w*Error(?: \[[A-Z_]+\])?:\s*/, '').slice(0, 160);
}

/** Lee un junit de Node: una suite por describe, un testcase por it. */
function leerJunit(xml: string): Caso[] {
  const casos: Caso[] = [];
  let suite = '';
  for (const trozo of xml.split(/(?=<testsuite\s|<testcase\s)/)) {
    if (trozo.startsWith('<testsuite ')) {
      suite = atributo(trozo.split('>')[0], 'name');
    } else if (trozo.startsWith('<testcase ')) {
      const cabecera = trozo.split('>')[0];
      const falla = /<failure\s/.test(trozo.split('</testcase>')[0]);
      casos.push({
        suite,
        nombre: atributo(cabecera, 'name'),
        segundos: Number(atributo(cabecera, 'time')) || 0,
        aprobado: !falla,
        motivo: falla ? motivoDe(trozo) : '',
      });
    }
  }
  return casos;
}

const celda = (t: string) => t.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const redondear = (n: number) => Math.round(n * 10) / 10;
const sumar = (sesiones: Sesion[], f: (s: Sesion) => number) => sesiones.reduce((acc, s) => acc + f(s), 0);

async function leerCorrida(proveedor: string): Promise<Corrida> {
  const carpeta = path.join(CARPETA, proveedor);
  const archivos = await readdir(carpeta);

  // Si un caso aparece en dos corridas, vale la más reciente.
  const junits = await Promise.all(
    archivos
      .filter((a) => a.startsWith('junit-') && a.endsWith('.xml'))
      .map(async (a) => ({ a, t: (await stat(path.join(carpeta, a))).mtimeMs })),
  );
  const porCaso = new Map<string, Caso>();
  for (const { a } of junits.sort((x, y) => x.t - y.t)) {
    for (const c of leerJunit(await readFile(path.join(carpeta, a), 'utf8'))) porCaso.set(`${c.suite}|${c.nombre}`, c);
  }

  const sesiones: Sesion[] = [];
  for (const a of archivos.filter((x) => x.endsWith('.json')).sort()) {
    sesiones.push(JSON.parse(await readFile(path.join(carpeta, a), 'utf8')) as Sesion);
  }
  return {
    proveedor,
    modelo: sesiones[0]?.modelo ?? 'sin registro',
    casos: [...porCaso.values()].sort((a, b) => a.suite.localeCompare(b.suite, 'es')),
    sesiones,
  };
}

async function main() {
  const proveedores = (await readdir(CARPETA, { withFileTypes: true }).catch(() => []))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const corridas = (await Promise.all(proveedores.map(leerCorrida))).filter((c) => c.casos.length + c.sesiones.length > 0);

  if (corridas.length === 0) {
    console.error('No hay resultados todavía. Corre primero: npm test');
    process.exitCode = 1;
    return;
  }

  const md: string[] = ['# Resultados de las pruebas con Stagehand', ''];
  md.push(`Generado: ${new Date().toLocaleString('es-CO')}`, '');

  md.push('## Comparación entre proveedores', '');
  md.push(
    '| Proveedor | Modelo | Casos aprobados | Llamadas (act / observe / extract) | Tokens de entrada | Tokens de salida | Segundos |',
    '|---|---|---:|---|---:|---:|---:|',
  );
  for (const c of corridas) {
    const l = (f: (s: Sesion['llamadas']) => number) => sumar(c.sesiones, (s) => f(s.llamadas));
    md.push(
      `| ${c.proveedor} | ${c.modelo} | ${c.casos.filter((x) => x.aprobado).length} de ${c.casos.length} | ` +
        `${l((x) => x.act)} / ${l((x) => x.observe)} / ${l((x) => x.extract)} | ` +
        `${sumar(c.sesiones, (s) => s.tokensEntrada)} | ${sumar(c.sesiones, (s) => s.tokensSalida)} | ` +
        `${redondear(sumar(c.sesiones, (s) => s.segundos))} |`,
    );
  }

  for (const c of corridas) {
    md.push('', `## ${c.proveedor} (${c.modelo})`, '', '### Casos', '');
    md.push('| Escenario | Caso | Resultado | Segundos | Motivo del fallo |', '|---|---|---|---:|---|');
    for (const x of c.casos) {
      md.push(`| ${celda(x.suite)} | ${celda(x.nombre)} | ${x.aprobado ? 'Aprobado' : 'Fallido'} | ${redondear(x.segundos)} | ${celda(x.motivo)} |`);
    }
    md.push('', '### Uso de Stagehand por sesión', '');
    md.push('| Sesión | act | observe | extract | Tokens de entrada | Tokens de salida | Segundos | Capturas | Llamadas fallidas |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const s of c.sesiones) {
      md.push(
        `| ${s.prueba} | ${s.llamadas.act} | ${s.llamadas.observe} | ${s.llamadas.extract} | ${s.tokensEntrada} | ${s.tokensSalida} | ${s.segundos} | ${s.capturas.length} | ${s.pasos.filter((p) => !p.exito).length} |`,
      );
    }
  }

  md.push(
    '',
    'Las capturas están en `evidencias/<proveedor>/<sesión>/` y el detalle de cada llamada (instrucción, tiempo, tokens y respuesta) en `resultados/<proveedor>/<sesión>.json`.',
    '',
  );

  await writeFile(path.join(CARPETA, 'RESUMEN.md'), md.join('\n'));
  console.log(`resultados/RESUMEN.md listo — ${corridas.map((c) => `${c.proveedor}: ${c.casos.filter((x) => x.aprobado).length}/${c.casos.length}`).join(' · ')}`);
}

await main();
