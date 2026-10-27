/**
 * Una sesión de prueba: un navegador, una instancia de Stagehand y el registro
 * de todo lo que se le pidió (para el informe).
 *
 * Los tres métodos de Stagehand que usan las pruebas:
 *   - actuar()   → act:     hace algo en la página ("pulsa Banear").
 *   - observar() → observe: busca elementos y dice qué se podría hacer con ellos,
 *                           sin tocar nada.
 *   - extraer()  → extract: lee datos de la pantalla y los devuelve con la forma
 *                           de un esquema zod.
 *
 * Cada llamada queda anotada con lo que tardó y los tokens que gastó, y se
 * guarda en resultados/<proveedor>/<prueba>.json al cerrar la sesión.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { localBrowser, Stagehand, type Action, type Page, type StagehandBrowser } from '@browserbasehq/stagehand';
import type { z } from 'zod';
import { entorno } from './entorno.js';

type Tipo = 'act' | 'observe' | 'extract';

interface Paso {
  n: number;
  tipo: Tipo;
  instruccion: string;
  segundos: number;
  exito: boolean;
  tokensEntrada: number;
  tokensSalida: number;
  detalle?: string;
}

type Variables = Record<string, string | number | boolean>;

const RAIZ = path.resolve(import.meta.dirname, '..');

let ultimaLlamada = 0;
/** Espera lo que haga falta para no pasar el límite de llamadas por minuto del proveedor. */
async function respetarRitmo(): Promise<void> {
  const espera = ultimaLlamada + entorno.pausaEntreLlamadas - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaLlamada = Date.now();
}

/** Errores del proveedor que suelen pasar solos: servidor saturado o límite por minuto. */
const TRANSITORIO = /high demand|overloaded|unavailable|quota|rate.?limit|\b429\b|\b503\b/i;

/** Repite una llamada a la IA (hasta 3 veces más) si el proveedor estaba saturado. */
async function conReintentos<T>(llamada: () => Promise<T>): Promise<T> {
  for (let intento = 1; ; intento++) {
    await respetarRitmo();
    try {
      return await llamada();
    } catch (error) {
      const mensaje = String((error as Error).message ?? error);
      if (intento > 3 || !TRANSITORIO.test(mensaje)) throw error;
      // Si el proveedor dice cuánto esperar ("Please retry in 18.7s"), se espera eso; si no, 30 s.
      const sugerido = Number(/retry in ([\d.]+)s/i.exec(mensaje)?.[1]);
      const esperaS = sugerido > 0 ? Math.ceil(sugerido) + 2 : 30;
      console.log(`  ↻ La IA no pudo responder (${mensaje.slice(0, 70).replace(/\s+/g, ' ')}…). Reintento ${intento}/3 en ${esperaS} s`);
      await new Promise((r) => setTimeout(r, esperaS * 1000));
    }
  }
}

export class Sesion {
  private readonly pasos: Paso[] = [];
  private readonly capturas: string[] = [];
  private readonly inicio = Date.now();

  private constructor(
    readonly nombre: string,
    readonly stagehand: Stagehand,
    private readonly navegador: StagehandBrowser,
    readonly page: Page,
  ) {}

  static async abrir(nombre: string): Promise<Sesion> {
    const navegador = await localBrowser.launch({
      headless: entorno.sinVentana,
      executablePath: entorno.chrome,
    });
    let stagehand: Stagehand;
    try {
      stagehand = await Stagehand.create({
        browser: navegador,
        model: entorno.modelo,
        logging: { level: entorno.nivelLog },
        // Sin caché: las pruebas usan credenciales y datos nuevos en cada corrida.
        cache: false,
      });
    } catch (error) {
      await navegador.close();
      throw error;
    }
    const [page] = await navegador.context.pages();
    if (!page) throw new Error('Stagehand no creó una página de navegador.');
    // La tabla de celulares pide confirmar con el diálogo nativo del navegador,
    // que bloquearía la página. Se acepta solo.
    await page.addInitScript(() => {
      window.confirm = () => true;
    });
    await page.setViewportSize(1280, 800);
    return new Sesion(nombre, stagehand, navegador, page);
  }

  /** Abre una ruta del front, por ejemplo ir('/admin/users'). */
  async ir(ruta: string): Promise<void> {
    await this.page.goto(`${entorno.front}${ruta}`);
    await this.page.waitForLoadState('load');
  }

  async url(): Promise<string> {
    return this.page.url();
  }

