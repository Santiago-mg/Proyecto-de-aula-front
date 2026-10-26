interface BotonMostrarProps {
  visible: boolean
  alternar(): void
  /** id del campo que controla */
  controla: string
}

/**
 * "Mostrar / Ocultar" para campos de contraseña. Escribir a ciegas es la causa
 * más común de contraseñas mal puestas (sobre todo en celular); ver lo escrito
 * evita el error en vez de explicarlo después.
 */
export function BotonMostrar({ visible, alternar, controla }: Readonly<BotonMostrarProps>) {
  return (
    <button
      type="button"
      className="cp-input-action"
      onClick={alternar}
      aria-controls={controla}
      title={visible ? 'Volver a ocultar lo que escribes' : 'Ver lo que escribes'}
    >
      {visible ? 'Ocultar' : 'Mostrar'}
    </button>
  )
}
