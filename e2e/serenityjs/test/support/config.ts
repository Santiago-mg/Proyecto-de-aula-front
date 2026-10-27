// Dónde corre la aplicación y con qué cuenta de administrador se prueba.
// Se cambian con variables de entorno, sin tocar el código:
//   BASE_URL=http://localhost:5173 ADMIN_EMAIL=admin@celularpro.co ADMIN_PASSWORD=admin1234 npm test
export const config = {
  baseUrl: (process.env.BASE_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@celularpro.co',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin1234',
};

export const url = (ruta: string) => `${ config.baseUrl }${ ruta.startsWith('/') ? ruta : `/${ ruta }` }`;
