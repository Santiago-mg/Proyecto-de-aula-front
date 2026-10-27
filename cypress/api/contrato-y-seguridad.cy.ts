/// <reference types="cypress" />
import { CLAVE } from '../support/comandos'

// Pruebas de API con cy.request (failOnStatusCode:false para poder verificar los errores esperados).
// Contrato: backend de Proyecto-de-aula-mario (src/interface/routes/*.routes.ts).
// Los correos usan un dominio permitido (@gmail.com): el registro rechaza los demás.
const api = () => Cypress.env('apiUrl') as string
const pedir = (opciones: Partial<Cypress.RequestOptions>) => cy.request({ failOnStatusCode: false, ...opciones })

describe('API — registro y sesión (positivos)', () => {
  it('registrar devuelve 201, token y solo campos públicos', () => {
    pedir({ method: 'POST', url: `${api()}/auth/register`, body: { email: `cy+${Date.now()}@gmail.com`, name: 'Ana', password: CLAVE } }).then((r) => {
      expect(r.status).to.eq(201)
      expect(r.body.data.token).to.be.a('string')
      expect(Object.keys(r.body.data.user).sort()).to.deep.eq(['banReason', 'banned', 'bannedAt', 'createdAt', 'email', 'id', 'name', 'role', 'updatedAt'])
      expect(r.body.data.user).to.not.have.property('password')
    })
  })

  it('el correo se guarda en minúsculas y sin espacios', () => {
    const e = `Cy+${Date.now()}@Gmail.COM`
    pedir({ method: 'POST', url: `${api()}/auth/register`, body: { email: ` ${e} `, name: 'Ana', password: CLAVE } }).then((r) => {
      expect(r.body.data.user.email).to.eq(e.toLowerCase())
    })
  })

  it('perfil: PATCH /auth/me cambia solo el nombre (rol y correo se ignoran)', () => {
    cy.registrarPorApi().then(({ token, email }) => {
      pedir({ method: 'PATCH', url: `${api()}/auth/me`, auth: { bearer: token }, body: { name: 'Ana Nueva', role: 'ADMIN', email: 'otro@gmail.com' } }).then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body.data).to.include({ name: 'Ana Nueva', role: 'USER', email })
      })
    })
  })

  it('ciclo: PUT /auth/me/password → 204; la nueva entra y la anterior ya no', () => {
    cy.registrarPorApi().then(({ token, email }) => {
      pedir({ method: 'PUT', url: `${api()}/auth/me/password`, auth: { bearer: token }, body: { currentPassword: CLAVE, newPassword: 'ClaveNueva2027' } }).then((r) => {
        expect(r.status).to.eq(204)
        pedir({ method: 'POST', url: `${api()}/auth/login`, body: { email, password: 'ClaveNueva2027' } }).its('status').should('eq', 200)
        pedir({ method: 'POST', url: `${api()}/auth/login`, body: { email, password: CLAVE } }).its('status').should('eq', 401)
      })
    })
  })

  it('perfil: contraseña actual incorrecta → 400 (no 401, para no cerrar la sesión)', () => {
    cy.registrarPorApi().then(({ token }) => {
      pedir({ method: 'PUT', url: `${api()}/auth/me/password`, auth: { bearer: token }, body: { currentPassword: 'NoEsLaClave1', newPassword: 'ClaveNueva2027' } }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('La contraseña actual no es correcta')
      })
    })
  })
})

