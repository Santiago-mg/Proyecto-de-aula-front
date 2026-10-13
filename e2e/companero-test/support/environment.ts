/**
 * Dónde está corriendo CelularPro. Las especificaciones originales tenían
 * escrito http://localhost:5173 (el servidor de desarrollo de Vite); aquí se
 * lee de variables de entorno y, por defecto, apunta a las direcciones del
 * docker-compose del front (front en 8081, API en 3001).
 */
export const environment = {
  frontUrl: process.env.E2E_FRONT_URL ?? 'http://localhost:8081',
  apiUrl: process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1',
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@celularpro.co',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'admin1234',
  },
  // Las especificaciones originales dan por hecho que este cliente ya existe.
  cliente: {
    name: 'Cliente de Prueba',
    email: process.env.E2E_CLIENT_EMAIL ?? 'test@test.com',
    password: process.env.E2E_CLIENT_PASSWORD ?? 'password123',
  },
}

export const pageAt = (ruta: string): string => `${environment.frontUrl}${ruta}`
