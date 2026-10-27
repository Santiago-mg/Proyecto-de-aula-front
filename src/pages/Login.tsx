import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useEffect, useState } from 'react'
import { CLAVE_AVISO, comoError } from '../utils/errores'
import { emailSchema } from '../utils/validacion'
import { PasswordInput } from '../components/ui/PasswordInput'
import { AvisoSinConexion } from '../components/ui/AvisoSinConexion'
import { useTituloPagina } from '../hooks/useTituloPagina'

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const { user, login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<Error | null>(null)
  useTituloPagina('Ingresar')
  // Motivo por el que se cerró la sesión (vencida, revocada…), si venimos de ahí.
  const [aviso] = useState(() => sessionStorage.getItem(CLAVE_AVISO))
  useEffect(() => {
    sessionStorage.removeItem(CLAVE_AVISO)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Si ya hay sesión, ir al dashboard
  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err) {
      setServerError(comoError(err))
    }
  }

  return (
    <main className="cp-auth-page">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
      <div className="cp-auth-card">
        {/* Heurísticas 1 y 3: salida visible a la tienda (antes solo el logo, que no parece enlace) */}
        <Link to="/" className="cp-link cp-auth-volver">
          ← Volver a la tienda
        </Link>
        <AvisoSinConexion />
        <Link to="/" className="cp-logo" style={{ marginBottom: 32, display: 'block' }}>
          Celular<span>Pro</span>
          <span className="cp-logo-badge">✓</span>
        </Link>

        <h1 className="cp-auth-title">Ingresar</h1>
        <p className="cp-auth-sub">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="cp-link">
            Regístrate gratis
          </Link>
        </p>

        {aviso && (
          <p role="status" className="cp-flash">
            {aviso}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="cp-field">
            <label htmlFor="email" className="cp-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              className={`cp-input ${errors.email ? 'error' : ''}`}
              placeholder="tu@gmail.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="cp-field-error">{errors.email.message}</p>
            )}
          </div>

          <div className="cp-field">
            <label htmlFor="password" className="cp-label">
              Contraseña
            </label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" className="cp-field-error">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <ErrorMessage
              error={serverError}
              ayuda={{ ancla: 'guia-no-puedo-ingresar', texto: '¿Problemas para ingresar? Ver la guía' }}
            />
          )}

          <button
            type="submit"
            className="cp-btn cp-btn-primary"
            style={{ width: '100%', marginTop: 24 }}
            disabled={isLoading}
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Heurística 10: ayuda justo donde más se necesita */}
        <p className="cp-auth-ayuda">
          ¿Olvidaste tu contraseña o no puedes ingresar?{' '}
          <Link to="/ayuda#guia-no-puedo-ingresar" className="cp-link">
            Centro de ayuda
          </Link>
        </p>
      </div>
      </motion.div>
    </main>
  )
}
