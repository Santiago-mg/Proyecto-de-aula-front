/**
 * Indicador de carga a pantalla completa de sección. Se anuncia como estado
 * (role="status") para que un lector de pantalla sepa que algo está pasando.
 */
export function Loading({ text = 'Cargando...' }: Readonly<{ text?: string }>) {
  return (
    <div className="cp-loading" role="status">
      <div className="cp-spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}
