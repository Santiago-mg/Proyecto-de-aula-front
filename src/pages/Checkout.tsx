import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCartDrawer } from '../context/CartDrawerContext'
import { useAuth } from '../context/AuthContext'
import { ordersService } from '../services/orders.service'
import { Aviso } from '../components/ui/Aviso'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Campo } from '../components/ui/Campo'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { CheckoutFormData } from '../types/order'
import {
  borrarBorrador,
  guardarBorrador,
  leerBorrador,
  tieneDatosDeEntrega,
} from '../utils/borrador'
import { comoError } from '../utils/errores'
import { formatCOP } from '../utils/formato'
import { calcularTotales } from '../utils/pricing'

// Se aceptan los separadores que la gente escribe sin pensar ("300 123 4567",
// "(300) 123-4567", "+57 300 123 4567"); lo que viaja al servidor son solo dígitos.
const SEPARADORES_DE_TELEFONO = /[\s().-]/g

const schema = z.object({
  email: z.string().trim().email('Email inválido'),
  name: z.string().trim().min(2, 'Nombre requerido'),
  phone: z
    .string()
    .transform((v) => v.replace(SEPARADORES_DE_TELEFONO, ''))
    .refine((v) => /^\+?\d{7,15}$/.test(v), 'Teléfono inválido'),
  address: z.string().trim().min(5, 'Dirección requerida'),
  city: z.string().trim().min(2, 'Ciudad requerida'),
  dept: z.string().trim().min(2, 'Departamento requerido'),
})

// Para que el campo sugiera mientras se escribe (no obliga a escoger uno).
const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía',
  'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
  'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre',
  'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
]

