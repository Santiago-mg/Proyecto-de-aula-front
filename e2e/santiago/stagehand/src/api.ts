/**
 * Llamadas directas a la API de CelularPro.
 *
 * Sirven para dos cosas: preparar datos antes de la prueba (crear un usuario,
 * banearlo) y comprobar después, con otra fuente, lo que Stagehand leyó o hizo
 * en pantalla. El modelo puede equivocarse; la API es la verdad.
 */
import { entorno } from './entorno.js';

export interface Usuario {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Celular {
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  stock: number;
}

async function pedir(ruta: string, opciones: { metodo?: string; token?: string; cuerpo?: unknown } = {}) {
  const respuesta = await fetch(`${entorno.api}/${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
    },
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  });
  const texto = await respuesta.text();
  let json: any = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    // Respuesta que no es JSON: se deja en null.
  }
  return { status: respuesta.status, ok: respuesta.ok, json };
}

/** Sufijo único por corrida: los correos y slugs nunca chocan con los de otra vez. */
export const corrida = Date.now().toString(36);
let contador = 0;
export const unico = (): string => `${corrida}${(contador++).toString(36)}`;

export async function tokenAdmin(): Promise<string> {
  const r = await pedir('auth/login', {
    metodo: 'POST',
    cuerpo: { email: entorno.admin.email, password: entorno.admin.password },
  });
  if (!r.ok) throw new Error(`No se pudo iniciar sesión como admin (${r.status}). ¿Está encendida la API?`);
  return r.json.data.token as string;
}

export async function crearUsuario(nombre: string): Promise<Usuario> {
  const sufijo = unico();
  const usuario = {
    name: `${nombre} Stagehand`,
    email: `${nombre.toLowerCase()}.sh.${sufijo}@gmail.com`,
    password: 'ClaveSegura123',
  };
  const r = await pedir('auth/register', { metodo: 'POST', cuerpo: usuario });
  if (r.status !== 201) throw new Error(`No se pudo crear a ${usuario.email} (${r.status})`);
  return { ...usuario, id: r.json.data.user.id as string };
}

export const iniciarSesion = (email: string, password: string) =>
  pedir('auth/login', { metodo: 'POST', cuerpo: { email, password } });

export const banear = (token: string, id: string, motivo: string) =>
  pedir(`admin/users/${id}/ban`, { metodo: 'PUT', token, cuerpo: { reason: motivo } });

export const desbanear = (token: string, id: string) =>
  pedir(`admin/users/${id}/unban`, { metodo: 'PUT', token });

export async function listarUsuarios(token: string, busqueda: string) {
  const r = await pedir(`admin/users?page=1&limit=50&search=${encodeURIComponent(busqueda)}`, { token });
  return {
    correos: ((r.json?.data ?? []) as Array<{ email: string }>).map((u) => u.email),
    total: (r.json?.meta?.total ?? 0) as number,
  };
}

export async function estadisticas(token: string) {
  const r = await pedir('admin/stats', { token });
  return r.json.data as {
    users: { total: number; banned: number; newThisWeek: number; admins: number };
    phones: { total: number; inStock: number; outOfStock: number; verified: number };
    orders: {
      total: number; pending: number; confirmed: number;
      shipped: number; delivered: number; cancelled: number;
    };
  };
}

export const publicarCelular = (token: string, c: Celular) =>
  pedir('phones', { metodo: 'POST', token, cuerpo: { ...c, condition: 'NEW' } });

export const buscarCelular = (slug: string) => pedir(`phones/${slug}`);

export async function borrarCelular(token: string, slug: string): Promise<void> {
  const r = await buscarCelular(slug);
  if (r.status === 200) await pedir(`phones/${r.json.data.id}`, { metodo: 'DELETE', token });
}

export async function recomendaciones(slug: string): Promise<string[]> {
  // El front pide 4 (SimilarPhones → getSimilar con limit = 4); aquí se pide lo mismo.
  const r = await pedir(`phones/${slug}/similares?limit=4`);
  return ((r.json?.data ?? []) as Array<{ name: string }>).map((p) => p.name);
}
