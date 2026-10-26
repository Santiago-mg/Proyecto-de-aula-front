/**
 * Datos de prueba.
 *
 * Cada corrida usa correos y slugs que no existen todavía (llevan un sufijo
 * único), así las pruebas no dependen de lo que dejaron corridas anteriores y
 * se pueden repetir sin reiniciar la base. Dentro de una misma prueba,
 * "Carlos" o "el celular de prueba" son siempre los mismos: por eso se
 * guardan en un registro que se vacía antes de cada prueba.
 */

export interface Customer {
  firstName: string
  name: string
  email: string
  password: string
  /** Lo asigna la API al registrar la cuenta. */
  id?: string
}

export interface TestPhone {
  name: string
  slug: string
  brand: string
  categoryId: string
  categoryLabel: string
  price: number
  stock: number
  /** Lo asigna la API al publicar el celular. */
  id?: string
}

const runId = Date.now().toString(36)
let sequence = 0
const uniqueSuffix = (): string => `${runId}${(sequence++).toString(36)}`

const customers = new Map<string, Customer>()
let testPhone: TestPhone | undefined
const phonesToRemove: TestPhone[] = []

export const TestData = {
  /** Se llama antes de cada prueba (support/e2e.ts). */
  reset(): void {
    customers.clear()
    testPhone = undefined
  },

  /** El cliente de esta prueba con ese nombre: Carlos, Bruno... */
  customer(firstName: string): Customer {
    let customer = customers.get(firstName)
    if (!customer) {
      const suffix = uniqueSuffix()
      customer = {
        firstName,
        name: `${firstName} Prueba`,
        email: `${firstName.toLowerCase()}.e2e.${suffix}@gmail.com`,
        password: 'ClaveSegura123',
      }
      customers.set(firstName, customer)
    }
    return customer
  },

  /**
   * "El celular de prueba" de esta prueba. Por defecto es un Nokia barato que
   * no se parece a ningún celular del seed, para no alterar las
   * recomendaciones que revisan otras pruebas.
   */
  phone(): TestPhone {
    if (!testPhone) {
      const suffix = uniqueSuffix()
      testPhone = {
        name: `Nokia E2E ${suffix}`,
        slug: `nokia-e2e-${suffix}`,
        brand: 'Nokia',
        categoryId: 'motorola',
        categoryLabel: 'Motorola',
        price: 199_000,
        stock: 4,
      }
      phonesToRemove.push(testPhone)
    }
    return testPhone
  },

  /**
   * ESC-13: un celular de prueba que se parece al iPhone 15 Pro Max del seed
   * (misma marca, misma categoría y precio dentro del ±25 %).
   */
  phoneSimilarToTheIphone15ProMax(stock: number): TestPhone {
    if (!testPhone) {
      const suffix = uniqueSuffix()
      testPhone = {
        name: `iPhone E2E ${suffix}`,
        slug: `iphone-e2e-${suffix}`,
        brand: 'Apple',
        categoryId: 'apple',
        categoryLabel: 'iPhone (Apple)',
        price: 1_250_000,
        stock,
      }
      phonesToRemove.push(testPhone)
    }
    return testPhone
  },

  /** Celulares que hay que borrar al terminar la prueba. */
  phonesToRemove(): TestPhone[] {
    return phonesToRemove.splice(0)
  },
}
