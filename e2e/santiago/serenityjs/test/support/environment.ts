/**
 * Dónde está corriendo CelularPro.
 *
 * Por defecto son las direcciones del docker-compose del front
 * (`docker compose -p celularpro up -d`): el front en el puerto 8081 y la API
 * en el 3001, con la base recién cargada desde el seed. Si la app corre en
 * otro lado, se cambian con variables de entorno (ver README).
 */
export const environment = {
  frontUrl: process.env.E2E_FRONT_URL ?? 'http://localhost:8081',
  apiUrl: process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1',
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@celularpro.co',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'admin1234',
  },
};

/** URL completa de una página del front, por ejemplo pageAt('/admin/users'). */
export const pageAt = (path: string): string => `${ environment.frontUrl }${ path }`;
