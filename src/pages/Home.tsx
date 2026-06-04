import { ShieldCheck, Zap, RefreshCw, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PhoneCard } from '../components/phones/PhoneCard'
import { Loading } from '../components/ui/Loading'
import { phonesService } from '../services/phones.service'
import type { PhoneListItem } from '../types/phone'

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
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="cp-hero">
        <div className="cp-hero-bg" />
        <div className="cp-container cp-hero-content">
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 28,
            }}
          >
            — Celulares certificados · Medellín, Colombia
          </div>
          <h1 className="cp-hero-title">
            Compra un celular
            <br />
            en el que puedes{' '}
            <em style={{ color: 'var(--accent)', fontWeight: 300 }}>
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

      {/* ─── MANIFESTO ───────────────────────────────────────── */}
      <section className="cp-section cp-manifesto">
        <div className="cp-container">
          <div className="cp-manifesto-header">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--accent)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              — Por qué existimos
            </span>
            <h2 className="cp-manifesto-title">
              El mercado de celulares usados
              <br />
              tiene un problema de{' '}
              <em style={{ color: 'var(--accent)', fontWeight: 300 }}>
                confianza.
              </em>
            </h2>
          </div>

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
          ].map((b) => (
            <div key={b.n} className="cp-manifesto-row">
              <span className="cp-manifesto-num">{b.n}</span>
              <h3 className="cp-manifesto-item-title">{b.title}</h3>
              <p className="cp-manifesto-item-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CATEGORÍAS DESTACADAS ───────────────────────────── */}
      <section className="cp-section cp-categories-section">
        <div className="cp-container">
          <div className="cp-section-header">
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--accent)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
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

          <div className="cp-category-grid">
            {[
              {
                id: 'apple',
                title: 'iPhone',
                subtitle: 'Equipos premium certificados',
                image:
                  'https://1000logos.net/wp-content/uploads/2016/10/Apple-Logo.png',
              },
              {
                id: 'samsung',
                title: 'Samsung',
                subtitle: 'Android potente y actualizado',
                image:
                  'https://images.samsung.com/is/image/samsung/assets/global/about-us/brand/logo/720_600_1.png?$720_N_PNG$',
              },
              {
                id: 'xiaomi',
                title: 'Xiaomi',
                subtitle: 'Calidad y precio competitivo',
                image:
                  'https://1000logos.net/wp-content/uploads/2021/08/Xiaomi-logo-500x281.png',
              },
              {
                id: 'motorola',
                title: 'Motorola',
                subtitle: 'Resistencia y duración comprobada',
                image:
                  'https://cdn.freebiesupply.com/logos/large/2x/motorola-2-logo-png-transparent.png',
              },
            ].map((category) => (
              <Link
                key={category.id}
                to={`/catalog?category=${category.id}`}
                className="cp-category-card"
              >
                <div className="cp-category-card-img">
                  <img src={category.image} alt={category.title} loading="lazy" />
                  <div className="cp-category-card-tag">
                    <span>{category.title}</span>
                  </div>
                </div>
                <div className="cp-category-card-body">
                  <p>{category.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCTOS DESTACADOS ─────────────────────────────── */}
      <section className="cp-section" style={{ background: 'var(--surface)' }}>
        <div className="cp-container">
          <div className="cp-section-header">
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--accent)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                — Catálogo
              </div>
              <h2 className="cp-section-title">
                Celulares listos{' '}
                <em style={{ color: 'var(--accent)', fontWeight: 300 }}>
                  para hoy.
                </em>
              </h2>
            </div>
            <Link to="/catalog" className="cp-btn cp-btn-secondary">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <Loading />
          ) : featured.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', textAlign: 'center', padding: '40px 0' }}>
              Pronto habrá equipos disponibles.
            </p>
          ) : (
            <div className="cp-phones-grid">
              {featured.map((p) => (
                <PhoneCard key={p.id} phone={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── TESTIMONIOS ──────────────────────────────────────── */}
      <section className="cp-section">
        <div className="cp-container">
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--accent)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 40,
            }}
          >
            — Voces reales
          </div>
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
            ].map((t) => (
              <figure key={t.a} className="cp-testimonial">
                <blockquote className="cp-testimonial-quote">
                  "{t.q}"
                </blockquote>
                <figcaption className="cp-testimonial-author">
                  <div>{t.a}</div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: 12 }}>
                    {t.r}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section className="cp-section">
        <div className="cp-container">
          <div className="cp-cta-banner">
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--accent)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              — Empieza hoy
            </div>
            <h2 className="cp-cta-title">
              Tu próximo celular,{' '}
              <em style={{ fontWeight: 300 }}>sin riesgos.</em>
            </h2>
            <p className="cp-cta-desc">
              Regístrate gratis. Compra con garantía real. Si no queda
              satisfecho, te devolvemos el dinero.
            </p>
            <div className="cp-hero-actions">
              <Link to="/register" className="cp-btn cp-btn-primary cp-btn-lg">
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
        </div>
      </section>
    </div>
  )
}
