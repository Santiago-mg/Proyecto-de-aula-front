import { expect } from 'chai'
import { describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from '../../../src/components/ui/PasswordInput'

// Basado en: PasswordInput.tsx — alternar la visibilidad de la contraseña

describe('PasswordInput — mostrar y ocultar', () => {
  it('empieza oculta y el botón ofrece mostrarla', () => {
    render(<PasswordInput aria-label="clave" />)
    expect((screen.getByLabelText('clave') as HTMLInputElement).type).to.equal('password')
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' }).getAttribute('aria-pressed')).to.equal('false')
  })

  it('al pulsar el botón se muestra el texto y el botón pasa a ofrecer ocultarla', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="clave" />)

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

    expect((screen.getByLabelText('clave') as HTMLInputElement).type).to.equal('text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' }).getAttribute('aria-pressed')).to.equal('true')
  })

  it('pulsar otra vez la vuelve a ocultar', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="clave" />)

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))

    expect((screen.getByLabelText('clave') as HTMLInputElement).type).to.equal('password')
  })

  it('el botón no envía el formulario (type="button")', () => {
    render(<PasswordInput aria-label="clave" />)
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' }).getAttribute('type')).to.equal('button')
  })

  it('marca el campo como inválido para los lectores de pantalla solo cuando hay error', () => {
    const { rerender } = render(<PasswordInput aria-label="clave" invalid={false} />)
    expect(screen.getByLabelText('clave').getAttribute('aria-invalid')).to.be.null
    rerender(<PasswordInput aria-label="clave" invalid />)
    expect(screen.getByLabelText('clave').getAttribute('aria-invalid')).to.equal('true')
  })

  it('reenvía el valor que se escribe (compatible con react-hook-form)', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="clave" />)
    await user.type(screen.getByLabelText('clave'), 'abc123')
    expect((screen.getByLabelText('clave') as HTMLInputElement).value).to.equal('abc123')
  })
})
