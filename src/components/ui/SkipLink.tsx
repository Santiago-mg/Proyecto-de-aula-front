/**
 * Primer elemento enfocable de la página: permite a quien navega con teclado
 * saltarse el menú e ir directo al contenido (WCAG 2.4.1). Solo se ve al
 * recibir foco.
 */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="cp-skip-link"
      onClick={(e) => {
        // Sin esto la URL pasa a /ruta#contenido y el historial se llena de saltos.
        e.preventDefault()
        const principal = document.getElementById('contenido')
        principal?.focus()
        principal?.scrollIntoView?.()
      }}
    >
      Saltar al contenido
    </a>
  )
}
