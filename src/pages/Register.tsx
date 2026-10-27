import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { BotonMostrar } from '../components/ui/BotonMostrar'
import { Campo } from '../components/ui/Campo'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useState } from 'react'
import { comoError } from '../utils/errores'
import { rutaDesde } from '../utils/sesion'

// Dominios de correo permitidos (misma regla que el backend: application/dtos/auth.dto.ts — emailSchema)
const DOMINIOS_PERMITIDOS = new Set(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'])

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Correo electrónico inválido')
  .refine((email) => DOMINIOS_PERMITIDOS.has(email.split('@')[1] ?? ''), {
    message: 'Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud.',
  })

const schema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: emailSchema,
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const LARGO_MINIMO = 8

export function Register() {
  const { user, register: registerUser, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<Error | null>(null)
  const [verClave, setVerClave] = useState(false)

  // Si venía de una página protegida (por ejemplo el checkout), vuelve ahí.
  const destino = rutaDesde((location.state as { from?: unknown } | null)?.from) ?? '/dashboard'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to={destino} replace />

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      await registerUser(data.email, data.name, data.password)
      navigate(destino)
    } catch (err) {
      setServerError(comoError(err))
    }
  }

  // Cuánto falta, a medida que escribe (en vez de enterarse al enviar)
  const largo = (watch('password') ?? '').length
  let ayudaClave = `Al menos ${LARGO_MINIMO} caracteres.`
  if (largo > 0 && largo < LARGO_MINIMO) {
    const faltan = LARGO_MINIMO - largo
    const faltante = faltan === 1 ? 'falta 1 carácter' : `faltan ${faltan} caracteres`
    ayudaClave = `Te ${faltante}.`
  } else if (largo >= LARGO_MINIMO) {
    ayudaClave = 'Con eso alcanza.'
  }

  return (
    <AuthLayout
      titulo="Crear cuenta"
      subtitulo={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" state={location.state} className="cp-link">
            Ingresar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Campo
          id="name"
          type="text"
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
          autoCapitalize="none"
          spellCheck={false}
          ayuda="Aceptamos Gmail, Outlook, Hotmail, Yahoo o iCloud."
          registro={register('email')}
          error={errors.email?.message}
        />

        <Campo
          id="password"
          type={verClave ? 'text' : 'password'}
          etiqueta="Contraseña"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          ayuda={ayudaClave}
          registro={register('password')}
          error={errors.password?.message}
          accion={<BotonMostrar visible={verClave} alternar={() => setVerClave((v) => !v)} controla="password" />}
        />

        <Campo
          id="confirmPassword"
          type={verClave ? 'text' : 'password'}
          etiqueta="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          registro={register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        {serverError && <ErrorMessage error={serverError} />}

        <button
          type="submit"
          className="cp-btn cp-btn-primary cp-btn-block cp-auth-submit"
          disabled={isLoading}
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>
    </AuthLayout>
  )
}
