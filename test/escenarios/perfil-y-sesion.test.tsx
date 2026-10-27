import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../helpers/app'
import { fallo, ok, servidor } from '../helpers/servidor'
import { CLAVE, sesionIniciada, TOKEN_USUARIO, usuario } from '../helpers/fixtures'
import { CLAVE_AVISO } from '../../src/utils/errores'

// Defectos D-01, D-02, D-03, D-04, D-06, D-07, D-11 y D-15 vistos desde la pantalla:
// editar perfil, cambiar contraseña, política de contraseña, normalización del
// correo, cierre de sesión, suspensión durante la sesión y aviso de sesión vencida.
// Contrato: el backend de Proyecto-de-aula-mario (PATCH /auth/me, PUT /auth/me/password
// con 204, sin endpoint de logout).

type Usuario = ReturnType<typeof abrirApp>

function sesionGuardada() {
  const guardado = localStorage.getItem('cp_user')
  return { token: localStorage.getItem('cp_token'), user: guardado ? JSON.parse(guardado) : null }
}

async function escribirNombre(user: Usuario, nombre: string) {
  const campo = screen.getByLabelText('Nombre completo')
  await user.clear(campo)
  if (nombre) await user.type(campo, nombre)
}

async function cambiarClave(user: Usuario, actual: string, nueva: string, confirmacion: string) {
  await user.type(screen.getByLabelText('Contraseña actual'), actual)
  await user.type(screen.getByLabelText('Contraseña nueva'), nueva)
  await user.type(screen.getByLabelText('Confirmar contraseña nueva'), confirmacion)
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
}

describe('D-01 Perfil — editar el nombre (PATCH /auth/me)', () => {
  it('guarda el nombre recortado, actualiza la sesión y avisa', async () => {
    // Arrange
    sesionIniciada(usuario({ name: 'Mario Andrade' }))
    servidor.responder('PATCH', '/auth/me', ok(usuario({ name: 'Mario Nuevo' })))
    const user = abrirApp('/profile')

    // Act
    await escribirNombre(user, '  Mario Nuevo  ')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // Assert
    expect(await screen.findByText('Perfil actualizado')).to.exist
    const [peticion] = servidor.peticiones('PATCH', '/auth/me')
    expect(peticion.body).to.deep.equal({ name: 'Mario Nuevo' })
    expect(peticion.authorization).to.equal(`Bearer ${TOKEN_USUARIO}`)
    expect(sesionGuardada().user.name).to.equal('Mario Nuevo')
  })

  it('la confirmación se anuncia a lectores de pantalla (role="status")', async () => {
    sesionIniciada(usuario({ name: 'Mario Andrade' }))
    servidor.responder('PATCH', '/auth/me', ok(usuario({ name: 'Mario Nuevo' })))
    const user = abrirApp('/profile')

    await escribirNombre(user, 'Mario Nuevo')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    const aviso = await screen.findByTestId('toast')
    expect(aviso.getAttribute('role')).to.equal('status')
    expect(aviso.textContent).to.equal('Perfil actualizado')
  })

  it('el correo se muestra pero no se puede editar', async () => {
    sesionIniciada(usuario({ email: 'mario@gmail.com' }))
    abrirApp('/profile')

    const correo = (await screen.findByLabelText('Email')) as HTMLInputElement
    expect(correo.value).to.equal('mario@gmail.com')
    expect(correo.readOnly).to.equal(true)
  })

  it('un nombre en blanco se frena en el formulario y no llega al backend (D-04)', async () => {
    sesionIniciada()
    const user = abrirApp('/profile')

    await escribirNombre(user, '   ')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('El nombre debe tener al menos 2 caracteres')).to.exist
    expect(servidor.peticiones('PATCH', '/auth/me')).to.be.empty
  })

  it('si el backend rechaza el cambio, muestra su mensaje como alerta y conserva el nombre', async () => {
    sesionIniciada(usuario({ name: 'Mario Andrade' }))
    servidor.responder('PATCH', '/auth/me', fallo(500, 'Error interno del servidor'))
    const user = abrirApp('/profile')

    await escribirNombre(user, 'Otro Nombre')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta.textContent).to.equal('Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.')
    expect(sesionGuardada().user.name).to.equal('Mario Andrade')
  })

  it('sin sesión, /profile lleva a /login', async () => {
    abrirApp('/profile')
    await waitFor(() => expect(rutaActual()).to.equal('/login'))
  })
})