  /** Espera (hasta `ms`) a que la dirección de la página cumpla la condición. */
  async esperarUrl(condicion: (url: string) => boolean, ms = 15_000): Promise<void> {
    const limite = Date.now() + ms;
    while (Date.now() < limite) {
      if (condicion(await this.page.url())) return;
      await this.page.waitForTimeout(250);
    }
    throw new Error(`La dirección no cambió a tiempo (sigue en ${await this.page.url()})`);
  }

  // ───────────── esperas sobre la página ─────────────
  // Las pantallas piden datos después de abrirse y la búsqueda de usuarios espera
  // 0,4 s antes de consultar. Antes de que la IA lea o toque algo se espera a que
  // la pantalla esté lista, así no lee la tabla vieja.

  private async esperarEnPagina<A>(que: string, condicion: (arg: A) => boolean, arg: A, ms: number): Promise<void> {
    const limite = Date.now() + ms;
    while (Date.now() < limite) {
      if (await this.page.evaluate(condicion, arg)) return;
      await this.page.waitForTimeout(250);
    }
    throw new Error(`La pantalla no llegó a estar lista a tiempo: ${que}`);
  }

  /** Espera a que un texto aparezca en la página. */
  async esperarTexto(texto: string, ms = 20_000): Promise<void> {
    await this.esperarEnPagina(
      `no apareció «${texto}»`,
      (t: string) => document.body.innerText.toLowerCase().includes(t),
      texto.toLowerCase(),
      ms,
    );
  }

  /** Espera a que /admin/users termine de filtrar por `termino` y muestre solo filas que lo contienen (o el aviso de sin resultados). */
  async esperarListaUsuarios(termino: string, ms = 20_000): Promise<void> {
    await this.esperarEnPagina(
      `la lista de usuarios no terminó de filtrar por «${termino}»`,
      (t: string) => {
        const texto = document.body.innerText;
        if (/Actualizando la lista|Cargando usuarios/i.test(texto)) return false;
        const filas = Array.from(document.querySelectorAll('tbody tr'));
        if (filas.length === 0) return /Ningún usuario coincide/i.test(texto);
        return filas.every((f) => (f.textContent ?? '').toLowerCase().includes(t));
      },
      termino.toLowerCase(),
      ms,
    );
  }

  /** Espera a que la fila del usuario muestre un estado (por ejemplo /Baneado/ o /Activo/). */
  async esperarFilaUsuario(correo: string, estado: RegExp, ms = 20_000): Promise<void> {
    await this.esperarEnPagina(
      `la fila de ${correo} no mostró ${estado}`,
      (a: { correo: string; patron: string }) => {
        const fila = Array.from(document.querySelectorAll('tbody tr')).find((f) => (f.textContent ?? '').toLowerCase().includes(a.correo));
        return !!fila && new RegExp(a.patron, 'i').test(fila.textContent ?? '');
      },
      { correo: correo.toLowerCase(), patron: estado.source },
      ms,
    );
  }

  /** Textos de los botones de la fila del usuario, leídos del navegador. */
  async botonesDeFila(correo: string): Promise<string[]> {
    return this.page.evaluate((c: string) => {
      const fila = Array.from(document.querySelectorAll('tbody tr')).find((f) => (f.textContent ?? '').toLowerCase().includes(c));
      return fila ? Array.from(fila.querySelectorAll('button')).map((b) => (b.textContent ?? '').trim()) : [];
    }, correo.toLowerCase());
  }

  /** Texto de todos los elementos que cumplan el selector CSS, unidos con « | ». */
  async textoDe(selector: string): Promise<string> {
    return this.page.evaluate(
      (sel: string) => Array.from(document.querySelectorAll(sel)).map((e) => (e.textContent ?? '').trim()).join(' | '),
      selector,
    );
  }

  /** Cuántos elementos hay en la página que cumplan el selector CSS. */
  async contar(selector: string): Promise<number> {
    return this.page.evaluate((sel: string) => document.querySelectorAll(sel).length, selector);
  }

  // ───────────── los tres métodos de Stagehand ─────────────

  /**
   * act. Una acción por llamada: Stagehand falla más cuando se le piden varias.
   * Con `variables`, los valores se escriben en la página pero el modelo solo
   * ve el nombre (%correo%): así las contraseñas no salen del computador.
   */
  async actuar(instruccion: string, variables?: Variables): Promise<void>;
  async actuar(accion: Action): Promise<void>;
  async actuar(que: string | Action, variables?: Variables): Promise<void> {
    const descripcion = typeof que === 'string' ? que : `${que.method ?? 'acción'}: ${que.description}`;
    const t0 = Date.now();
    const r = await conReintentos(() =>
      typeof que === 'string'
        // `variables: undefined` no lo acepta Stagehand: solo se envía si hay variables.
        ? this.stagehand.act(que, {
            page: this.page,
            ...(variables ? { variables } : {}),
            timeout: entorno.timeoutLlamada,
          })
        : this.stagehand.act(que, { page: this.page, timeout: entorno.timeoutLlamada }),
    );
    this.anotar('act', descripcion, t0, r.data.success, r.metadata.usage, r.data.message);
    if (!r.data.success) throw new Error(`act falló: «${descripcion}». ${r.data.message}`);
  }

