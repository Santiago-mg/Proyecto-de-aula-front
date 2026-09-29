import { expect } from 'chai'
import { describe, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { abrirApp, capturarRedirecciones, rutaActual } from '../helpers/app'
import { creado, fallo, ok, servidor, sinConexion } from '../helpers/servidor'
import { CLAVE, pedido, sesionIniciada, TOKEN_USUARIO, usuario } from '../helpers/fixtures'

// Autenticación: register / login / sesión
// Casos de tests/escenarios/autenticacion.test.ts del back. En el front,
// GET /auth/me se corresponde con la sesión guardada: las rutas privadas la
// exigen y cada petición la manda como Bearer.

type Usuario = ReturnType<typeof abrirApp>

async function registrarse(user: Usuario, datos: { nombre: string; email: string; clave: string; confirmacion: string }) {
  await user.type(screen.getByLabelText('Nombre completo'), datos.nombre)
  await user.type(screen.getByLabelText('Email'), datos.email)
  await user.type(screen.getByLabelText('Contraseña'), datos.clave)
  await user.type(screen.getByLabelText('Confirmar contraseña'), datos.confirmacion)
  await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
}

async function ingresar(user: Usuario, email: string, clave: string) {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Contraseña'), clave)
  await user.click(screen.getByRole('button', { name: 'Ingresar' }))
}

function sesionGuardada() {
  const guardado = localStorage.getItem('cp_user')
  return { token: localStorage.getItem('cp_token'), user: guardado ? JSON.parse(guardado) : null }
}

describe('Registro — POST /auth/register', () => {
  it('datos inválidos → el formulario los frena y no llega al backend', async () => {
    // Arrange
    const user = abrirApp('/register')

    // Act
    await registrarse(user, { nombre: 'M', email: 'mario@gmail.com', clave: 'corta', confirmacion: 'otra' })

    // Assert
    expect(await screen.findByText('El nombre debe tener al menos 2 caracteres')).to.exist
    expect(screen.queryByText('La contraseña debe tener al menos 8 caracteres')).to.exist
    expect(screen.queryByText('Las contraseñas no coinciden')).to.exist
    expect(servidor.peticiones('POST', '/auth/register')).to.be.empty
  })

  it('email ya registrado → 409 y el mensaje del backend, sin crear sesión', async () => {
    // Arrange
    servidor.responder('POST', '/auth/register', fallo(409, 'El email ya está registrado'))
    const user = abrirApp('/register')

    // Act
    await registrarse(user, { nombre: 'Mario', email: 'mario@gmail.com', clave: CLAVE, confirmacion: CLAVE })

    // Assert
    expect(await screen.findByText('El email ya está registrado')).to.exist
    expect(rutaActual()).to.equal('/register')
    expect(sesionGuardada().token).to.be.null
  })

  it('datos correctos → 201, guarda la sesión sin la contraseña y entra al panel del usuario', async () => {
    // Arrange
    servidor.responder('POST', '/auth/register', creado({ user: usuario(), token: TOKEN_USUARIO }))
    servidor.responder('GET', '/orders/my', ok([]))
    const user = abrirApp('/register')

    // Act
    await registrarse(user, { nombre: 'Mario Andrade', email: '  Mario@Gmail.com ', clave: CLAVE, confirmacion: CLAVE })

    // Assert
    expect(await screen.findByRole('heading', { name: 'Hola, Mario' })).to.exist
    const [peticion] = servidor.peticiones('POST', '/auth/register')
    expect(peticion.body).to.deep.equal({ email: 'mario@gmail.com', name: 'Mario Andrade', password: CLAVE })
    expect(sesionGuardada().token).to.equal(TOKEN_USUARIO)
    expect(sesionGuardada().user).to.not.have.property('password')
  })
})

describe('Inicio de sesión — POST /auth/login', () => {
  it('credenciales incorrectas → 401, se ve el mensaje y no se recarga la página', async () => {
    // Arrange
    servidor.responder('POST', '/auth/login', fallo(401, 'Credenciales inválidas'))
    const redirecciones = capturarRedirecciones()
    const user = abrirApp('/login')

    // Act
    await ingresar(user, 'mario@gmail.com', 'no-es-la-clave')

    // Assert
    expect(await screen.findByText('Credenciales inválidas')).to.exist
    expect(redirecciones).to.be.empty
    expect(sesionGuardada().token).to.be.null
  })

  it('cuenta suspendida → 403 con el motivo', async () => {
    // Arrange
    servidor.responder('POST', '/auth/login', fallo(403, 'Tu cuenta ha sido suspendida. Motivo: Comportamiento fraudulento'))
    const user = abrirApp('/login')

    // Act
    await ingresar(user, 'mario@gmail.com', CLAVE)

    // Assert
    expect(await screen.findByText('Tu cuenta ha sido suspendida. Motivo: Comportamiento fraudulento')).to.exist
    expect(rutaActual()).to.equal('/login')
  })

  it('credenciales correctas → 200, guarda el token y lo usa en las siguientes peticiones', async () => {
    // Arrange
    servidor.responder('POST', '/auth/login', ok({ user: usuario(), token: TOKEN_USUARIO }))
    servidor.responder('GET', '/orders/my', ok([]))
    const user = abrirApp('/login')

    // Act
    await ingresar(user, 'mario@gmail.com', CLAVE)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Hola, Mario' })).to.exist
    expect(servidor.peticiones('POST', '/auth/login')[0].body).to.deep.equal({ email: 'mario@gmail.com', password: CLAVE })
    await waitFor(() => {
      expect(servidor.peticiones('GET', '/orders/my')[0]?.authorization).to.equal(`Bearer ${TOKEN_USUARIO}`)
    })
    expect(rutaActual()).to.equal('/dashboard')
  })

  it('sin backend → el mensaje no filtra detalles técnicos', async () => {
    // Arrange
    servidor.responder('POST', '/auth/login', sinConexion())
    const user = abrirApp('/login')

    // Act
    await ingresar(user, 'mario@gmail.com', CLAVE)

    // Assert
    expect(await screen.findByText('Error de conexión con el servidor')).to.exist
    expect(screen.queryByText(/network error/i)).to.be.null
  })
})

describe('Sesión — equivalente a GET /auth/me', () => {
  it('sin token → las rutas privadas mandan a /login', async () => {
    // Arrange
    const ruta = '/dashboard'

    // Act
    abrirApp(ruta)

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(rutaActual()).to.equal('/login')
  })

  it('token con firma inválida → 401: se borra la sesión y se vuelve a /login', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('GET', '/orders/my', fallo(401, 'Token inválido o expirado'))
    const redirecciones = capturarRedirecciones()

    // Act
    abrirApp('/dashboard')

    // Assert
    await waitFor(() => {
      expect(redirecciones).to.deep.equal(['/login'])
    })
    expect(sesionGuardada()).to.deep.equal({ token: null, user: null })
  })

  it('token válido → el perfil de la sesión se muestra en el panel y en la barra', async () => {
    // Arrange
    sesionIniciada(usuario({ name: 'Laura Gómez', email: 'laura@outlook.com' }))
    servidor.responder('GET', '/orders/my', ok([pedido()]))

    // Act
    abrirApp('/dashboard')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Hola, Laura' })).to.exist
    expect(screen.queryByText('laura@outlook.com')).to.exist
    expect(screen.queryByRole('link', { name: 'Laura' })).to.exist
    expect(screen.queryByRole('link', { name: 'Admin' })).to.be.null
  })

  it('con sesión, entrar a /login o /register lleva directo al panel', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([]))

    // Act
    abrirApp('/register')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Hola, Mario' })).to.exist
    expect(rutaActual()).to.equal('/dashboard')
  })

  it('cerrar sesión borra el token y vuelve a /login', async () => {
    // Arrange
    sesionIniciada()
    servidor.responder('GET', '/orders/my', ok([]))
    const user = abrirApp('/dashboard')
    await screen.findByRole('heading', { name: 'Hola, Mario' })

    // Act
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(sesionGuardada()).to.deep.equal({ token: null, user: null })
  })

  it('una sesión corrupta en el navegador se trata como si no hubiera sesión', async () => {
    // Arrange
    localStorage.setItem('cp_user', '{no es json')
    localStorage.setItem('cp_token', TOKEN_USUARIO)

    // Act
    abrirApp('/dashboard')

    // Assert
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).to.exist
    expect(sesionGuardada().token).to.be.null
  })
})

describe('Mientras el backend responde', () => {
  it('el login deshabilita el botón y avisa que está ingresando', async () => {
    // Arrange
    servidor.colgar('POST', '/auth/login')
    const user = abrirApp('/login')

    // Act
    await ingresar(user, 'mario@gmail.com', CLAVE)

    // Assert
    expect(await screen.findByRole('button', { name: 'Ingresando...' })).to.have.property('disabled', true)
  })

  it('el registro deshabilita el botón y avisa que está creando la cuenta', async () => {
    // Arrange
    servidor.colgar('POST', '/auth/register')
    const user = abrirApp('/register')

    // Act
    await registrarse(user, { nombre: 'Mario', email: 'mario@gmail.com', clave: CLAVE, confirmacion: CLAVE })

    // Assert
    expect(await screen.findByRole('button', { name: 'Creando cuenta...' })).to.have.property('disabled', true)
  })
})
