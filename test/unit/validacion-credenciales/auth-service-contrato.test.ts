import { expect } from 'chai'
import { describe, it } from 'vitest'
import { authService } from '../../../src/services/auth.service'
import { ok, servidor } from '../../helpers/servidor'
import { usuario } from '../../helpers/fixtures'

// Contrato con las rutas reales del backend (src/interface/routes/auth.routes.ts
// de Proyecto-de-aula-mario). Antes el front llamaba a PUT /auth/me,
// PUT /auth/password y POST /auth/logout, que el backend no tiene (404).

describe('authService — usa las rutas que existen en el backend', () => {
  it('updateProfile → PATCH /auth/me con solo el nombre', async () => {
    servidor.responder('PATCH', '/auth/me', ok(usuario({ name: 'Ana' })))

    const actualizado = await authService.updateProfile({ name: 'Ana' })

    expect(actualizado.name).to.equal('Ana')
    expect(servidor.peticiones('PATCH', '/auth/me')[0].body).to.deep.equal({ name: 'Ana' })
    expect(servidor.peticiones('PUT', '/auth/me')).to.be.empty
  })

  it('changePassword → PUT /auth/me/password y acepta 204 sin cuerpo', async () => {
    servidor.responder('PUT', '/auth/me/password', { status: 204 })

    const resultado = await authService.changePassword({ currentPassword: 'Vieja1234', newPassword: 'Nueva1234' })

    expect(resultado).to.be.undefined
    expect(servidor.peticiones('PUT', '/auth/me/password')[0].body).to.deep.equal({
      currentPassword: 'Vieja1234',
      newPassword: 'Nueva1234',
    })
  })

  it('no expone un logout de servidor (el backend no tiene esa ruta)', () => {
    expect(authService).to.not.have.property('logout')
  })
})