  /** observe. Devuelve las acciones posibles; no toca la página. */
  async observar(instruccion: string): Promise<Action[]> {
    const t0 = Date.now();
    const r = await conReintentos(() =>
      this.stagehand.observe(instruccion, { page: this.page, timeout: entorno.timeoutLlamada }),
    );
    this.anotar('observe', instruccion, t0, r.data.length > 0, r.metadata.usage, `${r.data.length} elemento(s)`);
    return r.data;
  }

  /** extract. Lee la pantalla y devuelve datos con la forma del esquema. */
  async extraer<S extends z.ZodType>(instruccion: string, esquema: S): Promise<z.output<S>> {
    const t0 = Date.now();
    const r = await conReintentos(() =>
      this.stagehand.extract(instruccion, esquema, { page: this.page, timeout: entorno.timeoutLlamada }),
    );
    this.anotar('extract', instruccion, t0, true, r.metadata.usage, JSON.stringify(r.data));
    return r.data;
  }

  // ───────────── evidencias y cierre ─────────────

  /** Guarda una captura en evidencias/<proveedor>/<prueba>/NN-nombre.png */
  async capturar(que: string): Promise<void> {
    const carpeta = path.join(RAIZ, 'evidencias', entorno.proveedor, this.nombre);
    await mkdir(carpeta, { recursive: true });
    const archivo = `${String(this.capturas.length + 1).padStart(2, '0')}-${que}.png`;
    await writeFile(path.join(carpeta, archivo), await this.page.screenshot());
    this.capturas.push(path.join('evidencias', entorno.proveedor, this.nombre, archivo));
  }

  /** Cierra el navegador y deja el registro de la sesión en resultados/<proveedor>/. */
  async cerrar(): Promise<void> {
    const carpetaResultados = path.join(RAIZ, 'resultados', entorno.proveedor);
    await mkdir(carpetaResultados, { recursive: true });
    const sumar = (campo: 'tokensEntrada' | 'tokensSalida') => this.pasos.reduce((a, p) => a + p[campo], 0);
    await writeFile(
      path.join(carpetaResultados, `${this.nombre}.json`),
      JSON.stringify(
        {
          prueba: this.nombre,
          proveedor: entorno.proveedor,
          modelo: entorno.nombreModelo,
          fecha: new Date().toISOString(),
          segundos: Math.round((Date.now() - this.inicio) / 100) / 10,
          llamadas: {
            act: this.pasos.filter((p) => p.tipo === 'act').length,
            observe: this.pasos.filter((p) => p.tipo === 'observe').length,
            extract: this.pasos.filter((p) => p.tipo === 'extract').length,
          },
          tokensEntrada: sumar('tokensEntrada'),
          tokensSalida: sumar('tokensSalida'),
          capturas: this.capturas,
          pasos: this.pasos,
        },
        null,
        2,
      ),
    );
    await this.stagehand.close().catch(() => undefined);
    await this.navegador.close().catch(() => undefined);
  }

  private anotar(
    tipo: Tipo,
    instruccion: string,
    desde: number,
    exito: boolean,
    uso: { inputTokens: number; outputTokens: number },
    detalle: string,
  ): void {
    this.pasos.push({
      n: this.pasos.length + 1,
      tipo,
      instruccion,
      segundos: Math.round((Date.now() - desde) / 100) / 10,
      exito,
      tokensEntrada: uso.inputTokens,
      tokensSalida: uso.outputTokens,
      detalle: detalle.slice(0, 300),
    });
  }
}

/** Inicia sesión como administrador desde la pantalla, con act (la contraseña no va al modelo). */
export async function entrarComoAdmin(s: Sesion): Promise<void> {
  await s.ir('/login');
  await s.actuar('escribe %correo% en el campo de correo electrónico', { correo: entorno.admin.email });
  await s.actuar('escribe %clave% en el campo de contraseña', { clave: entorno.admin.password });
  await s.actuar('pulsa el botón Ingresar del formulario');
  await s.esperarUrl((url) => !url.includes('/login'));
}
