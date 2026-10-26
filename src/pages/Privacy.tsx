import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { useConfirmacion } from '../components/ui/ConfirmDialog'
import { CORREO_SOPORTE } from '../content/ayuda'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const DATOS_EN_EL_NAVEGADOR = [
  { dato: 'Tu sesión', para: 'Que no tengas que ingresar en cada página. Se borra al cerrar sesión.' },
  { dato: 'Tu carrito', para: 'Que no lo pierdas si cierras la pestaña.' },
  { dato: 'Tus preferencias de pantalla', para: 'Recordar el tema, el tamaño del texto y las animaciones.' },
  { dato: 'Los datos de entrega que vas escribiendo', para: 'Que no los pierdas si se cae la conexión. Se borran al confirmar el pedido o al cerrar sesión.' },
  { dato: 'Los equipos que viste y las palabras que buscaste', para: 'Mostrarte "Vistos recientemente" y sugerirte la búsqueda si te equivocas al escribir.' },
]

export function Privacy() {
  useDocumentTitle('Privacidad de tus datos')
  const { logout } = useAuth()
  const { clearCart } = useCart()
  const { showToast } = useToast()
  const { pedir, dialogo } = useConfirmacion()

  async function borrarTodo() {
    const confirmado = await pedir({
      titulo: '¿Borrar lo que guarda este navegador?',
      mensaje: 'Se cierra tu sesión, se vacía el carrito y se borran tus preferencias y borradores. Tus pedidos ya hechos no se tocan.',
      confirmar: 'Borrar todo',
      peligro: true,
    })
    if (!confirmado) return
    logout()
    clearCart()
    try {
      for (const clave of Object.keys(localStorage)) {
        if (clave.startsWith('cp_')) localStorage.removeItem(clave)
      }
    } catch {
      // sin almacenamiento no hay nada más que borrar
    }
    showToast('Listo: este navegador ya no guarda datos tuyos')
  }

  return (
    <div className="cp-container cp-help cp-legal">
      <Breadcrumbs migas={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Privacidad' }]} />

      <header className="cp-help-header">
        <div className="cp-eyebrow">— Tus datos</div>
        <h1 className="cp-page-title">Privacidad de tus datos</h1>
        <p className="cp-page-lead">Qué pedimos, para qué lo usamos y cómo puedes borrarlo.</p>
      </header>

      <section className="cp-help-section" aria-labelledby="priv-pedimos">
        <h2 id="priv-pedimos" className="cp-help-section-title">Qué datos pedimos</h2>
        <ul className="cp-legal-list">
          <li>
            <strong>Al crear la cuenta:</strong> nombre, correo y contraseña. Los usamos para que puedas ingresar y ver tus pedidos.
          </li>
          <li>
            <strong>Al comprar:</strong> nombre, correo, teléfono, dirección, ciudad y departamento. Los usamos para entregar el pedido y para contactarte si hay un problema con él.
          </li>
        </ul>
      </section>

      <section className="cp-help-section" aria-labelledby="priv-navegador">
        <h2 id="priv-navegador" className="cp-help-section-title">Qué guarda tu navegador</h2>
        <p className="cp-help-text">
          Esta página guarda algunas cosas en tu navegador para funcionar mejor. No usa cookies de seguimiento ni herramientas de analítica o publicidad, y tu contraseña nunca se guarda ahí.
        </p>
        <ul className="cp-legal-list">
          {DATOS_EN_EL_NAVEGADOR.map((d) => (
            <li key={d.dato}>
              <strong>{d.dato}.</strong> {d.para}
            </li>
          ))}
        </ul>
      </section>

      <section className="cp-help-section" aria-labelledby="priv-externos">
        <h2 id="priv-externos" className="cp-help-section-title">Servicios externos</h2>
        <p className="cp-help-text">
          Las tipografías se cargan desde Google Fonts y algunas imágenes desde otros sitios. Al pedirlas, esos servidores ven tu dirección IP, como ocurre en cualquier página web.
        </p>
      </section>

      <section className="cp-help-section" aria-labelledby="priv-control">
        <h2 id="priv-control" className="cp-help-section-title">Tú decides</h2>
        <p className="cp-help-text">
          Puedes borrar en cualquier momento lo que guarda este navegador. Si quieres que corrijamos o eliminemos los datos de tu cuenta, escríbenos a{' '}
          <a className="cp-link" href={`mailto:${CORREO_SOPORTE}`}>{CORREO_SOPORTE}</a>.
        </p>
        <div className="cp-help-actions">
          <button type="button" className="cp-btn cp-btn-secondary" onClick={borrarTodo}>
            <Trash2 size={14} aria-hidden="true" /> Borrar lo que guarda este navegador
          </button>
          <Link to="/ayuda" className="cp-btn cp-btn-ghost">Ir al centro de ayuda</Link>
        </div>
      </section>

      {dialogo}
    </div>
  )
}
