// Una promesa puede rechazar con cualquier valor; la interfaz siempre trabaja
// con Error para poder mostrarlo con <ErrorMessage />.
export function comoError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
}
