import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Nav } from '../../../../src/components/layout/Nav'

/**
 * El panel de Mario (/admin) muestra las alertas de stock bajo (función 14),
 * por eso su menú manda al admin ahí. En este front el enlace "Admin" lleva a
 * /admin/phones y su propia prueba (test/unit/interfaz/navegacion.test.tsx)
 * así lo exige; además este panel no tiene alertas de stock. Es una decisión
 * de diseño distinta, no un defecto: no se cambia sin decidirlo antes.
 */

vi.mock('../../../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'a1', email: 'admin@celularpro.co', name: 'Mario Gómez', role: 'ADMIN', createdAt: '' },
    logout: vi.fn(),
  }),
}))
vi.mock('../../../../src/context/CartContext', () => ({ useCart: () => ({ totalItems: 0 }) }))

describe('Regresión — enlace Admin del menú', () => {
  it('regresion_enlace_admin_lleva_al_dashboard_con_las_alertas_de_stock', () => {
    // Antes apuntaba a /admin/phones y el admin no veía las alertas al entrar.
    render(
      <MemoryRouter>
        <Nav onOpenCart={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Admin' }).getAttribute('href')).toBe('/admin')
  })
})
