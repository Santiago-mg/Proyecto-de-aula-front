// Contenido del centro de ayuda. Todo lo que afirma sale de lo que la propia
// tienda ya muestra (inicio, pie de página, carrito y formularios): no se
// inventan plazos ni procesos. Lo que depende del equipo de soporte se
// resuelve escribiendo al correo de contacto.

import { COSTO_ENVIO, UMBRAL_ENVIO_GRATIS } from '../utils/pricing'
import { formatCOP } from '../utils/formato'

export const CORREO_SOPORTE = 'soporte@celularpro.co'

export interface Pregunta {
  id: string
  pregunta: string
  /** Texto plano de la respuesta. Se usa para buscar y para mostrar. */
  respuesta: string
}

export interface Tema {
  id: string
  titulo: string
  preguntas: Pregunta[]
}

export const TEMAS_AYUDA: Tema[] = [
  {
    id: 'comprar',
    titulo: 'Comprar',
    preguntas: [
      {
        id: 'como-compro',
        pregunta: '¿Cómo hago una compra?',
        respuesta:
          'Elige un celular en el catálogo, escoge color y cantidad y pulsa "Agregar al carrito". Cuando termines, abre el carrito y pulsa "Proceder al pago": te pedimos los datos de entrega y confirmas el pedido.',
      },
      {
        id: 'sin-cuenta',
        pregunta: '¿Necesito una cuenta para comprar?',
        respuesta:
          'Puedes mirar el catálogo y llenar el carrito sin cuenta. Para confirmar el pedido sí hay que ingresar o crear una cuenta. Tu carrito se conserva mientras tanto.',
      },
      {
        id: 'carrito-guardado',
        pregunta: '¿Se pierde mi carrito si cierro la página?',
        respuesta:
          'No. El carrito se guarda en este navegador. Si cambias de computador o de navegador tendrás que armarlo otra vez.',
      },
      {
        id: 'costo-envio',
        pregunta: '¿Cuánto cuesta el envío?',
        respuesta: `Es gratis en compras superiores a ${formatCOP(UMBRAL_ENVIO_GRATIS)}. Por debajo de ese valor cuesta ${formatCOP(COSTO_ENVIO)}. Verás el valor exacto en el resumen antes de confirmar. Despachamos en 24–48 h a toda Colombia.`,
      },
    ],
  },
  {
    id: 'equipos',
    titulo: 'Los equipos',
    preguntas: [
      {
        id: 'condiciones',
        pregunta: '¿Qué diferencia hay entre Nuevo, Certificado y Usado verificado?',
        respuesta:
          'Nuevo: equipo sin uso. Reacondicionado certificado: equipo usado que revisamos y reacondicionamos, con garantía de 6 meses. Usado verificado: equipo usado con IMEI verificado y garantía de 30 días. Todos pasan por nuestra inspección técnica de 32 puntos.',
      },
      {
        id: 'bateria',
        pregunta: '¿Qué es la salud de batería?',
        respuesta:
          'Es el porcentaje de capacidad que conserva la batería frente a una nueva. En los equipos usados y certificados publicamos el valor real antes de que compres. Los equipos por debajo del 80 % no entran al catálogo.',
      },
      {
        id: 'imei',
        pregunta: '¿Qué es el IMEI y por qué lo revisan?',
        respuesta:
          'El IMEI es el número que identifica a cada celular ante los operadores. Verificamos que esté libre de reportes, bloqueos de operador y deudas, y recibes el certificado con tu compra.',
      },
      {
        id: 'verificado',
        pregunta: '¿Qué significa la marca "Verificado"?',
        respuesta:
          'Que el equipo ya pasó nuestra revisión técnica. En el catálogo puedes activar "Solo verificados" para ver únicamente esos equipos.',
      },
    ],
  },
  {
    id: 'garantias',
    titulo: 'Garantías',
    preguntas: [
      {
        id: 'garantia',
        pregunta: '¿Qué garantía tengo?',
        respuesta:
          '6 meses en equipos certificados y 30 días en usados. Si falla algo cubierto, lo reparamos o te devolvemos tu dinero.',
      },
      {
        id: 'usar-garantia',
        pregunta: '¿Cómo hago válida la garantía?',
        respuesta: `Escríbenos a ${CORREO_SOPORTE} con tu número de pedido y cuéntanos qué le pasa al equipo.`,
      },
    ],
  },
  {
    id: 'cuenta',
    titulo: 'Mi cuenta y mis pedidos',
    preguntas: [
      {
        id: 'seguir-pedido',
        pregunta: '¿Cómo sigo mi pedido?',
        respuesta:
          'En "Mis pedidos" ves cada pedido con su número y su estado: Pendiente, Confirmado, En camino, Entregado o Cancelado.',
      },
      {
        id: 'registro',
        pregunta: '¿Con qué correo puedo crear la cuenta?',
        respuesta:
          'Con una cuenta de Gmail, Outlook, Hotmail, Yahoo o iCloud. La contraseña debe tener al menos 8 caracteres.',
      },
      {
        id: 'no-ingreso',
        pregunta: 'No puedo ingresar, ¿qué hago?',
        respuesta: `Revisa que el correo y la contraseña estén bien escritos (puedes pulsar "Mostrar" para ver lo que escribes). Si tu cuenta fue suspendida o el problema sigue, escríbenos a ${CORREO_SOPORTE}.`,
      },
      {
        id: 'olvide-clave',
        pregunta: 'Olvidé mi contraseña',
        respuesta: `Por ahora no se puede restablecer desde la página. Escríbenos a ${CORREO_SOPORTE} y te ayudamos.`,
      },
    ],
  },
]

/** Todas las preguntas en una lista, para buscar. */
export const TODAS_LAS_PREGUNTAS = TEMAS_AYUDA.flatMap((t) => t.preguntas.map((p) => ({ ...p, tema: t.titulo })))
