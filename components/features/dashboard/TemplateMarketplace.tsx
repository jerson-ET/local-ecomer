'use client'

import { useState } from 'react'
import { Crown, Star, Eye, Zap, Check, ArrowRight, Sparkles, ShoppingBag, Layout, Monitor, Smartphone } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TEMPLATE MARKETPLACE — Tienda de Plantillas Premium                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TemplateInfo {
  id: string
  name: string
  description: string
  category: string
  price: number
  originalPrice?: number
  colors: string[]
  features: string[]
  previewUrl?: string
  isFree: boolean
  isNew?: boolean
  rating: number
  reviews: number
}

const templates: TemplateInfo[] = [
  {
    id: 'store-minimal',
    name: 'Vendedor Minimalista',
    description: 'Catálogo ultra limpio con diseño claro y enfoque total en tus productos. Perfecto para cualquier tipo de negocio.',
    category: 'General',
    price: 0,
    colors: ['#FFFFFF', '#F8FAFC', '#E2E8F0', '#1E293B'],
    features: ['Diseño Limpio', 'Carrusel de Productos', 'Checkout Rápido', 'Optimizado Móvil'],
    isFree: true,
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 'estilo-shop',
    name: 'Estilo Shop',
    description: 'Plantilla premium de alto impacto para moda y accesorios. Animaciones cinematográficas, partículas interactivas, hero full-screen y diseño dark mode que impresiona.',
    category: 'Moda & Accesorios',
    price: 49900,
    originalPrice: 89900,
    colors: ['#1a1a2e', '#7c3aed', '#2563eb', '#e8e8f0'],
    features: ['Hero Cinemático', 'Partículas Animadas', 'Filtros Categoría', 'Dark Mode Premium', 'Marquee Animado', 'Footer Profesional'],
    previewUrl: '/templates/estilo-shop/preview',
    isFree: false,
    isNew: true,
    rating: 5.0,
    reviews: 0,
  },
]

