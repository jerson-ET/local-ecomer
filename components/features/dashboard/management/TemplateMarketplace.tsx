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
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Sora', 'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .tm-glow { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%); pointer-events: none; }
      `}</style>

      <div className="tm-glow" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 600, padding: 40 }}>
        <div style={{ width: 80, height: 80, background: 'rgba(124,58,237,0.1)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(124,58,237,0.2)' }}>
          <Sparkles size={36} color="#a78bfa" />
        </div>
        
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1, background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Plantillas en Desarrollo
        </h1>
        
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontWeight: 300, marginBottom: 32 }}>
          Estamos preparando diseños premium increíbles para tu tienda. Esta sección estará disponible en unos días para que elijas la plantilla perfecta.
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)' }}>
          <Layout size={18} color="#a78bfa" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Próximamente disponible</span>
        </div>
      </div>
    </div>
  )
}
