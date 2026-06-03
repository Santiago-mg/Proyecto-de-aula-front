import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useState } from 'react'

const schema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
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

export function Register() {
  const { user, register: registerUser, isLoading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<Error | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      await registerUser(data.email, data.name, data.password)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return (
    <div className="cp-auth-page">
      <div className="cp-auth-card">
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
              className={`cp-input ${errors.name ? 'error' : ''}`}
              placeholder="Tu nombre"
              {...register('name')}
            />
            {errors.name && (
              <p className="cp-field-error">{errors.name.message}</p>
            )}
          </div>

          <div className="cp-field">
            <label htmlFor="email" className="cp-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`cp-input ${errors.email ? 'error' : ''}`}
              placeholder="tu@correo.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="cp-field-error">{errors.email.message}</p>
            )}
          </div>

          <div className="cp-field">
            <label htmlFor="password" className="cp-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={`cp-input ${errors.password ? 'error' : ''}`}
              placeholder="Mínimo 8 caracteres"
              {...register('password')}
            />
            {errors.password && (
              <p className="cp-field-error">{errors.password.message}</p>
            )}
          </div>

          <div className="cp-field">
            <label htmlFor="confirmPassword" className="cp-label">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={`cp-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Repite tu contraseña"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="cp-field-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && <ErrorMessage error={serverError} />}

          <button
            type="submit"
            className="cp-btn cp-btn-primary"
            style={{ width: '100%', marginTop: 24 }}
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>
      </div>
    </div>
  )
}
