import { z } from 'zod'

// Reglas de credenciales: copia de las del backend (src/domain/credenciales.ts y
// src/application/dtos/auth.dto.ts de Proyecto-de-aula-mario). El servidor es
// quien decide; estas reglas existen para avisar antes de enviar el formulario.
// Si cambian allá, deben cambiar aquí: test/unit/validacion-credenciales/
// reglas-backend.test.ts fija los mismos valores que la regresión del backend.

/** Dominios con los que el backend permite CREAR una cuenta. */
export const DOMINIOS_PERMITIDOS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
] as const

export const MENSAJE_DOMINIO = 'Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud.'

export const PASSWORD_MIN = 8
// bcrypt solo usa los primeros 72 bytes: una clave más larga se cortaría en silencio.
export const PASSWORD_MAX = 72

export const MENSAJES_PASSWORD = {
  corta: 'La contraseña debe tener al menos 8 caracteres',
  larga: 'La contraseña no puede superar 72 caracteres',
  minuscula: 'La contraseña debe incluir al menos una letra minúscula',
  mayuscula: 'La contraseña debe incluir al menos una letra mayúscula',
  numero: 'La contraseña debe incluir al menos un número',
} as const

export const AYUDA_CONTRASENA = 'Mínimo 8 caracteres, con mayúscula, minúscula y número.'

/** El correo se guarda y se busca siempre en minúsculas y sin espacios. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function dominioPermitido(email: string): boolean {
  const dominio = normalizarEmail(email).split('@')[1] ?? ''
  return (DOMINIOS_PERMITIDOS as readonly string[]).includes(dominio)
}

// Correo para INICIAR SESIÓN: formato y normalización, sin lista de dominios
// (igual que el backend, para no bloquear cuentas existentes como
// admin@celularpro.co).
export const emailSchema = z.string().trim().toLowerCase().email('Correo electrónico inválido')

// Correo para CREAR LA CUENTA: además exige uno de los dominios permitidos.
export const emailRegistroSchema = emailSchema.refine(dominioPermitido, { message: MENSAJE_DOMINIO })

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(80, 'El nombre no puede superar los 80 caracteres')

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, MENSAJES_PASSWORD.corta)
  .max(PASSWORD_MAX, MENSAJES_PASSWORD.larga)
  .regex(/[a-z]/, MENSAJES_PASSWORD.minuscula)
  .regex(/[A-Z]/, MENSAJES_PASSWORD.mayuscula)
  .regex(/\d/, MENSAJES_PASSWORD.numero)

// Topes del catálogo. Reflejan los del backend (application/dtos/phone.dto.ts):
// la base guarda estos campos como entero de 32 bits y, sin tope, un número
// enorme pasaba el formulario y volvía como un error genérico del servidor.
export const LIMITES_CELULAR = {
  stock: 1_000_000,
  precio: 100_000_000,
} as const