describe('D-02 Perfil — cambiar la contraseña (PUT /auth/me/password)', () => {
  it('manda la actual y la nueva, conserva la sesión (204) y vacía el formulario', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('PUT', '/auth/me/password', { status: 204 })
    const user = abrirApp('/profile')

    // Act
    await cambiarClave(user, CLAVE, 'ClaveNueva2026', 'ClaveNueva2026')

    // Assert
    expect(await screen.findByText('Contraseña actualizada')).to.exist
    const [peticion] = servidor.peticiones('PUT', '/auth/me/password')
    expect(peticion.body).to.deep.equal({ currentPassword: CLAVE, newPassword: 'ClaveNueva2026' })
    expect(sesionGuardada().token).to.equal(TOKEN_USUARIO)
    expect(sesionGuardada().user).to.not.be.null
    expect((screen.getByLabelText('Contraseña nueva') as HTMLInputElement).value).to.equal('')
  })

  it('contraseña actual incorrecta → muestra el mensaje del backend y no cambia el token', async () => {
    sesionIniciada()
    servidor.responder('PUT', '/auth/me/password', fallo(400, 'La contraseña actual es incorrecta'))
    const user = abrirApp('/profile')

    await cambiarClave(user, 'equivocada1', 'ClaveNueva2026', 'ClaveNueva2026')

    expect((await screen.findByRole('alert')).textContent).to.equal('La contraseña actual es incorrecta')
    expect(sesionGuardada().token).to.equal(TOKEN_USUARIO)
  })

  it.each([
    ['solo números (D-03)', '12345678', 'La contraseña debe incluir al menos una letra minúscula'],
    ['sin mayúscula', 'sololetras1', 'La contraseña debe incluir al menos una letra mayúscula'],
    ['sin número (D-03)', 'SoloLetras', 'La contraseña debe incluir al menos un número'],
    ['demasiado larga (D-05)', 'Aa1'.repeat(25), 'La contraseña no puede superar 72 caracteres'],
  ])('la contraseña nueva %s se frena sin llegar al backend', async (_caso, nueva, mensaje) => {
    sesionIniciada()
    const user = abrirApp('/profile')

    await cambiarClave(user, CLAVE, nueva, nueva)

    expect(await screen.findByText(mensaje)).to.exist
    expect(servidor.peticiones('PUT', '/auth/me/password')).to.be.empty
  })

  it('la confirmación distinta y la nueva igual a la actual se avisan', async () => {
    sesionIniciada()
    const user = abrirApp('/profile')

    await cambiarClave(user, CLAVE, CLAVE, 'Otra-distinta-1')

    expect(await screen.findByText('Las contraseñas no coinciden')).to.exist
    expect(screen.getByText('La nueva contraseña debe ser distinta de la actual')).to.exist
    expect(servidor.peticiones('PUT', '/auth/me/password')).to.be.empty
  })
})

describe('D-11 Cerrar sesión (JWT sin estado: se borra en el navegador)', () => {
  it('limpia la sesión local y vuelve a /login sin llamar a un endpoint inexistente', async () => {
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([]))
    const user = abrirApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    await waitFor(() => expect(sesionGuardada().token).to.be.null)
    expect(sesionGuardada().user).to.be.null
    expect(rutaActual()).to.equal('/login')
    expect(servidor.peticiones('POST', '/auth/logout')).to.be.empty
  })

  it('después de salir, /dashboard vuelve a pedir inicio de sesión', async () => {
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([]))
    const user = abrirApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() => expect(rutaActual()).to.equal('/login'))

    expect(localStorage.getItem('cp_token')).to.be.null
  })
})

describe('Cuenta suspendida durante la sesión (403 del backend)', () => {
  it('cierra la sesión y guarda el motivo para mostrarlo en /login', async () => {
    sesionIniciada()
    const destinos = capturarRedirecciones()
    servidor.responder('GET', '/orders/my', fallo(403, 'Tu cuenta ha sido suspendida. Motivo: fraude'))
    abrirApp('/dashboard')

    await waitFor(() => expect(destinos).to.include('/login'))
    expect(sessionStorage.getItem(CLAVE_AVISO)).to.equal('Tu cuenta ha sido suspendida. Motivo: fraude')
    expect(localStorage.getItem('cp_token')).to.be.null
  })

  it('un 403 de "solo administradores" NO cierra la sesión', async () => {
    sesionIniciada()
    const destinos = capturarRedirecciones()
    servidor.responder('GET', '/orders/my', fallo(403, 'Acceso restringido a administradores'))
    abrirApp('/dashboard')

    await waitFor(() => expect(servidor.peticiones('GET', '/orders/my')).to.have.length(1))
    expect(destinos).to.not.include('/login')
    expect(localStorage.getItem('cp_token')).to.equal(TOKEN_USUARIO)
  })
})

