// "Vistos recientemente": los últimos equipos que la persona abrió, guardados
// solo en este navegador (clave cp_vistos, ver /privacidad). Sirve para volver
// a un equipo sin tener que recordar cómo se llamaba (heurística 6).

const CLAVE = 'cp_vistos'
const MAXIMO = 8

export interface Visto {
  slug: string
  name: string
  price: number
  heroImage: string | null
}

function esVisto(valor: unknown): valor is Visto {
  if (!valor || typeof valor !== 'object') return false
  const v = valor as Record<string, unknown>
  return (
    typeof v.slug === 'string' &&
    typeof v.name === 'string' &&
    typeof v.price === 'number' &&
    (v.heroImage === null || typeof v.heroImage === 'string')
  )
}

export function leerVistos(): Visto[] {
  try {
    const crudo = localStorage.getItem(CLAVE)
    const lista: unknown = crudo ? JSON.parse(crudo) : []
    return Array.isArray(lista) ? lista.filter(esVisto) : []
  } catch {
    return []
  }
}

/** Pone el equipo de primero; si ya estaba, no se repite. */
export function registrarVisto(visto: Visto): void {
  try {
    const resto = leerVistos().filter((v) => v.slug !== visto.slug)
    const lista = [{ slug: visto.slug, name: visto.name, price: visto.price, heroImage: visto.heroImage }, ...resto]
    localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, MAXIMO)))
  } catch {
    // sin almacenamiento simplemente no hay historial
  }
}

export function borrarVistos(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
}
