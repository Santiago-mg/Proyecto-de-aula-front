import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { PasswordInput } from '../components/ui/PasswordInput'
import { comoError } from '../utils/errores'
import { AYUDA_CONTRASENA, nameSchema, passwordSchema } from '../utils/validacion'
import { ReglasContrasena } from '../components/ui/ReglasContrasena'
import { useTituloPagina } from '../hooks/useTituloPagina'

const nameForm = z.object({ name: nameSchema })

const passwordForm = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña nueva'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['newPassword'],
  })

type NameData = z.infer<typeof nameForm>
type PasswordData = z.infer<typeof passwordForm>

// Mi perfil: editar el nombre y cambiar la contraseña.
export function Profile() {
  const { user, updateProfile, changePassword, isLoading } = useAuth()
  const { showToast } = useToast()
  const [nameError, setNameError] = useState<Error | null>(null)
  const [passwordError, setPasswordError] = useState<Error | null>(null)

  const nameFormState = useForm<NameData>({
    resolver: zodResolver(nameForm),
    defaultValues: { name: user?.name ?? '' },
  })
  const passwordFormState = useForm<PasswordData>({ resolver: zodResolver(passwordForm) })
  useTituloPagina('Mi perfil')
  const nombreCambiado = nameFormState.formState.isDirty
  const contrasenaNueva = passwordFormState.watch('newPassword') ?? ''

  // Heurística 3 (control y libertad): volver al estado anterior sin recargar.
  function descartarNombre() {
    nameFormState.reset({ name: user?.name ?? '' })
    setNameError(null)
  }

  function limpiarContrasenas() {
    passwordFormState.reset()
    setPasswordError(null)
  }

  async function guardarNombre(data: NameData) {
    setNameError(null)
    try {
      await updateProfile(data.name)
      // El nombre guardado pasa a ser el nuevo "estado anterior"
      nameFormState.reset({ name: data.name.trim() })
      showToast('Perfil actualizado')
    } catch (err) {
      setNameError(comoError(err))
    }
  }

  async function guardarContrasena(data: PasswordData) {
    setPasswordError(null)
    try {
      await changePassword(data.currentPassword, data.newPassword)
      passwordFormState.reset()
      showToast('Contraseña actualizada')
    } catch (err) {
      setPasswordError(comoError(err))
    }
  }

  const nameErrors = nameFormState.formState.errors
  const passErrors = passwordFormState.formState.errors

  return (
    <div className="cp-container cp-profile">
      {/* Heurística 1: ruta de navegación, la persona sabe dónde está y cómo volver */}
      <nav aria-label="Ruta de navegación" className="cp-breadcrumb">
        <Link to="/dashboard" className="cp-link">
          ← Volver a mi cuenta
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Mi perfil</span>
      </nav>
      <h1 className="cp-auth-title" style={{ marginTop: 16 }}>
        Mi perfil
      </h1>

      <section className="cp-profile-section" aria-labelledby="perfil-datos">
        <h2 id="perfil-datos" className="cp-profile-heading">
          Mis datos
        </h2>
        <form onSubmit={nameFormState.handleSubmit(guardarNombre)} noValidate>
          <div className="cp-field">
            <label htmlFor="profile-name" className="cp-label">
              Nombre completo
            </label>
            <input
              id="profile-name"
              type="text"
              autoComplete="name"
              className={`cp-input ${nameErrors.name ? 'error' : ''}`}
              aria-invalid={nameErrors.name ? true : undefined}
              aria-describedby={nameErrors.name ? 'profile-name-error' : undefined}
              {...nameFormState.register('name')}
            />
            {nameErrors.name && (
              <p id="profile-name-error" className="cp-field-error">
                {nameErrors.name.message}
              </p>
            )}
          </div>

          <div className="cp-field">
            <label htmlFor="profile-email" className="cp-label">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              className="cp-input"
              value={user?.email ?? ''}
              readOnly
              aria-describedby="profile-email-hint"
            />
            <p id="profile-email-hint" className="cp-field-hint">
              El correo es tu usuario y no se puede cambiar.
            </p>
          </div>

          {nameError && <ErrorMessage error={nameError} />}

          <div className="cp-form-acciones">
            <button type="submit" className="cp-btn cp-btn-primary" disabled={isLoading}>
              Guardar cambios
            </button>
            <button type="button" className="cp-btn cp-btn-ghost" onClick={descartarNombre} disabled={!nombreCambiado}>
              Descartar cambios
            </button>
          </div>
        </form>
      </section>

      <section className="cp-profile-section" aria-labelledby="perfil-clave">
        <h2 id="perfil-clave" className="cp-profile-heading">
          Cambiar contraseña
        </h2>
        <form onSubmit={passwordFormState.handleSubmit(guardarContrasena)} noValidate>
          <div className="cp-field">
            <label htmlFor="currentPassword" className="cp-label">
              Contraseña actual
            </label>
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              invalid={!!passErrors.currentPassword}
              aria-describedby={passErrors.currentPassword ? 'current-error' : undefined}
              {...passwordFormState.register('currentPassword')}
            />
            {passErrors.currentPassword && (
              <p id="current-error" className="cp-field-error">
                {passErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="cp-field">
            <label htmlFor="newPassword" className="cp-label">
              Contraseña nueva
            </label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              invalid={!!passErrors.newPassword}
              aria-describedby={passErrors.newPassword ? 'new-error new-hint' : 'new-hint new-reglas'}
              {...passwordFormState.register('newPassword')}
            />
            <p id="new-hint" className="cp-field-hint">
              {AYUDA_CONTRASENA}
            </p>
            <ReglasContrasena id="new-reglas" valor={contrasenaNueva} />
            {passErrors.newPassword && (
              <p id="new-error" className="cp-field-error">
                {passErrors.newPassword.message}
              </p>
            )}
          </div>

          <div className="cp-field">
            <label htmlFor="confirmNewPassword" className="cp-label">
              Confirmar contraseña nueva
            </label>
            <PasswordInput
              id="confirmNewPassword"
              autoComplete="new-password"
              invalid={!!passErrors.confirmPassword}
              aria-describedby={passErrors.confirmPassword ? 'confirm-new-error' : undefined}
              {...passwordFormState.register('confirmPassword')}
            />
            {passErrors.confirmPassword && (
              <p id="confirm-new-error" className="cp-field-error">
                {passErrors.confirmPassword.message}
              </p>
            )}
          </div>

          {passwordError && <ErrorMessage error={passwordError} />}

          <div className="cp-form-acciones">
            <button type="submit" className="cp-btn cp-btn-primary" disabled={isLoading}>
              Cambiar contraseña
            </button>
            <button type="button" className="cp-btn cp-btn-ghost" onClick={limpiarContrasenas}>
              Limpiar campos
            </button>
          </div>
          <p className="cp-field-hint" style={{ marginTop: 12 }}>
            ¿Olvidaste tu contraseña actual?{' '}
            <Link to="/ayuda#guia-no-puedo-ingresar" className="cp-link">Ver qué hacer</Link>
          </p>
        </form>
      </section>
    </div>
  )
}
