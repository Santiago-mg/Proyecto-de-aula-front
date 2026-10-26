import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Aviso } from '../components/ui/Aviso'
import { BotonMostrar } from '../components/ui/BotonMostrar'
import { Campo } from '../components/ui/Campo'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useEffect, useState } from 'react'
import { comoError } from '../utils/errores'
import { leerSesionVencida, limpiarSesionVencida, rutaDesde, rutaSegura } from '../utils/sesion'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const { user, login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<Error | null>(null)
  const [verClave, setVerClave] = useState(false)

  // De dónde viene la persona: una página protegida que la mandó aquí, o la
  // página donde se le venció la sesión.
  const origen = rutaDesde((location.state as { from?: unknown } | null)?.from)
  const [vencida] = useState(leerSesionVencida)
  const destino = origen ?? rutaSegura(vencida) ?? '/dashboard'

  useEffect(() => {
    // El aviso de sesión vencida se muestra una vez, no cada vez que se abre el login.
    if (vencida !== null) limpiarSesionVencida()
  }, [vencida])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Si ya hay sesión, ir a donde iba (o al dashboard)
  if (user) return <Navigate to={destino} replace />

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      await login(data.email, data.password)
      navigate(destino)
    } catch (err) {
      setServerError(comoError(err))
    }
  }

  // Un 401 en el login significa credenciales incorrectas, no sesión vencida.
  const credencialesMalas = axios.isAxiosError(serverError) && serverError.response?.status === 401

  return (
    <AuthLayout
      titulo="Ingresar"
      subtitulo={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/register" state={location.state} className="cp-link">
            Regístrate gratis
          </Link>
        </>
      }
    >
      {vencida !== null && (
        <Aviso tono="warn">Tu sesión venció. Ingresa de nuevo para seguir donde ibas.</Aviso>
      )}
      {vencida === null && origen && (
        <Aviso>
          {origen.startsWith('/checkout')
            ? 'Ingresa para finalizar tu compra. Tu carrito se conserva.'
            : 'Ingresa para continuar.'}
        </Aviso>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Campo
          id="email"
          type="email"
          etiqueta="Email"
          placeholder="tu@correo.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          registro={register('email')}
          error={errors.email?.message}
        />

        <Campo
          id="password"
          type={verClave ? 'text' : 'password'}
          etiqueta="Contraseña"
          placeholder="••••••••"
          autoComplete="current-password"
          registro={register('password')}
          error={errors.password?.message}
          accion={<BotonMostrar visible={verClave} alternar={() => setVerClave((v) => !v)} controla="password" />}
        />

        {serverError && (
          <ErrorMessage
            error={serverError}
            pista={
              credencialesMalas
                ? 'Revisa que el correo y la contraseña estén bien escritos. Con «Mostrar» puedes ver lo que escribes.'
                : undefined
            }
          />
        )}

        <button
          type="submit"
          className="cp-btn cp-btn-primary cp-btn-block cp-auth-submit"
          disabled={isLoading}
        >
          {isLoading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </AuthLayout>
  )
}