describe('D-15 Sesión vencida — se explica en /login', () => {
  it.each([
    ['TOKEN_EXPIRED', 'Tu sesión ha vencido. Inicia sesión de nuevo.'],
    [undefined, 'Tu sesión ya no es válida. Inicia sesión de nuevo.'],
  ])('401 con code %s guarda el motivo antes de redirigir', async (code, mensaje) => {
    sesionIniciada()
    const destinos = capturarRedirecciones()
    servidor.responder('GET', '/orders/my', { status: 401, body: { error: 'x', code } })
    abrirApp('/dashboard')

    await waitFor(() => expect(destinos).to.include('/login'))
    expect(sessionStorage.getItem(CLAVE_AVISO)).to.equal(mensaje)
  })

  it('/login muestra el motivo y lo borra para que no reaparezca', async () => {
    sessionStorage.setItem(CLAVE_AVISO, 'Tu sesión ha vencido. Inicia sesión de nuevo.')
    abrirApp('/login')

    const aviso = await screen.findByRole('status')
    expect(aviso.textContent).to.equal('Tu sesión ha vencido. Inicia sesión de nuevo.')
    await waitFor(() => expect(sessionStorage.getItem(CLAVE_AVISO)).to.be.null)
  })

  it('un login con credenciales malas (sin sesión guardada) NO deja aviso de sesión vencida', async () => {
    servidor.responder('POST', '/auth/login', fallo(401, 'Credenciales inválidas'))
    const user = abrirApp('/login')

    await user.type(screen.getByLabelText('Email'), 'mario@gmail.com')
    await user.type(screen.getByLabelText('Contraseña'), 'mala-clave-1')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Credenciales inválidas')).to.exist
    expect(sessionStorage.getItem(CLAVE_AVISO)).to.be.null
  })
})

describe('D-06 / D-07 Login y registro normalizan lo que se escribe', () => {
  it('el login manda el correo en minúsculas y sin espacios', async () => {
    servidor.responder('POST', '/auth/login', ok({ user: usuario(), token: TOKEN_USUARIO }))
    servidor.responder('GET', '/orders/my', ok([]))
    const user = abrirApp('/login')

    await user.type(screen.getByLabelText('Email'), '  Ana@Correo.COM ')
    await user.type(screen.getByLabelText('Contraseña'), CLAVE)
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => expect(servidor.peticiones('POST', '/auth/login')).to.have.length(1))
    expect(servidor.peticiones('POST', '/auth/login')[0].body).to.deep.equal({ email: 'ana@correo.com', password: CLAVE })
  })

  it('el login con demasiados intentos (429) muestra el mensaje del servidor', async () => {
    servidor.responder('POST', '/auth/login', { status: 429, body: { error: 'Demasiados intentos fallidos. Vuelve a intentarlo en 15 minuto(s).' } })
    const user = abrirApp('/login')

    await user.type(screen.getByLabelText('Email'), 'mario@gmail.com')
    await user.type(screen.getByLabelText('Contraseña'), 'mala-clave-1')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect((await screen.findByRole('alert')).textContent).to.match(/Demasiados intentos fallidos/)
  })

  it.each([
    ['solo números (D-03)', '12345678', 'La contraseña debe incluir al menos una letra minúscula'],
    ['sin mayúscula', 'sololetras1', 'La contraseña debe incluir al menos una letra mayúscula'],
    ['sin número (D-03)', 'SoloLetras', 'La contraseña debe incluir al menos un número'],
    ['de más de 72 caracteres (D-05)', 'Aa1'.repeat(25), 'La contraseña no puede superar 72 caracteres'],
  ])('registro con contraseña %s se frena sin llegar al backend', async (_caso, clave, mensaje) => {
    const user = abrirApp('/register')

    await user.type(screen.getByLabelText('Nombre completo'), 'Mario')
    await user.type(screen.getByLabelText('Email'), 'mario@gmail.com')
    await user.type(screen.getByLabelText('Contraseña'), clave)
    await user.type(screen.getByLabelText('Confirmar contraseña'), clave)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText(mensaje)).to.exist
    expect(servidor.peticiones('POST', '/auth/register')).to.be.empty
  })

  it('registro con nombre de solo espacios se frena (D-04)', async () => {
    const user = abrirApp('/register')

    await user.type(screen.getByLabelText('Nombre completo'), '    ')
    await user.type(screen.getByLabelText('Email'), 'mario@gmail.com')
    await user.type(screen.getByLabelText('Contraseña'), CLAVE)
    await user.type(screen.getByLabelText('Confirmar contraseña'), CLAVE)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText('El nombre debe tener al menos 2 caracteres')).to.exist
    expect(servidor.peticiones('POST', '/auth/register')).to.be.empty
  })

  it('el registro muestra la ayuda de la regla de contraseña antes de fallar', () => {
    abrirApp('/register')
    expect(screen.getByText('Mínimo 8 caracteres, con mayúscula, minúscula y número.')).to.exist
  })
})
