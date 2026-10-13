/**
 * Herramientas de medición de performance-testing (las mismas del back).
 *
 * Equivalentes del ejemplo del profesor en Python:
 *
 *   time.perf_counter()            →  medir()
 *   timeit.repeat(number=1, ...)   →  repetir()
 *   statistics.median()            →  mediana()
 *
 * Todo se mide en milisegundos, que es la unidad de performance.now().
 */

/** Ejecuta la operación una vez y devuelve su resultado y cuánto tardó. */
export async function medir<T>(
  operacion: () => Promise<T> | T,
): Promise<{ resultado: T; ms: number }> {
  const inicio = performance.now()
  const resultado = await operacion()
  return { resultado, ms: performance.now() - inicio }
}

/** Ejecuta la operación varias veces y devuelve la duración de cada una. */
export async function repetir(
  operacion: () => Promise<unknown> | unknown,
  veces = 5,
): Promise<number[]> {
  const tiempos: number[] = []
  for (let i = 0; i < veces; i++) {
    const { ms } = await medir(operacion)
    tiempos.push(ms)
  }
  return tiempos
}

/** Mediana: a diferencia del promedio, una medición atípica no la arrastra. */
export function mediana(valores: number[]): number {
  if (valores.length === 0) throw new Error('No hay mediciones')
  const ordenados = [...valores].sort((a, b) => a - b)
  const mitad = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 === 0
    ? (ordenados[mitad - 1] + ordenados[mitad]) / 2
    : ordenados[mitad]
}
