import { sesionIniciada } from '../../../helpers/fixtures'

/**
 * Datos de ataque para security-testing del front.
 *
 * Son el equivalente de las pruebas de sanitizar_entrada() del curso: texto
 * con HTML que, si la interfaz lo insertara como HTML en vez de como texto,
 * crearía elementos y ejecutaría código (XSS). React escapa todo lo que se
 * pinta con {variable}; estas pruebas fijan que nadie lo cambie por
 * dangerouslySetInnerHTML.
 */
export const XSS_IMAGEN = '<img src="x" onerror="alert(1)">'
export const XSS_SCRIPT = "<script>alert('x')</script>"

/** ¿Se coló algún elemento creado por los payloads de arriba? */
export function hayHtmlInyectado(contenedor: ParentNode = document): boolean {
  return (
    contenedor.querySelector('img[src="x"]') !== null ||
    [...contenedor.querySelectorAll('script')].some((s) => s.textContent?.includes('alert'))
  )
}

/**
 * Quién no puede entrar a una pantalla del panel y a dónde lo manda la app.
 * Es el mismo control que AdminRoute aplica a todas las rutas /admin.
 */
export const SIN_PERMISO_DE_ADMIN: Array<[string, () => void, string, string]> = [
  ['sin sesión', () => {}, 'Ingresar', '/login'],
  ['con sesión de rol USER', () => sesionIniciada(), 'Acceso no autorizado', '/unauthorized'],
]
