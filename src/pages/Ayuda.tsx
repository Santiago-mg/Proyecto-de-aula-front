import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTituloPagina } from '../hooks/useTituloPagina'
import { ATAJOS } from '../hooks/useAtajosTeclado'
import { DOMINIOS_PERMITIDOS } from '../utils/validacion'

// Heurística 10 (ayuda y documentación). Antes solo había un correo en el pie,
// que ni siquiera aparecía en Ingresar ni en Crear cuenta. Esta página:
//   - responde las preguntas frecuentes (FAQ),
//   - guía para resolver los problemas típicos, con ejemplos,
//   - explica las garantías (el enlace "Garantías" antes llevaba al catálogo),
//   - lista los atajos de teclado,
//   - y deja el contacto como último recurso.
// Se enlaza desde el menú, el pie, Ingresar, Crear cuenta, Mi perfil y los errores.

export const CORREO_SOPORTE = 'soporte@celularpro.co'

const PREGUNTAS = [
  {
    id: 'faq-correo',
    pregunta: '¿Qué correos puedo usar para crear mi cuenta?',
    respuesta: (
      <>
        <p>
          Solo correos de {DOMINIOS_PERMITIDOS.map((d) => `@${d}`).join(', ')}. Así reducimos cuentas
          falsas y aseguramos que te lleguen los avisos de tus pedidos.
        </p>
        <ul className="cp-ayuda-ejemplos">
          <li className="ok">ana.perez@gmail.com — se acepta</li>
          <li className="ok">Ana.Perez@Outlook.com — se acepta (se guarda en minúsculas)</li>
          <li className="no">ana@miempresa.com — no se acepta</li>
          <li className="no">ana@unal.edu.co — no se acepta</li>
        </ul>
      </>
    ),
  },
  {
    id: 'faq-contrasena',
    pregunta: '¿Cómo debe ser mi contraseña?',
    respuesta: (
      <>
        <p>Entre 8 y 72 caracteres, con al menos una mayúscula, una minúscula y un número.</p>
        <ul className="cp-ayuda-ejemplos">
          <li className="ok">Medellin2026 — cumple</li>
          <li className="no">medellin2026 — le falta una mayúscula</li>
          <li className="no">MEDELLIN — le faltan una minúscula y un número</li>
          <li className="no">Med1 — es demasiado corta</li>
        </ul>
        <p>Mientras escribes, el formulario marca cada requisito que ya cumples.</p>
      </>
    ),
  },
  {
    id: 'faq-mayusculas',
    pregunta: '¿Importa si escribo mi correo con mayúsculas?',
    respuesta: <p>No. «Ana@Gmail.com» y «ana@gmail.com» son la misma cuenta, al registrarte y al ingresar.</p>,
  },
  {
    id: 'faq-cuanto-dura',
    pregunta: '¿Cuánto tiempo sigo con la sesión iniciada?',
    respuesta: (
      <p>
        Hasta 7 días en el mismo navegador, aunque lo cierres. Si usas un computador compartido, entra
        a <strong>Mi cuenta</strong> y pulsa <strong>Cerrar sesión en este equipo</strong> al terminar.
      </p>
    ),
  },
  {
    id: 'faq-perfil',
    pregunta: '¿Puedo cambiar mi nombre, mi correo o mi contraseña?',
    respuesta: (
      <p>
        El nombre y la contraseña sí, desde <Link to="/profile" className="cp-link">Mi perfil</Link>. El
        correo no: es tu usuario. Si necesitas cambiarlo, escríbenos.
      </p>
    ),
  },
  {
    id: 'faq-admin',
    pregunta: 'Vi «Acceso no autorizado». ¿Qué significa?',
    respuesta: (
      <p>
        Intentaste abrir una sección del panel de administración con una cuenta de cliente. No es un
        error de tu cuenta: esas pantallas son solo para el equipo de CelularPro.
      </p>
    ),
  },
]

const GUIAS = [
  {
    id: 'guia-no-puedo-ingresar',
    titulo: 'No puedo ingresar',
    pasos: [
      'Revisa que el correo sea el mismo con el que te registraste (no importan las mayúsculas).',
      'La contraseña sí distingue mayúsculas: revisa que no tengas activado el Bloq Mayús. Usa el botón del ojo para verla.',
      'Si aparece «Credenciales inválidas», uno de los dos datos no coincide. Por seguridad no decimos cuál.',
      'Si aparece «Demasiados intentos fallidos», espera los minutos que indica el mensaje antes de volver a intentar.',
      `Si olvidaste la contraseña, escríbenos a ${CORREO_SOPORTE} desde el correo de tu cuenta.`,
    ],
  },
  {
    id: 'guia-sesion-cerrada',
    titulo: 'La página me devolvió a «Ingresar»',
    pasos: [
      'Lee el aviso amarillo de la parte superior: dice por qué se cerró la sesión.',
      '«Tu sesión ya no es válida»: pasaron más de 7 días o la sesión se dañó. Vuelve a ingresar.',
      '«Tu cuenta ha sido suspendida»: un administrador la suspendió; el aviso incluye el motivo. Escríbenos si crees que es un error.',
    ],
  },
  {
    id: 'guia-sin-conexion',
    titulo: 'Aparece «No hay conexión con el servidor»',
    pasos: [
      'Revisa tu conexión a internet; si se cortó, verás una franja que lo indica.',
      'Cuando vuelva la conexión, pulsa «Reintentar» o repite la acción.',
      'Lo que ya enviaste con éxito no se pierde: tu sesión y tu carrito se guardan en el navegador.',
    ],
  },
]