describe('API — casos negativos de credenciales', () => {
  it('contraseña incorrecta con el correo correcto → 401 "Credenciales inválidas"', () => {
    cy.registrarPorApi().then(({ email }) => {
      pedir({ method: 'POST', url: `${api()}/auth/login`, body: { email, password: 'ClaveEquivocada1' } }).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.body).to.deep.eq({ error: 'Credenciales inválidas' })
      })
    })
  })

  it('correo inexistente con una contraseña válida → la MISMA respuesta (no revela si la cuenta existe)', () => {
    pedir({ method: 'POST', url: `${api()}/auth/login`, body: { email: 'nadie.existe@gmail.com', password: CLAVE } }).then((r) => {
      expect(r.status).to.eq(401)
      expect(r.body).to.deep.eq({ error: 'Credenciales inválidas' })
    })
  })

  it('correo repetido → 409', () => {
    cy.registrarPorApi().then(({ email }) => {
      pedir({ method: 'POST', url: `${api()}/auth/register`, body: { email: email.toUpperCase(), name: 'Otra', password: CLAVE } }).its('status').should('eq', 409)
    })
  })

  it('token mal formado → 401 "Token inválido o expirado"', () => {
    pedir({ url: `${api()}/auth/me`, auth: { bearer: 'abc.def' } }).then((r) => {
      expect(r.status).to.eq(401)
      expect(r.body).to.deep.eq({ error: 'Token inválido o expirado' })
    })
  })

  it('correo con dominio no permitido al registrarse → 400 con el campo email', () => {
    pedir({ method: 'POST', url: `${api()}/auth/register`, body: { email: `cy+${Date.now()}@empresa.com`, name: 'Ana', password: CLAVE } }).then((r) => {
      expect(r.status).to.eq(400)
      expect(r.body.errors).to.deep.include({ field: 'email', message: 'Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud.' })
    })
  })

  it('contraseña sin mayúscula → 400 con la regla incumplida', () => {
    pedir({ method: 'POST', url: `${api()}/auth/register`, body: { email: `cy+${Date.now()}@gmail.com`, name: 'Ana', password: 'segura2026' } }).then((r) => {
      expect(r.status).to.eq(400)
      expect(r.body.errors).to.deep.include({ field: 'password', message: 'La contraseña debe incluir al menos una letra mayúscula' })
    })
  })

  it('demasiados intentos fallidos → 429 con Retry-After', () => {
    cy.registrarPorApi().then(({ email }) => {
      const intento = (n: number): Cypress.Chainable => n === 0
        ? pedir({ method: 'POST', url: `${api()}/auth/login`, body: { email, password: 'Equivocada9' } })
        : pedir({ method: 'POST', url: `${api()}/auth/login`, body: { email, password: 'Equivocada9' } }).then(() => intento(n - 1))
      intento(10).then((r: any) => {
        expect(r.status).to.eq(429)
        expect(Number(r.headers['retry-after'])).to.be.greaterThan(0)
      })
    })
  })
})

describe('API — validación y entradas hostiles', () => {
  it('contraseña solo con números → 400 con el campo señalado', () => {
    pedir({ method: 'POST', url: `${api()}/auth/register`, body: { email: `cy+${Date.now()}@gmail.com`, name: 'Ana', password: '12345678' } }).then((r) => {
      expect(r.status).to.eq(400)
      expect(r.body.errors.map((e: { field: string }) => e.field)).to.include('password')
    })
  })

  ;[
    ["inyección SQL", "' OR 1=1 --@gmail.com"],
    ['script en el correo', '<script>alert(1)</script>@gmail.com'],
  ].forEach(([caso, email]) => {
    it(`correo con ${caso} → 400`, () => {
      pedir({ method: 'POST', url: `${api()}/auth/login`, body: { email, password: CLAVE } }).its('status').should('eq', 400)
    })
  })

  it('JSON mal formado → 400 (no 500)', () => {
    pedir({ method: 'POST', url: `${api()}/auth/login`, headers: { 'Content-Type': 'application/json' }, body: '{"email": "a@b.co", ' }).its('status').should('eq', 400)
  })

  it('cuerpo de 300 KB → 413 (no 500)', () => {
    pedir({ method: 'POST', url: `${api()}/auth/login`, body: { email: 'a@b.co', password: 'x'.repeat(300_000) } }).its('status').should('eq', 413)
  })

  it('no se puede asignar el rol ADMIN al registrarse', () => {
    pedir({ method: 'POST', url: `${api()}/auth/register`, body: { email: `cy+${Date.now()}@gmail.com`, name: 'Ana', password: CLAVE, role: 'ADMIN' } }).then((r) => {
      expect(r.body.data.user.role).to.eq('USER')
    })
  })
})

