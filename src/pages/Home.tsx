import { ShieldCheck, Zap, RefreshCw, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PhoneCard } from '../components/phones/PhoneCard'
import { Loading } from '../components/ui/Loading'
import { ContainerScroll } from '../components/ui/ContainerScrollAnimation'
import { RevealOnScroll } from '../components/ui/RevealOnScroll'
import { ShaderBackground } from '../components/ui/ShaderBackground'
import { HeroGeometric } from '../components/ui/shape-landing-hero'
import { phonesService } from '../services/phones.service'
import type { PhoneListItem } from '../types/phone'

// Contenido de la tarjeta 3D: cargando, sin equipos o la grilla de destacados
function Destacados({ loading, featured }: Readonly<{ loading: boolean; featured: PhoneListItem[] }>) {
  if (loading) return <Loading />

  if (featured.length === 0) {
    return (
      <div className="cp-featured-empty">
        <span className="cp-featured-empty-icon" aria-hidden="true">📱</span>
        <span className="cp-featured-empty-text">Pronto habrá equipos disponibles.</span>
      </div>
    )
  }

  return (
    <div className="cp-featured-grid">
      {featured.slice(0, 6).map((p) => (
        <PhoneCard key={p.id} phone={p} />
      ))}
    </div>
  )
}

export function Home() {
  const [featured, setFeatured] = useState<PhoneListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    phonesService
      .getAll({ limit: 6 })
      .then((r) => setFeatured(r.data))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/*
       * ── FONDO SPLIT ──────────────────────────────────────────────────────
       * Primera mitad (hero): ShaderBackground WebGL + elipses HeroGeometric
       * Segunda mitad (catálogo en adelante): ShaderBackground plasma visible
       */}
      <ShaderBackground />

      {/* ─── HERO — Primera mitad: elipses flotantes + texto ──── */}
      <section className="cp-hero cp-hero-open">
        <HeroGeometric>
          {/* Contenido propio de CelularPro dentro del wrapper de formas */}
          <div className="cp-container cp-hero-content">
            <div className="cp-eyebrow cp-eyebrow-hero">
              — Celulares certificados · Medellín, Colombia
            </div>
            <h1 className="cp-hero-title">
              Compra un celular
              <br />
              en el que puedes{' '}
              <em className="cp-em-accent">
                confiar.
              </em>
            </h1>
            <p className="cp-hero-subtitle">
              Cada equipo pasa por 32 puntos de inspección técnica. Recibes el
              reporte completo antes de decidir. Sin sorpresas.
            </p>
            <div className="cp-hero-actions">
              <Link to="/catalog" className="cp-btn cp-btn-primary cp-btn-lg">
                Ver catálogo →
              </Link>
              <Link
                to="/catalog?condition=CERTIFIED"
                className="cp-btn cp-btn-secondary cp-btn-lg"
              >
                Certificados
              </Link>
            </div>
          </div>
        </HeroGeometric>
      </section>

      {/* ─── TRUST STRIP ──────────────────────────────────────── */}
      <section className="cp-trust-strip">
        <div className="cp-container cp-trust-strip-grid">
          {[
            { icon: <ShieldCheck size={20} />, label: '32 puntos de inspección' },
            { icon: <Zap size={20} />, label: 'Batería verificada' },
            { icon: <RefreshCw size={20} />, label: 'Garantía incluida' },
            { icon: <Star size={20} />, label: '4.9 ★ de satisfacción' },
          ].map((t) => (
            <div key={t.label} className="cp-trust-strip-item">
              <span className="cp-trust-strip-icon">{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CATÁLOGO CON SCROLL ANIMATION — Segunda mitad: plasma shader ── */}
      {/* background: transparent → el ShaderBackground se ve directamente */}
      <section className="cp-section cp-section-open">
        <ContainerScroll
          titleComponent={
            <div className="cp-showcase-head">
              <div className="cp-eyebrow cp-eyebrow-mb20">
                — Catálogo destacado
              </div>
              <h2 className="cp-showcase-title">
                Celulares listos{' '}
                <span className="cp-showcase-glow">para hoy.</span>
              </h2>
              <p className="cp-showcase-desc">
                Nuevos, certificados y usados verificados. Todos con IMEI
                limpio y garantía real.
              </p>
            </div>
          }
        >
          {/* Contenido dentro de la tarjeta 3D */}
          <Destacados loading={loading} featured={featured} />
        </ContainerScroll>

        {/* CTA debajo de la tarjeta */}
        <RevealOnScroll>
          <div className="cp-center-cta">
            <Link to="/catalog" className="cp-btn cp-btn-primary cp-btn-lg">
              Ver catálogo completo →
            </Link>
          </div>
        </RevealOnScroll>
      </section>

      {/* ─── MANIFIESTO ───────────────────────────────────────── */}
      <section className="cp-section cp-manifesto">
        <div className="cp-container">
          <RevealOnScroll>
            <div className="cp-manifesto-header">
              <span className="cp-eyebrow">— Por qué existimos</span>
              <h2 className="cp-manifesto-title">
                El mercado de celulares usados
                <br />
                tiene un problema de{' '}
                <em className="cp-em-accent">
                  confianza.
                </em>
              </h2>
            </div>
          </RevealOnScroll>

          {[
            {
              n: '01',
              title: 'Inspección real',
              desc: 'Revisamos pantalla, batería, cámara, altavoces, conectores, IMEI y 26 puntos más. El reporte es tuyo antes de comprar.',
            },
            {
              n: '02',
              title: 'Batería certificada',
              desc: 'Publicamos el porcentaje exacto de salud de batería. Si dice 91%, es 91%. Equipos bajo 80% no entran a nuestro catálogo.',
            },
            {
              n: '03',
              title: 'Garantía sin letra pequeña',
              desc: '6 meses en certificados, 30 días en usados. Si falla algo cubierto, lo reparamos o devolvemos tu dinero. Sin preguntas.',
            },
            {
              n: '04',
              title: 'IMEI limpio garantizado',
              desc: 'Verificamos que cada equipo esté libre de reportes, bloqueos de operador y deudas. Recibes el certificado con tu compra.',
            },
          ].map((b, i) => (
            <RevealOnScroll key={b.n} delay={i * 0.08}>
              <div className="cp-manifesto-row">
                <span className="cp-manifesto-num">{b.n}</span>
                <h3 className="cp-manifesto-item-title">{b.title}</h3>
                <p className="cp-manifesto-item-desc">{b.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ─── CATEGORÍAS ───────────────────────────────────────── */}
      <section className="cp-section cp-categories-section">
        <div className="cp-container">
          <RevealOnScroll>
            <div className="cp-section-header">
              <div>
                <div className="cp-eyebrow cp-eyebrow-mb16">
                  — Categorías más buscadas
                </div>
                <h2 className="cp-section-title">
                  Encuentra tu próximo teléfono por categoría
                </h2>
              </div>
              <Link to="/catalog" className="cp-btn cp-btn-secondary">
                Ver catálogo completo →
              </Link>
            </div>
          </RevealOnScroll>

          <div className="cp-category-grid">
            {[
              {
                id: 'apple',
                title: 'iPhone',
                subtitle: 'Equipos premium certificados',
                image: 'https://1000logos.net/wp-content/uploads/2016/10/Apple-Logo.png',
              },
              {
                id: 'samsung',
                title: 'Samsung',
                subtitle: 'Android potente y actualizado',
                image: 'https://images.samsung.com/is/image/samsung/assets/global/about-us/brand/logo/720_600_1.png?$720_N_PNG$',
              },
              {
                id: 'xiaomi',
                title: 'Xiaomi',
                subtitle: 'Calidad y precio competitivo',
                image: 'https://1000logos.net/wp-content/uploads/2021/08/Xiaomi-logo-500x281.png',
              },
              {
                id: 'motorola',
                title: 'Motorola',
                subtitle: 'Resistencia y duración comprobada',
                image: 'https://cdn.freebiesupply.com/logos/large/2x/motorola-2-logo-png-transparent.png',
              },
            ].map((category, i) => (
              <RevealOnScroll key={category.id} delay={i * 0.08}>
                <Link
                  to={`/catalog?category=${category.id}`}
                  className="cp-category-card"
                >
                  <div className="cp-category-card-img">
                    <img
                      src={category.image}
                      alt={category.title}
                      loading="lazy"
                    />
                  </div>
                  <div className="cp-category-card-body">
                    <span className="cp-category-card-label">{category.title}</span>
                    <p className="cp-category-card-sub">
                      {category.subtitle}
                    </p>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIOS ──────────────────────────────────────── */}
      <section className="cp-section">
        <div className="cp-container">
          <RevealOnScroll>
            <div className="cp-eyebrow cp-eyebrow-mb40">
              — Voces reales
            </div>
          </RevealOnScroll>
          <div className="cp-testimonials-grid">
            {[
              {
                q: 'Compré un iPhone 14 certificado. El reporte de batería fue exacto y llegó en perfectas condiciones.',
                a: 'Valentina Torres',
                r: 'Estudiante · Bogotá',
              },
              {
                q: 'La transparencia es lo que me convenció. Saber el estado real del equipo antes de pagar no tiene precio.',
                a: 'Andrés Mejía',
                r: 'Diseñador · Medellín',
              },
              {
                q: 'Encontré el Samsung S23 que buscaba a un precio justo. Todo como lo prometieron, IMEI limpio.',
                a: 'Carolina Ríos',
                r: 'Contadora · Cali',
              },
            ].map((t, i) => (
              <RevealOnScroll key={t.a} delay={i * 0.12}>
                <figure className="cp-testimonial">
                  <blockquote className="cp-testimonial-quote">
                    “{t.q}”
                  </blockquote>
                  <figcaption className="cp-testimonial-author">
                    <div>{t.a}</div>
                    <div className="cp-testimonial-role">
                      {t.r}
                    </div>
                  </figcaption>
                </figure>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section className="cp-section">
        <div className="cp-container">
          <RevealOnScroll>
            <div className="cp-cta-banner">
              <div className="cp-eyebrow cp-eyebrow-mb16">
                — Empieza hoy
              </div>
              <h2 className="cp-cta-title">
                Tu próximo celular,{' '}
                <em className="cp-em-light">sin riesgos.</em>
              </h2>
              <p className="cp-cta-desc">
                Regístrate gratis. Compra con garantía real. Si no queda
                satisfecho, te devolvemos el dinero.
              </p>
              <div className="cp-hero-actions">
                <Link
                  to="/register"
                  className="cp-btn cp-btn-primary cp-btn-lg"
                >
                  Crear cuenta gratis →
                </Link>
                <Link
                  to="/catalog"
                  className="cp-btn cp-btn-secondary cp-btn-lg"
                >
                  Ver catálogo
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  )
}
