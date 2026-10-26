// Búsqueda tolerante a errores de escritura.
//
// La búsqueda real la hace el servidor; esto solo ayuda cuando no devuelve
// nada: si el usuario escribió "ifone" o "samsumg", le proponemos "iphone" o
// "samsung" para que no se quede mirando una pantalla vacía. No manda
// peticiones nuevas: trabaja con una lista de marcas y con los nombres de los
// equipos que ya llegaron en respuestas anteriores.

const CLAVE_VOCABULARIO = 'cp_vocab'
const MAXIMO_APRENDIDO = 300

/** Marcas, líneas y palabras que la gente suele buscar. */
export const VOCABULARIO_BASE = [
  'iphone', 'apple', 'samsung', 'galaxy', 'xiaomi', 'redmi', 'poco', 'motorola', 'moto',
  'pixel', 'google', 'huawei', 'honor', 'oppo', 'realme', 'oneplus', 'nokia', 'tecno',
  'infinix', 'zte', 'pro', 'max', 'plus', 'ultra', 'mini', 'note', 'edge', 'fold', 'flip',
  'nuevo', 'usado', 'certificado', 'verificado',
]

/** Minúsculas, sin tildes y con espacios simples. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Distancia de edición con transposición ("ihpone" → "iphone" cuenta como 1).
 * Es la variante "optimal string alignment" de Damerau-Levenshtein.
 */
export function distancia(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const filas: number[][] = Array.from({ length: a.length + 1 }, (_, i) => {
    const fila = new Array<number>(b.length + 1).fill(0)
    fila[0] = i
    return fila
  })
  for (let j = 0; j <= b.length; j++) filas[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1
      filas[i][j] = Math.min(
        filas[i - 1][j] + 1,
        filas[i][j - 1] + 1,
        filas[i - 1][j - 1] + costo,
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        filas[i][j] = Math.min(filas[i][j], filas[i - 2][j - 2] + 1)
      }
    }
  }
  return filas[a.length][b.length]
}

// Cuántas letras de diferencia se aceptan según el largo de la palabra:
// en palabras cortas un solo cambio ya es otra palabra.
function toleranciaPara(palabra: string): number {
  if (palabra.length <= 3) return 0
  if (palabra.length <= 6) return 1
  return 2
}

/**
 * Aproximación de cómo suena la palabra al leerla en español, para que
 * "ifone" y "iphone" (o "galaksi" y "galaxy") queden a distancia cero.
 */
export function clave(palabra: string): string {
  return palabra
    .replace(/ph/g, 'f')
    .replace(/ck|qu/g, 'k')
    .replace(/c(?=[ei])/g, 's')
    .replace(/c/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/[zs]/g, 's')
    .replace(/[vb]/g, 'b')
    .replace(/[wu]/g, 'u')
    .replace(/[yi]/g, 'i')
    .replace(/h/g, '')
}

function masParecida(palabra: string, vocabulario: Set<string>): string | null {
  const tolerancia = toleranciaPara(palabra)
  if (tolerancia === 0) return null

  const clavePalabra = clave(palabra)
  let mejor: string | null = null
  let mejorPuntaje: [number, number] = [tolerancia + 1, Infinity]

  for (const candidata of vocabulario) {
    // Ahorra cálculo: si el largo ya difiere más que la tolerancia, no sirve.
    if (Math.abs(candidata.length - palabra.length) > tolerancia) continue

    const escrito = distancia(palabra, candidata)
    if (escrito === 0) continue
    const parecido = Math.min(escrito, distancia(clavePalabra, clave(candidata)))
    if (parecido > tolerancia) continue

    // Gana el que más se parece y, a igual parecido, el que se escribe más cerca.
    const mejora =
      parecido < mejorPuntaje[0] ||
      (parecido === mejorPuntaje[0] && escrito < mejorPuntaje[1]) ||
      (parecido === mejorPuntaje[0] && escrito === mejorPuntaje[1] && mejor !== null && candidata < mejor)
    if (mejora) {
      mejor = candidata
      mejorPuntaje = [parecido, escrito]
    }
  }
  return mejor
}

/**
 * Devuelve la búsqueda corregida, o null si no hay nada que corregir (todas las
 * palabras existen, tienen números o están demasiado lejos de cualquier opción).
 */
export function sugerir(consulta: string, vocabulario: Iterable<string>): string | null {
  const conocidas = new Set<string>()
  for (const palabra of vocabulario) conocidas.add(normalizar(palabra))

  const original = normalizar(consulta)
  if (!original) return null

  let cambio = false
  const corregida = original.split(' ').map((palabra) => {
    // Los modelos con número ("s24", "15") no se tocan: no se pueden adivinar.
    if (/\d/.test(palabra) || conocidas.has(palabra)) return palabra
    const candidata = masParecida(palabra, conocidas)
    if (candidata === null) return palabra
    cambio = true
    return candidata
  })

  return cambio ? corregida.join(' ') : null
}

/** Palabras de un nombre de equipo que sirven para sugerir (sin números). */
export function palabrasDe(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 3 && !/\d/.test(p))
}

// ─── Vocabulario aprendido ────────────────────────────────────────────────
// Se guarda en el navegador para que las sugerencias mejoren con el uso.

export function leerVocabulario(): string[] {
  try {
    const crudo = localStorage.getItem(CLAVE_VOCABULARIO)
    const lista: unknown = crudo ? JSON.parse(crudo) : []
    return Array.isArray(lista) ? lista.filter((p): p is string => typeof p === 'string') : []
  } catch {
    return []
  }
}

/** Suma las palabras de los equipos que acaban de llegar del servidor. */
export function aprenderVocabulario(textos: string[]): void {
  try {
    const actual = leerVocabulario()
    const conocidas = new Set(actual)
    for (const texto of textos) {
      for (const palabra of palabrasDe(texto)) conocidas.add(palabra)
    }
    // Si se pasa del tope se descartan las más viejas, que están al principio.
    const lista = [...conocidas].slice(-MAXIMO_APRENDIDO)
    localStorage.setItem(CLAVE_VOCABULARIO, JSON.stringify(lista))
  } catch {
    // Sin almacenamiento disponible las sugerencias usan solo la lista base.
  }
}

/** Todo lo que se sabe para sugerir: la lista base más lo aprendido. */
export function vocabularioCompleto(): string[] {
  return [...VOCABULARIO_BASE, ...leerVocabulario()]
}
