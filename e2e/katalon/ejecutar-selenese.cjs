#!/usr/bin/env node
/**
 * Ejecutor de casos Selenese (.html) con Playwright.
 *
 * Katalon Recorder es una extensión de navegador; este script interpreta los MISMOS archivos
 * para poder correrlos sin la extensión (por ejemplo en CI o sin interfaz gráfica). Sirve para
 * comprobar la lógica de los casos: localizadores, esperas y aserciones. NO reemplaza ejecutarlos
 * en Katalon Recorder cuando se necesita esa evidencia específica.
 *
 * Uso:
 *   node ejecutar-selenese.cjs [archivos .html | Suite_*.html]   (sin argumentos: la suite completa)
 *   BASE_URL=http://localhost:5173  CHROMIUM_PATH=/ruta/chromium  CHROMIUM_ARGS="--no-sandbox"  HEADLESS=false
 *
 * Salida: evidencia/resultados.md, evidencia/resultados.json y una captura por caso en evidencia/.
 * Código de salida 0 si todo salió como se esperaba (el caso TC99 debe FALLAR a propósito).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const AQUI = __dirname;
const EVIDENCIA = path.join(AQUI, 'evidencia');
const ESPERA = Number(process.env.ESPERA_MS ?? 30000);   // igual que el tiempo de espera por defecto de Katalon
const decodificar = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&');

function leerCasos(ruta) {
  const html = fs.readFileSync(ruta, 'utf8');
  const casos = [];
  for (const tabla of html.match(/<table[\s\S]*?<\/table>/g) ?? []) {
    const nombre = decodificar((tabla.match(/<thead><tr><td[^>]*>([\s\S]*?)<\/td>/) ?? [])[1] ?? path.basename(ruta, '.html')).trim();
    const pasos = [...tabla.matchAll(/<tr><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)]
      .map((m) => [decodificar(m[1]).trim(), decodificar(m[2]).trim(), decodificar(m[3])]);
    casos.push({ nombre, pasos });
  }
  return casos;
}

function localizador(page, objetivo) {
  if (objetivo.startsWith('id=')) return page.locator(`[id="${objetivo.slice(3)}"]`);
  if (objetivo.startsWith('css=')) return page.locator(objetivo.slice(4));
  if (objetivo.startsWith('xpath=')) return page.locator('xpath=' + objetivo.slice(6));
  if (objetivo.startsWith('//')) return page.locator('xpath=' + objetivo);
  throw new Error(`Localizador no soportado: ${objetivo}`);
}

/** Patrones de Selenese: glob: (por defecto), regexp:, regexpi:, exact:. */
function coincide(texto, patron) {
  if (patron.startsWith('regexpi:')) return new RegExp(patron.slice(8), 'i').test(texto);
  if (patron.startsWith('regexp:')) return new RegExp(patron.slice(7)).test(texto);
  if (patron.startsWith('exact:')) return texto === patron.slice(6);
  const glob = patron.startsWith('glob:') ? patron.slice(5) : patron;
  const re = glob.split('').map((c) => (c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&'))).join('');
  return new RegExp(`^${re}$`, 's').test(texto);
}

async function ejecutarCaso(browser, caso) {
  const contexto = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await contexto.newPage();
  page.setDefaultTimeout(ESPERA);
  const vars = {};
  const sustituir = (s) => s.replace(/\$\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `\${${k}}`));
  let paso = 0, error = null;
  try {
    for (const [cmd, objetivoCrudo, valorCrudo] of caso.pasos) {
      paso += 1;
      const objetivo = sustituir(objetivoCrudo), valor = sustituir(valorCrudo);
      const donde = `paso ${paso}: ${cmd} | ${objetivoCrudo} | ${valorCrudo}`;
      try {
        switch (cmd) {
          case 'store': vars[valorCrudo] = objetivo; if (valorCrudo === 'BASE' && process.env.BASE_URL) vars.BASE = process.env.BASE_URL.replace(/\/$/, ''); break;
          case 'storeEval': vars[valorCrudo] = new Function('storedVars', `return (${objetivo})`)(vars); break;
          case 'open': await page.goto(valor ? valor : objetivo, { waitUntil: 'domcontentloaded' }); break;
          case 'runScript': await page.evaluate(objetivo); break;
          case 'pause': await page.waitForTimeout(Number(objetivo)); break;
          case 'waitForElementPresent': await localizador(page, objetivo).first().waitFor({ state: 'attached' }); break;
          case 'waitForElementNotPresent': await localizador(page, objetivo).first().waitFor({ state: 'detached' }); break;
          case 'waitForVisible': await localizador(page, objetivo).first().waitFor({ state: 'visible' }); break;
          case 'type': await localizador(page, objetivo).first().fill(valor); break;
          case 'click': case 'clickAndWait': await localizador(page, objetivo).first().click(); break;
          case 'select': {
            const [tipo, ...resto] = valor.split('='); const dato = resto.join('=');
            const opcion = tipo === 'label' ? { label: dato } : tipo === 'index' ? { index: Number(dato) } : { value: dato };
            await localizador(page, objetivo).first().selectOption(opcion); break;
          }
          case 'assertText': {
            // Texto TAL COMO SE VE (igual que getText de Selenium): respeta text-transform del CSS.
            const real = ((await localizador(page, objetivo).first().innerText()) ?? '').trim();
            if (!coincide(real, valor)) throw new Error(`el texto mostrado es "${real}" y no coincide con "${valor}"`);
            break;
          }
          case 'assertLocation': if (!coincide(page.url(), objetivo)) throw new Error(`la URL es ${page.url()} y no coincide con "${objetivo}"`); break;
          case 'assertElementPresent': if ((await localizador(page, objetivo).count()) === 0) throw new Error('el elemento no existe'); break;
          case 'assertElementNotPresent': if ((await localizador(page, objetivo).count()) !== 0) throw new Error('el elemento existe y no debería'); break;
          case 'assertVisible': if (!(await localizador(page, objetivo).first().isVisible())) throw new Error('el elemento no está visible'); break;
          default: throw new Error(`comando no soportado: ${cmd}`);
        }
      } catch (e) { throw new Error(`${donde}\n      → ${String(e.message).split('\n')[0]}`); }
    }
  } catch (e) { error = e.message; }
  fs.mkdirSync(EVIDENCIA, { recursive: true });
  const captura = `${caso.nombre}.${error ? 'FALLO' : 'OK'}.png`;
  await page.screenshot({ path: path.join(EVIDENCIA, captura) }).catch(() => undefined);
  await contexto.close();
  return { nombre: caso.nombre, ok: !error, error, pasos: caso.pasos.length, captura };
}

(async () => {
  let archivos = process.argv.slice(2);
  if (!archivos.length) archivos = [path.join(AQUI, 'Suite_CelularPro_Completa.html')];
  const casos = archivos.flatMap((a) => leerCasos(path.resolve(a)));
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: (process.env.CHROMIUM_ARGS ?? '').split(' ').filter(Boolean).map((a) => a.replace(/'/g, '')),
  });
  const resultados = [];
  for (const caso of casos) {
    const t0 = Date.now();
    const r = await ejecutarCaso(browser, caso);
    r.segundos = Math.round((Date.now() - t0) / 100) / 10;
    r.esperadoFallar = /FALLA_CONTROLADA/.test(caso.nombre);
    r.cumple = r.esperadoFallar ? !r.ok : r.ok;
    resultados.push(r);
    console.log(`${r.cumple ? '✔' : '✘'} ${caso.nombre.padEnd(52)} ${r.ok ? 'Passed' : 'Failed'}${r.esperadoFallar ? ' (debía fallar)' : ''}  ${r.segundos}s`);
    if (!r.ok && !r.esperadoFallar) console.log(`     ${r.error}`);
  }
  await browser.close();
  const fallos = resultados.filter((r) => !r.cumple);
  fs.mkdirSync(EVIDENCIA, { recursive: true });
  fs.writeFileSync(path.join(EVIDENCIA, 'resultados.json'), JSON.stringify({ fecha: new Date().toISOString(), resultados }, null, 2));
  const md = ['# Resultados de los casos Selenese', '', `Fecha: ${new Date().toISOString()}`, '', '| Caso | Resultado | Esperado | Pasos | Tiempo | Captura |', '|---|---|---|---|---|---|',
    ...resultados.map((r) => `| ${r.nombre} | ${r.ok ? 'Passed' : 'Failed'} | ${r.esperadoFallar ? 'Failed (a propósito)' : 'Passed'} | ${r.pasos} | ${r.segundos}s | ${r.captura} |`),
    '', `**${resultados.length - fallos.length} de ${resultados.length} se comportaron como se esperaba.**`];
  fallos.forEach((r) => md.push('', `### ${r.nombre}`, '```', r.error ?? '(pasó pero debía fallar)', '```'));
  fs.writeFileSync(path.join(EVIDENCIA, 'resultados.md'), md.join('\n'));
  console.log(`\n${resultados.length - fallos.length} de ${resultados.length} se comportaron como se esperaba. Evidencia en katalon/evidencia/`);
  process.exit(fallos.length ? 1 : 0);
})();
