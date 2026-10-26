import { ChevronDown, LifeBuoy, Mail, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { EmptyState } from '../components/ui/EmptyState'
import { usePreferencias } from '../context/PreferencesContext'
import { CORREO_SOPORTE, TEMAS_AYUDA, TODAS_LAS_PREGUNTAS } from '../content/ayuda'
import { ATAJOS } from '../hooks/useAtajos'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { normalizar } from '../utils/busqueda'
import { reabrirGuia } from '../components/ui/OnboardingTip'

function Pregunta({
  id,
  pregunta,
  respuesta,
  abierta,
  alternar,
}: Readonly<{ id: string; pregunta: string; respuesta: string; abierta: boolean; alternar(): void }>) {
  return (
    <div className="cp-faq-item">
      <h3 className="cp-faq-q">
        <button
          type="button"
          id={`faq-${id}`}
          aria-expanded={abierta}
          aria-controls={`faq-${id}-respuesta`}
          onClick={alternar}
        >
          <span>{pregunta}</span>
          <ChevronDown size={18} aria-hidden="true" className="cp-faq-chevron" />
        </button>
      </h3>
      <div
        id={`faq-${id}-respuesta`}
        role="region"
        aria-labelledby={`faq-${id}`}
        hidden={!abierta}
        className="cp-faq-a"
      >
        <p>{respuesta}</p>
      </div>
    </div>
  )
}

export function Help() {
  useDocumentTitle('Centro de ayuda')
  const { hash } = useLocation()
  const navigate = useNavigate()
  const { abrirPanel } = usePreferencias()
  const [consulta, setConsulta] = useState('')
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())

  // Entrar con /ayuda#garantias lleva a esa sección.
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView?.()
  }, [hash])

  const buscando = normalizar(consulta).length > 0
  const coincidencias = useMemo(() => {
    const q = normalizar(consulta)
    if (!q) return null
    const palabras = q.split(' ')
    return new Set(
      TODAS_LAS_PREGUNTAS.filter((p) => {
        const texto = normalizar(`${p.pregunta} ${p.respuesta} ${p.tema}`)
        return palabras.every((w) => texto.includes(w))
      }).map((p) => p.id),
    )
  }, [consulta])

  function alternar(id: string) {
    setAbiertas((previas) => {
      const nuevas = new Set(previas)
      if (nuevas.has(id)) nuevas.delete(id)
      else nuevas.add(id)
      return nuevas
    })
  }

  return (
    <div className="cp-container cp-help">
      <Breadcrumbs migas={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Ayuda' }]} />

      <header className="cp-help-header">
        <div className="cp-eyebrow">— Estamos para ayudarte</div>
        <h1 className="cp-page-title">Centro de ayuda</h1>
        <p className="cp-page-lead">
          Respuestas rápidas sobre compras, equipos, garantías y tu cuenta.
        </p>
      </header>

      <div className="cp-help-search">
        <label htmlFor="ayuda-buscar" className="cp-label">
          Escribe tu duda
        </label>
        <div className="cp-help-search-field">
          <Search size={16} aria-hidden="true" />
          <input
            id="ayuda-buscar"
            type="search"
            className="cp-input"
            placeholder="Ej: envío, garantía, batería…"
            autoComplete="off"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
          />
        </div>
        <p className="cp-help-count" aria-live="polite">
          {coincidencias
            ? coincidencias.size === 0
              ? 'Ninguna pregunta coincide.'
              : `${coincidencias.size} ${coincidencias.size === 1 ? 'pregunta coincide' : 'preguntas coinciden'}.`
            : ''}
        </p>
      </div>

      {!buscando && (
        <nav aria-label="Temas de ayuda" className="cp-help-topics">
          {TEMAS_AYUDA.map((t) => (
            <Link key={t.id} to={{ hash: t.id }} className="cp-pill">
              {t.titulo}
            </Link>
          ))}
          <Link to={{ hash: 'atajos' }} className="cp-pill">
            Atajos de teclado
          </Link>
        </nav>
      )}

      {coincidencias?.size === 0 ? (
        <EmptyState
          icono={<LifeBuoy size={40} />}
          titulo="No encontramos esa pregunta"
          nivel={2}
          acciones={
            <>
              <button type="button" className="cp-btn cp-btn-secondary" onClick={() => setConsulta('')}>
                Ver todas las preguntas
              </button>
              <a className="cp-btn cp-btn-primary" href={`mailto:${CORREO_SOPORTE}`}>
                <Mail size={14} aria-hidden="true" /> Escribir a soporte
              </a>
            </>
          }
        >
          Prueba con otra palabra o escríbenos y te respondemos.
        </EmptyState>
      ) : (
        TEMAS_AYUDA.map((tema) => {
          const visibles = tema.preguntas.filter((p) => !coincidencias || coincidencias.has(p.id))
          if (visibles.length === 0) return null
          return (
            <section key={tema.id} id={tema.id} aria-labelledby={`tema-${tema.id}`} className="cp-help-section">
              <h2 id={`tema-${tema.id}`} className="cp-help-section-title">
                {tema.titulo}
              </h2>
              {visibles.map((p) => (
                <Pregunta
                  key={p.id}
                  id={p.id}
                  pregunta={p.pregunta}
                  respuesta={p.respuesta}
                  abierta={buscando || abiertas.has(p.id)}
                  alternar={() => alternar(p.id)}
                />
              ))}
            </section>
          )
        })
      )}

      {!buscando && (
        <>
          <section id="atajos" aria-labelledby="tema-atajos" className="cp-help-section">
            <h2 id="tema-atajos" className="cp-help-section-title">
              Atajos de teclado
            </h2>
            <p className="cp-help-text">
              Funcionan en cualquier página de la tienda, siempre que no estés escribiendo en un campo.
            </p>
            <dl className="cp-shortcuts">
              {ATAJOS.map((a) => (
                <div key={a.tecla} className="cp-shortcut-row">
                  <dt>
                    <kbd>{a.tecla}</kbd>
                  </dt>
                  <dd>{a.descripcion}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="accesibilidad" aria-labelledby="tema-accesibilidad" className="cp-help-section">
            <h2 id="tema-accesibilidad" className="cp-help-section-title">
              Pantalla y accesibilidad
            </h2>
            <p className="cp-help-text">
              Puedes elegir tema claro, oscuro o de alto contraste, agrandar el texto y reducir las animaciones. Se guarda en este navegador.
            </p>
            <div className="cp-help-actions">
              <button type="button" className="cp-btn cp-btn-secondary" onClick={abrirPanel}>
                Abrir pantalla y accesibilidad
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-ghost"
                onClick={() => {
                  reabrirGuia()
                  navigate('/catalog')
                }}
              >
                Ver la guía de bienvenida otra vez
              </button>
            </div>
          </section>

          <section aria-labelledby="tema-contacto" className="cp-help-contact">
            <h2 id="tema-contacto" className="cp-help-section-title">
              ¿No encontraste lo que buscabas?
            </h2>
            <p className="cp-help-text">
              Escríbenos a{' '}
              <a className="cp-link" href={`mailto:${CORREO_SOPORTE}`}>
                {CORREO_SOPORTE}
              </a>{' '}
              e incluye tu número de pedido si tu duda es sobre una compra.
            </p>
            <p className="cp-help-text">
              También puedes revisar{' '}
              <Link className="cp-link" to="/privacidad">
                cómo cuidamos tus datos
              </Link>
              .
            </p>
          </section>
        </>
      )}
    </div>
  )
}
