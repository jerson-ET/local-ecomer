'use client'

import MinimalTemplate, { RealProduct, RealStore } from '@/components/store-templates/MinimalTemplate'

const store: RealStore = {
  id: 'preview-store-minimal',
  name: 'Catálogo Minimal',
  slug: 'minimal',
  description: 'Diseño limpio, rápido y claro para vender productos.',
  theme_color: '#111827',
  banner_url: JSON.stringify({ templateId: 'store-minimal' }),
  whatsapp_number: '3001234567',
}

const products: RealProduct[] = [
  {
    id: 'p-1',
    name: 'Audífonos Inalámbricos Pro',
    description: 'Sonido premium y cancelación de ruido.',
    price: 159000,
    discount_price: 129000,
    category_id: 'Tecnología',
    images: [
      {
        full: 'https://images.unsplash.com/photo-1518441902117-f0a06e7f0a82?w=1000',
        thumbnail: 'https://images.unsplash.com/photo-1518441902117-f0a06e7f0a82?w=400',
        isMain: true,
      },
    ],
    stock: 20,
    is_active: true,
  },
  {
    id: 'p-2',
    name: 'Camiseta Básica Algodón',
    description: 'Tela suave, corte moderno y colores sólidos.',
    price: 49000,
    discount_price: null,
    category_id: 'Ropa',
    images: [
      {
        full: 'https://images.unsplash.com/photo-1520975958225-8d8a1c5d1b8c?w=1000',
        thumbnail: 'https://images.unsplash.com/photo-1520975958225-8d8a1c5d1b8c?w=400',
        isMain: true,
      },
    ],
    stock: 55,
    is_active: true,
  },
  {
    id: 'p-3',
    name: 'Termo Acero 1L',
    description: 'Mantiene frío y caliente por horas.',
    price: 79000,
    discount_price: 69000,
    category_id: 'Hogar',
    images: [
      {
        full: 'https://images.unsplash.com/photo-1526401485004-2aa7f3b8c60b?w=1000',
        thumbnail: 'https://images.unsplash.com/photo-1526401485004-2aa7f3b8c60b?w=400',
        isMain: true,
      },
    ],
    stock: 34,
    is_active: true,
  },
  {
    id: 'p-4',
    name: 'Zapatos Urbanos',
    description: 'Comodidad diaria y estilo minimal.',
    price: 189000,
    discount_price: null,
    category_id: 'Calzado',
    images: [
      {
        full: 'https://images.unsplash.com/photo-1528701800489-20be9c3f1d61?w=1000',
        thumbnail: 'https://images.unsplash.com/photo-1528701800489-20be9c3f1d61?w=400',
        isMain: true,
      },
    ],
    stock: 18,
    is_active: true,
  },
]

export default function MinimalStorePage() {
  return <MinimalTemplate store={store} products={products} />
}

