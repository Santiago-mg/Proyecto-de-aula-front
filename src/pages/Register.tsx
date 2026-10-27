import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useState } from 'react'
import { comoError } from '../utils/errores'
import { AYUDA_CONTRASENA, emailRegistroSchema, nameSchema, passwordSchema } from '../utils/validacion'
import { PasswordInput } from '../components/ui/PasswordInput'
import { ReglasContrasena } from '../components/ui/ReglasContrasena'
import { AvisoSinConexion } from '../components/ui/AvisoSinConexion'
import { useTituloPagina } from '../hooks/useTituloPagina'

const schema = z
  .object({
    name: nameSchema,
    email: emailRegistroSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function Register() {
  const { user, register: registerUser, isLoading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<Error | null>(null)
  useTituloPagina('Crear cuenta')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })
  const contrasena = watch('password') ?? ''

  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      await registerUser(data.email, data.name, data.password)
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
        {/* Heurísticas 1 y 3: salida visible a la tienda */}
        <Link to="/" className="cp-link cp-auth-volver">
          ← Volver a la tienda
        </Link>
        <AvisoSinConexion />
        <Link to="/" className="cp-logo" style={{ marginBottom: 32, display: 'block' }}>
          Celular<span>Pro</span>
          <span className="cp-logo-badge">✓</span>
        </Link>

        <h1 className="cp-auth-title">Crear cuenta</h1>
        <p className="cp-auth-sub">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="cp-link">
            Ingresar
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="cp-field">
            <label htmlFor="name" className="cp-label">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className={`cp-input ${errors.name ? 'error' : ''}`}
              placeholder="Tu nombre"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="name-error" className="cp-field-error">{errors.name.message}</p>
            )}
          </div>

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
              aria-describedby={errors.email ? 'email-error email-hint' : 'email-hint'}
              {...register('email')}
            />
            {/* Heurística 8: qué correo se acepta, dicho antes de fallar */}
            <p id="email-hint" className="cp-field-hint">
              Gmail, Outlook, Hotmail, Yahoo o iCloud.{' '}
              <Link to="/ayuda#faq-correo" className="cp-link">¿Por qué?</Link>
            </p>
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
              autoComplete="new-password"
              invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error password-hint' : 'password-hint password-reglas'}
              placeholder="Ej.: Medellin2026"
              {...register('password')}
            />
            <p id="password-hint" className="cp-field-hint">{AYUDA_CONTRASENA}</p>
            {/* Heurísticas 5, 7 y 8: cada requisito se marca mientras se escribe */}
            <ReglasContrasena id="password-reglas" valor={contrasena} />
            {errors.password && (
              <p id="password-error" className="cp-field-error">{errors.password.message}</p>
            )}
          </div>

          <div className="cp-field">
            <label htmlFor="confirmPassword" className="cp-label">
              Confirmar contraseña
            </label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
              placeholder="Repite tu contraseña"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p id="confirm-error" className="cp-field-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <ErrorMessage error={serverError} ayuda={{ ancla: 'preguntas', texto: 'Ver preguntas frecuentes' }} />
          )}

          <button
            type="submit"
            className="cp-btn cp-btn-primary"
            style={{ width: '100%', marginTop: 24 }}
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className="cp-auth-ayuda">
          ¿Dudas al crear tu cuenta?{' '}
          <Link to="/ayuda#preguntas" className="cp-link">
            Preguntas frecuentes
          </Link>
        </p>
      </div>
      </motion.div>
    </main>
  )
}