describe('API — control de roles y cabeceras', () => {
  const protegidos: Array<[string, string]> = [['GET', '/admin/alerts'], ['GET', '/admin/stats'], ['GET', '/admin/users']]

  protegidos.forEach(([metodo, ruta]) => {
    it(`${metodo} ${ruta}: sin sesión 401, cliente 403`, () => {
      pedir({ method: metodo, url: `${api()}${ruta}` }).its('status').should('eq', 401)
      cy.registrarPorApi().then(({ token }) => {
        pedir({ method: metodo, url: `${api()}${ruta}`, auth: { bearer: token } }).its('status').should('eq', 403)
      })
    })
  })

  it('el administrador ve las alertas y cada una trae los campos que consume el panel', () => {
    cy.tokenDeAdmin().then((token) => {
      pedir({ url: `${api()}/admin/alerts`, auth: { bearer: token } }).then((r) => {
        expect(r.status).to.eq(200)
        r.body.data.forEach((a: any) => {
          expect(Object.keys(a).sort()).to.deep.eq(['createdAt', 'id', 'isResolved', 'message', 'phone', 'phoneId', 'type'])
          expect(a.type).to.be.oneOf(['LOW_STOCK', 'OUT_OF_STOCK'])
        })
      })
    })
  })

  it('las respuestas no anuncian el framework (sin X-Powered-By)', () => {
    cy.tokenDeAdmin().then((token) => {
      pedir({ url: `${api()}/admin/alerts`, auth: { bearer: token } }).then((r) => {
        expect(r.headers).to.not.have.property('x-powered-by')
      })
    })
  })

  // El backend agregó helmet y Cache-Control: no-store (criterio 2)
  it('las respuestas con tokens no se guardan en caché y llevan las cabeceras de helmet', () => {
    cy.tokenDeAdmin().then((token) => {
      pedir({ url: `${api()}/admin/alerts`, auth: { bearer: token } }).then((r) => {
        expect(r.headers['cache-control']).to.eq('no-store')
        expect(r.headers['x-content-type-options']).to.eq('nosniff')
        expect(r.headers['x-frame-options']).to.eq('SAMEORIGIN')
      })
    })
  })

  it('banear a otro administrador → 403 (H7.1: la regla ya no depende solo de la pantalla)', () => {
    cy.tokenDeAdmin().then((token) => {
      pedir({ url: `${api()}/admin/users?search=admin@celularpro.co`, auth: { bearer: token } }).then((lista) => {
        const yo = lista.body.data.find((u: { email: string }) => u.email === 'admin@celularpro.co')
        // Se crea un cliente, se promueve a admin y se intenta banear
        cy.registrarPorApi().then(({ email }) => {
          pedir({ url: `${api()}/admin/users?search=${encodeURIComponent(email)}`, auth: { bearer: token } }).then((r) => {
            const otro = r.body.data[0]
            expect(otro.id).to.not.eq(yo.id)
            pedir({ method: 'PUT', url: `${api()}/admin/users/${otro.id}/role`, auth: { bearer: token }, body: { role: 'ADMIN' } })
              .its('status').should('eq', 200)
            pedir({ method: 'PUT', url: `${api()}/admin/users/${otro.id}/ban`, auth: { bearer: token }, body: { reason: 'prueba de regla' } }).then((ban) => {
              expect(ban.status).to.eq(403)
              expect(ban.body.error).to.eq('No puedes banear a un administrador. Quítale primero el rol de administrador.')
            })
          })
        })
      })
    })
  })
})