export function Checkout() {
  useDocumentTitle('Finalizar compra')
  const { cart, clearCart } = useCart()
  const { user } = useAuth()
  const { abrir: abrirCarrito, disponible: hayCarrito } = useCartDrawer()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  // Lo que la persona dejó escrito la última vez (si lo hay) se recupera.
  const [borrador] = useState(leerBorrador)
  const [recuperado, setRecuperado] = useState(() => tieneDatosDeEntrega(borrador))

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    // Valida al salir de cada campo, no solo al final: el error aparece donde se cometió.
    mode: 'onTouched',
    defaultValues: {
      email: borrador.email || (user?.email ?? ''),
      name: borrador.name || (user?.name ?? ''),
      phone: borrador.phone ?? '',
      address: borrador.address ?? '',
      city: borrador.city ?? '',
      dept: borrador.dept ?? '',
    },
  })

  // Cada cambio se guarda como borrador.
  useEffect(() => {
    const suscripcion = watch((valores) => guardarBorrador(valores as Partial<CheckoutFormData>))
    return () => suscripcion.unsubscribe()
  }, [watch])

  if (cart.length === 0) return <Navigate to="/catalog" replace />

  const { subtotal, shipping, total } = calcularTotales(cart)

  async function onSubmit(data: CheckoutFormData) {
    setServerError(null)
    setLoading(true)
    try {
      const order = await ordersService.create(data, cart)
      clearCart()
      borrarBorrador()
      navigate(`/dashboard?order=${order.orderRef}`)
    } catch (err) {
      setServerError(comoError(err))
    } finally {
      setLoading(false)
    }
  }

  function descartarBorrador() {
    borrarBorrador()
    reset({ email: user?.email ?? '', name: user?.name ?? '', phone: '', address: '', city: '', dept: '' })
    setRecuperado(false)
  }

  return (
    <div className="cp-container cp-checkout-page">
      <Breadcrumbs
        migas={[
          { etiqueta: 'Inicio', to: '/' },
          { etiqueta: 'Catálogo', to: '/catalog' },
          { etiqueta: 'Finalizar compra' },
        ]}
      />

      <div className="cp-checkout-layout">
        {/* Formulario */}
        <div>
          <h1 className="cp-page-title cp-checkout-title">Finalizar compra</h1>

          {recuperado && (
            <Aviso
              acciones={
                <button type="button" className="cp-link-btn" onClick={descartarBorrador}>
                  Empezar de cero
                </button>
              }
            >
              Recuperamos los datos de entrega que habías escrito.
            </Aviso>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <h2 className="cp-checkout-section-title">Datos de entrega</h2>
            <p className="cp-form-note">
              Todos los campos son obligatorios. Usamos estos datos solo para entregar tu pedido y contactarte si hay un problema con él.
            </p>

            <div className="cp-field-row">
              <Campo
                id="name"
                etiqueta="Nombre completo"
                placeholder="Tu nombre"
                autoComplete="name"
                registro={register('name')}
                error={errors.name?.message}
              />
              <Campo
                id="email"
                type="email"
                etiqueta="Email"
                placeholder="tu@correo.com"
                autoComplete="email"
                registro={register('email')}
                error={errors.email?.message}
              />
            </div>

            <Campo
              id="phone"
              type="tel"
              etiqueta="Teléfono"
              placeholder="3001234567"
              autoComplete="tel"
              inputMode="tel"
              ayuda="Un celular donde podamos contactarte. Puedes escribirlo con espacios."
              registro={register('phone')}
              error={errors.phone?.message}
            />

            <Campo
              id="address"
              etiqueta="Dirección"
              placeholder="Calle 10 # 43-25, Apto 301"
              autoComplete="street-address"
              ayuda="Calle o carrera, número y, si aplica, apartamento o torre."
              registro={register('address')}
              error={errors.address?.message}
            />

            <div className="cp-field-row">
              <Campo
                id="city"
                etiqueta="Ciudad"
                placeholder="Medellín"
                autoComplete="address-level2"
                registro={register('city')}
                error={errors.city?.message}
              />
              <Campo
                id="dept"
                etiqueta="Departamento"
                placeholder="Antioquia"
                autoComplete="address-level1"
                list="lista-departamentos"
                registro={register('dept')}
                error={errors.dept?.message}
              />
            </div>
            <datalist id="lista-departamentos">
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>

            {serverError && <ErrorMessage error={serverError} />}

            <button
              type="submit"
              className="cp-btn cp-btn-primary cp-btn-block cp-btn-confirm"
              disabled={loading}
            >
              {loading ? 'Procesando...' : `Confirmar pedido — ${formatCOP(total)}`}
            </button>
            <p className="cp-form-note cp-form-note-center">
              Después de confirmar verás tu pedido en «Mis pedidos», con su estado.
            </p>
          </form>
        </div>

        {/* Resumen */}
        <section aria-labelledby="resumen-titulo">
          <h2 className="cp-checkout-section-title" id="resumen-titulo">Resumen</h2>
          <div className="cp-checkout-summary">
            {cart.map((item) => (
              <div key={item.key} className="cp-checkout-item">
                {item.heroImage && (
                  <img src={item.heroImage} alt="" className="cp-checkout-item-img" />
                )}
                <div className="cp-checkout-item-info">
                  <div className="cp-checkout-item-name">{item.name}</div>
                  <div className="cp-checkout-item-meta">
                    {item.colorName ? `${item.colorName} · ` : ''}×{item.qty}
                  </div>
                </div>
                <div className="cp-checkout-item-price">
                  {formatCOP(item.price * item.qty)}
                </div>
              </div>
            ))}

            <div className="cp-checkout-totals">
              <div className="cp-checkout-row">
                <span>Subtotal</span>
                <span>{formatCOP(subtotal)}</span>
              </div>
              <div className="cp-checkout-row">
                <span>Envío</span>
                <span>{shipping === 0 ? '¡Gratis!' : formatCOP(shipping)}</span>
              </div>
              <div className="cp-checkout-row cp-checkout-total">
                <span>Total</span>
                <span>{formatCOP(total)}</span>
              </div>
            </div>

            {hayCarrito && (
              <button type="button" className="cp-btn cp-btn-ghost cp-btn-block cp-checkout-edit" onClick={abrirCarrito}>
                Cambiar cantidades o quitar equipos
              </button>
            )}

            <div className="cp-checkout-trust">
              <ShieldCheck size={16} aria-hidden="true" className="cp-accent-icon" />
              Pago seguro · Garantía incluida en cada equipo
            </div>
          </div>
          <p className="cp-form-note">
            ¿Dudas? Mira el <Link className="cp-link" to="/ayuda">centro de ayuda</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