export function Ayuda() {
  useTituloPagina('Ayuda')
  const { hash } = useLocation()

  // React Router no baja solo hasta el #ancla: se hace aquí para que los
  // enlaces "Garantías", "Contacto" y "Atajos" lleven a su sección.
  useEffect(() => {
    if (!hash) return
    const destino = document.getElementById(hash.slice(1))
    destino?.scrollIntoView?.({ block: 'start' })
    if (destino instanceof HTMLDetailsElement) destino.open = true
  }, [hash])

  return (
    <div className="cp-container cp-ayuda">
      <nav aria-label="Ruta de navegación" className="cp-breadcrumb">
        <Link to="/" className="cp-link">Inicio</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Ayuda</span>
      </nav>

      <h1 className="cp-auth-title">Centro de ayuda</h1>
      <p className="cp-auth-sub">Respuestas rápidas sobre tu cuenta, tus pedidos y tus garantías.</p>

      <nav aria-label="Secciones de la ayuda" className="cp-ayuda-indice">
        <a href="#preguntas" className="cp-link">Preguntas frecuentes</a>
        <a href="#problemas" className="cp-link">Resolver problemas</a>
        <a href="#garantias" className="cp-link">Garantías</a>
        <a href="#atajos" className="cp-link">Atajos de teclado</a>
        <a href="#contacto" className="cp-link">Contacto</a>
      </nav>

      <section id="preguntas" aria-labelledby="titulo-preguntas" className="cp-ayuda-seccion">
        <h2 id="titulo-preguntas" className="cp-profile-heading">Preguntas frecuentes</h2>
        {PREGUNTAS.map((p) => (
          <details key={p.id} id={p.id} className="cp-faq">
            <summary>{p.pregunta}</summary>
            <div className="cp-faq-respuesta">{p.respuesta}</div>
          </details>
        ))}
      </section>

      <section id="problemas" aria-labelledby="titulo-problemas" className="cp-ayuda-seccion">
        <h2 id="titulo-problemas" className="cp-profile-heading">Resolver problemas</h2>
        {GUIAS.map((g) => (
          <article key={g.id} id={g.id} className="cp-guia">
            <h3>{g.titulo}</h3>
            <ol>
              {g.pasos.map((paso) => (
                <li key={paso}>{paso}</li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section id="garantias" aria-labelledby="titulo-garantias" className="cp-ayuda-seccion">
        <h2 id="titulo-garantias" className="cp-profile-heading">Garantías</h2>
        <ul>
          <li><strong>Certificados:</strong> 6 meses, después de una inspección de 32 puntos.</li>
          <li><strong>Usados verificados:</strong> 30 días.</li>
        </ul>
        <p>
          Para hacerla válida, escríbenos con la referencia del pedido (la ves en{' '}
          <Link to="/dashboard" className="cp-link">Mi cuenta</Link>, por ejemplo «CP-3F9A1C»).
        </p>
      </section>

      <section id="atajos" aria-labelledby="titulo-atajos" className="cp-ayuda-seccion">
        <h2 id="titulo-atajos" className="cp-profile-heading">Atajos de teclado</h2>
        <p>Funcionan en cualquier pantalla de la tienda, siempre que no estés escribiendo en un campo.</p>
        <table className="cp-atajos">
          <thead>
            <tr><th scope="col">Tecla</th><th scope="col">Qué hace</th></tr>
          </thead>
          <tbody>
            {ATAJOS.map((a) => (
              <tr key={a.tecla}>
                <td><kbd>{a.tecla}</kbd></td>
                <td>{a.descripcion}</td>
              </tr>
            ))}
            <tr>
              <td><kbd>Tab</kbd> / <kbd>Mayús + Tab</kbd></td>
              <td>Pasar al siguiente o al anterior elemento</td>
            </tr>
            <tr>
              <td><kbd>Enter</kbd></td>
              <td>Enviar el formulario en el que estás</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="contacto" aria-labelledby="titulo-contacto" className="cp-ayuda-seccion">
        <h2 id="titulo-contacto" className="cp-profile-heading">Contacto</h2>
        <p>
          ¿No encontraste la respuesta? Escríbenos a{' '}
          <a href={`mailto:${CORREO_SOPORTE}`} className="cp-link">{CORREO_SOPORTE}</a>. Respondemos en
          menos de 2 horas en horario hábil. Incluye el correo de tu cuenta y, si aplica, la referencia
          del pedido.
        </p>
      </section>
    </div>
  )
}
