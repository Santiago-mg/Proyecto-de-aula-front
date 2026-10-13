import { AxiosError } from 'axios'

/**
 * Espera una promesa que DEBE fallar y devuelve el error (Chai no trae
 * aserciones para promesas). Es la misma ayuda que usa la suite del back.
 */
export async function capturarError(promesa: Promise<unknown>): Promise<unknown> {
  try {
    await promesa
  } catch (error) {
    return error
  }
  throw new Error('Se esperaba que la operación fallara, pero terminó bien')
}

/** Igual que capturarError, pero comprueba que sea un error de axios y lo tipa. */
export async function capturarErrorHttp(promesa: Promise<unknown>): Promise<AxiosError<{ error?: string }>> {
  const error = await capturarError(promesa)
  if (!(error instanceof AxiosError)) {
    throw new Error(`Se esperaba un AxiosError y llegó: ${String(error)}`)
  }
  return error as AxiosError<{ error?: string }>
}

/** Una respuesta que el test entrega cuando quiere, para simular una red lenta. */
export function respuestaDiferida<T>() {
  let entregar!: (valor: T) => void
  const promesa = new Promise<T>((resolver) => {
    entregar = resolver
  })
  return { promesa, entregar }
}
