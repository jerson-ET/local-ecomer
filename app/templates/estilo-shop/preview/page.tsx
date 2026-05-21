'use client'

import EstiloShopTemplate from '@/components/store-templates/EstiloShopTemplate'
import type { RealStore, RealProduct } from '@/components/store-templates/MinimalTemplate'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PREVIEW PAGE — Estilo Shop Template with Demo Data                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const demoStore: RealStore = {
  id: 'demo-estilo-shop',
  name: 'Estilo Shop',
  slug: 'estilo-shop-demo',
  description: 'Moda y accesorios premium para quienes buscan elegancia, distinción y las últimas tendencias.',
  theme_color: '#7c3aed',
  banner_url: JSON.stringify({
    templateId: 'estilo-shop',
    customUrls: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    ],
    whatsappNumber: '573001234567',
    socialInstagram: 'https://instagram.com/estiloshop',
    socialFacebook: 'https://facebook.com/estiloshop',
  }),
  whatsapp_number: '573001234567',
}

const demoProducts: RealProduct[] = [
  {
    id: 'demo-1',
    name: 'Blazer Oversized Premium',
    description: 'Blazer oversized de corte moderno en tela premium. Ideal para looks casuales y formales. Disponible en varios colores.',
    price: 189900,
    discount_price: 149900,
    category_id: 'Ropa',
    images: [{ full: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80', thumbnail: '', isMain: true }],
    stock: 15,
    is_active: true,
    currency: 'COP',
  },
  {
    id: 'demo-2',
    name: 'Vestido Cocktail Elegance',
    description: 'Vestido de cocktail con diseño exclusivo. Tela satinada con caída perfecta para eventos especiales.',
    price: 259900,
    category_id: 'Ropa',
    images: [{ full: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80', thumbnail: '', isMain: true }],
    stock: 8,
    is_active: true,
    currency: 'COP',
  },
  {
    id: 'demo-3',
    name: 'Bolso Crossbody Luxe',
    description: 'Bolso crossbody en cuero sintético de alta calidad. Diseño minimalista con acabados dorados.',
    price: 129900,
    discount_price: 99900,
    category_id: 'Accesorios',
    images: [{ full: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80', thumbnail: '', isMain: true }],
    stock: 20,
    is_active: true,
    currency: 'COP',
  },
  {
    id: 'demo-4',
    name: 'Gafas de Sol Aviator',
    description: 'Gafas de sol estilo aviator con protección UV400. Marco metálico dorado con lentes degradados.',
    price: 89900,
    category_id: 'Accesorios',
    images: [{ full: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80', thumbnail: '', isMain: true }],
    stock: 30,
    is_active: true,
    currency: 'COP',
  },
  {
    id: 'demo-5',
    name: 'Sneakers Urban White',
    description: 'Sneakers blancos de diseño urbano. Suela ergonómica y material transpirable para máximo confort.',
    price: 219900,
    discount_price: 179900,
    category_id: 'Calzado',
    images: [{ full: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80', thumbnail: '', isMain: true }],
    stock: 12,
    is_active: true,
    currency: 'COP',
  },
  {
    id: 'demo-6',
    name: 'Reloj Minimal Black',
    description: 'Reloj minimalista con correa de cuero negro y esfera oscura. Movimiento de cuarzo japonés.',
    price: 159900,
    category_id: 'Accesorios',
    images: [{ full: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80', thumbnail: '', isMain: true }],
    stock: 10,
    is_active: true,
    currency: 'COP',
  },
  {
    id: 'demo-7',
    name: 'Chaqueta Denim Vintage',
    description: 'Chaqueta de jean con lavado vintage. Corte relajado y detalles desgastados para un look retro premium.',
    price: 199900,
    category_id: 'Ropa',
    images: [{ full: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80', thumbnail: '', isMain: true }],
    stock: 7,
    is_active: true,
    currency: 'COP',
  },
  {
    id: 'demo-8',
    name: 'Collar Cadena Dorada',
    description: 'Collar tipo cadena en baño de oro de 18k. Diseño chunky que complementa cualquier outfit.',
    price: 79900,
    discount_price: 59900,
    category_id: 'Accesorios',
    images: [{ full: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80', thumbnail: '', isMain: true }],
    stock: 25,
    is_active: true,
    currency: 'COP',
  },
]

export default function EstiloShopPreviewPage() {
  return (
    <>
      {/* Preview Banner */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "'Sora', sans-serif",
        boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' as const }}>
            VISTA PREVIA
          </span>
          <span>Plantilla Estilo Shop — Así se verá tu tienda</span>
        </div>
        <button
          onClick={() => window.close()}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '6px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Cerrar Preview
        </button>
      </div>

      {/* Add top padding to account for preview banner */}
      <div style={{ paddingTop: 44 }}>
        <EstiloShopTemplate
          store={demoStore}
          products={demoProducts}
        />
      </div>
    </>
  )
}