export default function TemplateMarketplace() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .tm-card { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .tm-card:hover { transform: translateY(-8px); box-shadow: 0 30px 80px rgba(124, 58, 237, 0.2); border-color: rgba(124, 58, 237, 0.4) !important; }
        .tm-badge-pulse { animation: tm-pulse 2s ease-in-out infinite; }
        @keyframes tm-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); } 50% { box-shadow: 0 0 0 12px rgba(124, 58, 237, 0); } }
        .tm-glow { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%); pointer-events: none; }
        .tm-feature-tag { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.5); white-space: nowrap; }
        .tm-btn-primary { background: linear-gradient(135deg, #7c3aed, #2563eb); color: white; border: none; padding: 14px 32px; border-radius: 14px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 10px; }
        .tm-btn-primary:hover { transform: scale(1.03); box-shadow: 0 10px 40px rgba(124, 58, 237, 0.4); }
        .tm-btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); padding: 12px 24px; border-radius: 14px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; }
        .tm-btn-outline:hover { border-color: rgba(124,58,237,0.5); color: white; }
        .tm-color-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); }
        .tm-star { color: #fbbf24; }
      `}</style>

      {/* ─── HERO HEADER ─── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div className="tm-glow" style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', padding: '8px 20px', borderRadius: 30, marginBottom: 24, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#a78bfa' }}>
            <Layout size={14} /> Tienda de Plantillas
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1, background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Diseños que Venden
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.6, fontWeight: 300 }}>
            Elige una plantilla profesional para tu tienda. Tus productos se verán increíbles desde el primer momento.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' as const }}>
            {[
              { n: templates.length, l: 'Plantillas' },
              { n: templates.filter(t => t.isFree).length, l: 'Gratis' },
              { n: templates.filter(t => t.isNew).length, l: 'Nuevas' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#a78bfa' }}>{s.n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' as const }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TEMPLATE CARDS ─── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
        {templates.map(tmpl => (
          <div key={tmpl.id} className="tm-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
            onClick={() => setSelectedTemplate(selectedTemplate === tmpl.id ? null : tmpl.id)}>

            {/* Preview Area */}
            <div style={{ position: 'relative', height: 240, background: `linear-gradient(135deg, ${tmpl.colors[0]}, ${tmpl.colors[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {tmpl.previewUrl ? (
                <>
                  {/* Real preview thumbnail using demo images */}
                  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                    <img
                      src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=60"
                      alt={`${tmpl.name} preview`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tmpl.colors[0]}80, ${tmpl.colors[1]}dd)` }} />
                  </div>
                  {/* Phone mockup */}
                  <div style={{ position: 'relative', zIndex: 1, width: 120, height: 200, background: '#0f0f1a', borderRadius: 16, border: '3px solid rgba(255,255,255,0.15)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                      <img
                        src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=60"
                        alt="Template preview"
                        style={{ width: '100%', height: '60%', objectFit: 'cover', opacity: 0.8 }}
                      />
                      <div style={{ padding: 6 }}>
                        <div style={{ height: 4, width: '70%', background: 'rgba(139,92,246,0.4)', borderRadius: 2, marginBottom: 4 }} />
                        <div style={{ height: 3, width: '50%', background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 6 }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                          {[0,1,2,3].map(i => <div key={i} style={{ height: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Preview CTA overlay */}
                  <button
                    onClick={e => { e.stopPropagation(); window.open(tmpl.previewUrl, '_blank') }}
                    style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 2, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 20px', borderRadius: 30, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.5, transition: 'all 0.3s ease' }}
                  >
                    <Eye size={14} /> Ver Demo en Vivo
                  </button>
                </>
              ) : (
                <div style={{ width: '80%', height: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' as const, padding: 16, gap: 8 }}>
                  <div style={{ height: 8, width: '60%', background: `${tmpl.colors[2]}40`, borderRadius: 4 }} />
                  <div style={{ height: 6, width: '80%', background: 'rgba(255,255,255,0.08)', borderRadius: 3 }} />
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ background: `${tmpl.colors[i % tmpl.colors.length]}30`, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Badges */}
              {tmpl.isNew && (
                <div className="tm-badge-pulse" style={{ position: 'absolute', top: 16, left: 16, background: '#7c3aed', color: 'white', fontSize: 10, fontWeight: 800, padding: '5px 12px', borderRadius: 20, letterSpacing: 1, textTransform: 'uppercase' as const, zIndex: 3 }}>
                  NUEVA
                </div>
              )}
              {tmpl.isFree && (
                <div style={{ position: 'absolute', top: 16, right: 16, background: '#10b981', color: 'white', fontSize: 10, fontWeight: 800, padding: '5px 12px', borderRadius: 20, letterSpacing: 1, textTransform: 'uppercase' as const, zIndex: 3 }}>
                  GRATIS
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{tmpl.name}</h3>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8 }}>
                  {tmpl.category}
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 16px' }}>
                {tmpl.description}
              </p>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="tm-star" fill={i < Math.floor(tmpl.rating) ? '#fbbf24' : 'none'} />
                ))}
                <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4 }}>{tmpl.rating}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>({tmpl.reviews} reseñas)</span>
              </div>

              {/* Colors */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {tmpl.colors.map((c, i) => (
                  <div key={i} className="tm-color-dot" style={{ background: c }} />
                ))}
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 20 }}>
                {tmpl.features.slice(0, 4).map((f, i) => (
                  <span key={i} className="tm-feature-tag">{f}</span>
                ))}
                {tmpl.features.length > 4 && (
                  <span className="tm-feature-tag" style={{ color: '#a78bfa' }}>+{tmpl.features.length - 4}</span>
                )}
              </div>

              {/* Price & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  {tmpl.isFree ? (
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>Gratis</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 800 }}>${tmpl.price.toLocaleString('es-CO')}</span>
                      {tmpl.originalPrice && (
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                          ${tmpl.originalPrice.toLocaleString('es-CO')}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>COP</span>
                    </div>
                  )}
                </div>
                <button className="tm-btn-primary" onClick={e => { e.stopPropagation(); /* future: purchase flow */ }}>
                  {tmpl.isFree ? 'Usar' : 'Comprar'} <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Expanded Detail */}
            {selectedTemplate === tmpl.id && (
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 20, color: '#a78bfa', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                  Todas las Características
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {tmpl.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      <Check size={14} color="#10b981" /> {f}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  {tmpl.previewUrl && (
                    <button className="tm-btn-outline" onClick={e => { e.stopPropagation(); window.open(tmpl.previewUrl, '_blank') }}>
                      <Eye size={16} /> Ver Demo en Vivo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Coming Soon Card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 24, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', minHeight: 400 }}>
          <div style={{ width: 64, height: 64, background: 'rgba(124,58,237,0.1)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Sparkles size={28} color="#7c3aed" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Más Plantillas Pronto</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', maxWidth: 280, lineHeight: 1.6 }}>
            Estamos creando plantillas premium para restaurantes, tecnología, servicios y más.
          </p>
        </div>
      </div>
    </div>
  )
}
