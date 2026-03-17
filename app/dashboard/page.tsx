'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useImageUpload, UploadedImage } from '@/lib/hooks/useImageUpload'
import { useRouter } from 'next/navigation'
import {
  Store,
  LayoutTemplate,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Check,
  Eye,
  Palette,
  ShoppingBag,
  Sparkles,
  ArrowLeft,
  Star,
  Zap,
  Crown,
  Settings,
  Package,
  BarChart3,
  Users,
  MessageSquare,
  CreditCard,
  HelpCircle,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Plus,
  Upload,
  Trash2,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Layers,
  ImagePlus,
  Grid3X3,
  Search,
  Share2,
  Heart,
  MessageCircle as MessageCircleIcon,
  Eye as EyeIcon,
  ExternalLink,
  ClipboardList,
  Loader2,
  AlertCircle,
  Wifi,
  Smartphone,
  Monitor,
} from 'lucide-react'
import OrdersDashboard from '@/components/features/dashboard/OrdersDashboard'
import AdminPanel from '@/components/features/dashboard/AdminPanel'
import MasterAdminPanel from '@/components/features/dashboard/MasterAdminPanel'
import '@/components/features/dashboard/admin-panel.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           TEMPLATE DATA                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const storeTemplates = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Diseño limpio y elegante. Perfecto para marcas premium y boutiques.',
    category: 'Premium',
    colors: ['#1a1a2e', '#16213e', '#e94560', '#0f3460'],
    features: ['Header minimalista', 'Grid de productos', 'Carrito lateral', 'Footer elegante'],
    popular: true,
    rating: 4.9,
    uses: '12.3k',
    storeUrl: '/store/minimal',
    previewImage: '/templates/minimal-preview.png',
  },
  {
    id: 'moto-racer',
    name: 'Moto Racer',
    description:
      'Diseño agresivo y oscuro con acentos neón. Perfecto para tiendas de motos y repuestos.',
    category: 'Motos',
    colors: ['#0f1012', '#e74c3c', '#bdc3c7', '#3498db'],
    features: ['Modo oscuro', 'Estilo Racing', 'Filtros técnicos', 'Galería de alto impacto'],
    popular: true,
    rating: 4.8,
    uses: '5.2k',
    storeUrl: '/store/motos',
    previewImage: '/templates/moto-racer-preview.png',
  },
  {
    id: 'sneaker-vault',
    name: 'Sneaker Vault',
    description:
      'Estilo urbano y moderno con gradientes. Ideal para tiendas de calzado y streetwear.',
    category: 'Calzado',
    colors: ['#0a0a0a', '#8e44ad', '#00d2d3', '#ffffff'],
    features: ['Drops exclusivos', 'Galería inmersiva', 'Filtros por marca', 'Diseño Hypebeast'],
    popular: true,
    rating: 4.9,
    uses: '9.1k',
    storeUrl: '/store/calzado',
    previewImage: '/templates/sneaker-vault-preview.png',
  },
  {
    id: 'wayuu-arts',
    name: 'Wayuu Arts',
    description:
      'Diseño cultural y cálido con texturas orgánicas. Perfecto para artesanías y productos hechos a mano.',
    category: 'Artesanía',
    colors: ['#c05634', '#fefcf7', '#17a589', '#f39c12'],
    features: [
      'Historia de producto',
      'Texuras de papel',
      'Estilo ancestral',
      'Foco en el artesano',
    ],
    popular: false,
    rating: 5.0,
    uses: '3.4k',
    storeUrl: '/store/wayuu',
    previewImage: '/templates/wayuu-arts-preview.png',
  },
  {
    id: 'cap-kings',
    name: 'Cap Kings',
    description:
      'Estilo urbano, bold y de alto contraste. Ideal para tiendas de gorras y accesorios de cabeza.',
    category: 'Gorras',
    colors: ['#000000', '#39ff14', '#ffffff', '#121212'],
    features: ['Personalización de parches', 'Diseño Chunky', 'Galería Swipe', 'Modo Hype'],
    popular: true,
    rating: 4.6,
    uses: '4.8k',
    storeUrl: '/store/gorras',
    previewImage: '/templates/cap-kings-preview.png',
  },
  {
    id: 'tech-store',
    name: 'Tech Store',
    description:
      'Vanguardista y minimalista. Perfecto para electrónicos, celulares y gadgets high-end.',
    category: 'Tecnología',
    colors: ['#ffffff', '#0071e3', '#f5f5f7', '#1d1d1f'],
    features: ['Comparador de specs', 'Diseño Clean', 'Badges de características', 'Estilo Apple'],
    popular: false,
    rating: 4.8,
    uses: '7.2k',
    storeUrl: '/store/celulares',
    previewImage: '/templates/tech-phone-preview.png',
  },
  {
    id: 'vibrant',
    name: 'Vibrant Market',
    description:
      'Colores vibrantes y cálidos. Ideal para tiendas de mascotas, accesorios y alimento.',
    category: 'Mascotas',
    colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'],
    features: ['Categorías con emojis', 'Banner promocional', 'Wishlist', 'Marcas destacadas'],
    popular: false,
    rating: 4.7,
    uses: '8.5k',
    storeUrl: '/store/mascotas',
    previewImage: '/templates/vibrant-pets-preview.png',
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    description: 'Estilo oscuro y sofisticado. Para productos de lujo y alta gama.',
    category: 'Lujo',
    colors: ['#0d0d0d', '#1a1a1a', '#d4af37', '#c0c0c0'],
    features: ['Galería fullscreen', 'Zoom de producto', 'Checkout express', 'VIP access'],
    popular: true,
    rating: 4.8,
    uses: '6.1k',
    storeUrl: '/store/luxury',
    previewImage: '/templates/dark-luxury-preview.png',
  },
  {
    id: 'fresh-organic',
    name: 'Fresh & Organic',
    description: 'Tonos naturales y frescos. Perfecto para tiendas de alimentos y orgánicos.',
    category: 'Alimentos',
    colors: ['#27ae60', '#2ecc71', '#f39c12', '#ecf0f1'],
    features: ['Recetas integradas', 'Nutrición info', 'Delivery tracker', 'Suscripciones'],
    popular: false,
    rating: 4.6,
    uses: '4.2k',
    storeUrl: '/store/organico',
    previewImage: '/templates/fresh-organic-preview.png',
  },
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    description: 'Futurista y moderno. Ideal para electrónica y gadgets tecnológicos.',
    category: 'Tecnología',
    colors: ['#0a0a23', '#1e90ff', '#00ff88', '#ffffff'],
    features: ['Comparador', 'Specs detalladas', '3D preview', 'Chat soporte'],
    popular: true,
    rating: 4.9,
    uses: '15.7k',
    storeUrl: '/store/celulares',
    previewImage: '/templates/tech-modern-preview.png',
  },
  {
    id: 'artisan',
    name: 'Artisan Craft',
    description: 'Calidez artesanal y rustico. Para productos hechos a mano y arte.',
    category: 'Artesanía',
    colors: ['#8B4513', '#D2691E', '#F5DEB3', '#FFF8DC'],
    features: ['Historia del artesano', 'Proceso de creación', 'Ediciones limitadas', 'Blog'],
    popular: false,
    rating: 4.5,
    uses: '3.8k',
    storeUrl: '/store/moda',
    previewImage: '/templates/artisan-craft-preview.png',
  },
  {
    id: 'gaming-zone',
    name: 'Gaming Zone',
    description:
      'Estilo cyberpunk con neón y efectos glow. Perfecto para tiendas de videojuegos y periféricos gaming.',
    category: 'Gaming',
    colors: ['#0a0a0f', '#a855f7', '#06b6d4', '#ec4899'],
    features: ['Modo oscuro neón', 'Stats en tiempo real', 'Barra de stats', 'Diseño Cyberpunk'],
    popular: true,
    rating: 4.8,
    uses: '6.7k',
    storeUrl: '/store/gaming',
    previewImage: '/templates/gaming-zone-preview.png',
  },
  {
    id: 'beauty-glow',
    name: 'Beauty Glow',
    description:
      'Elegante y femenino con tonos rosados y dorados. Ideal para cosméticos, skincare y fragancias.',
    category: 'Belleza',
    colors: ['#f472b6', '#d4a574', '#fdf2f8', '#1f1f2e'],
    features: ['Diseño Premium', 'Ratings visuales', 'Beauty Tips', 'Estilo Luxury'],
    popular: true,
    rating: 4.9,
    uses: '8.3k',
    storeUrl: '/store/belleza',
    previewImage: '/templates/beauty-glow-preview.png',
  },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        SIDEBAR MENU ITEMS                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubMenuItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  subItems?: SubMenuItem[]
}

const masterMenuItems: MenuItem[] = [
  {
    id: 'panel',
    label: 'Panel Maestro',
    icon: <Crown size={20} />,
  },
  {
    id: 'global-stores',
    label: 'Tiendas Global',
    icon: <Store size={20} />,
  },
  {
    id: 'global-users',
    label: 'Usuarios',
    icon: <Users size={20} />,
  },
]

const menuItems: MenuItem[] = [
  {
    id: 'panel',
    label: 'Panel',
    icon: <BarChart3 size={20} />,
  },
  {
    id: 'admin-store',
    label: 'Administrar Tienda',
    icon: <Store size={20} />,
    subItems: [
      { id: 'create-store', label: 'Crear Tienda', icon: <Sparkles size={16} /> },
      { id: 'store-settings', label: 'Plantilla', icon: <Settings size={16} /> },
      { id: 'store-checkout', label: 'Caja de Cobro (IA)', icon: <DollarSign size={16} /> },
    ],
  },
  {
    id: 'products',
    label: 'Productos',
    icon: <Package size={20} />,
    subItems: [
      { id: 'all-products', label: 'Todos los Productos', icon: <ShoppingBag size={16} /> },
      { id: 'add-product', label: 'Subir Producto', icon: <Plus size={16} /> },
      { id: 'community-analytics', label: 'Comunidad', icon: <Share2 size={16} /> },
    ],
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: <ClipboardList size={20} />,
    subItems: [
      { id: 'all-orders', label: 'Todos los Pedidos', icon: <ShoppingBag size={16} /> },
      { id: 'returns', label: 'Devoluciones', icon: <RefreshCw size={16} /> },
    ],
  },
  {
    id: 'catalog',
    label: 'Mi Catálogo',
    icon: <MessageCircleIcon size={20} />,
    subItems: [
      { id: 'whatsapp-catalog', label: 'Estados Automáticos', icon: <Share2 size={16} /> },
      { id: 'whatsapp-web', label: 'WhatsApp Web', icon: <MessageSquare size={16} /> },
    ],
  },
  {
    id: 'analytics',
    label: 'Analíticas',
    icon: <BarChart3 size={20} />,
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: <Users size={20} />,
  },
  {
    id: 'messages',
    label: 'Mensajes',
    icon: <MessageSquare size={20} />,
  },
  {
    id: 'payments',
    label: 'Pagos',
    icon: <CreditCard size={20} />,
  },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        TEMPLATE CARD COMPONENT                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TemplateCard({
  template,
  isSelected,
  onSelect,
  onPreview,
}: {
  template: (typeof storeTemplates)[0]
  isSelected: boolean
  onSelect: () => void
  onPreview: () => void
}) {
  const router = useRouter()

  return (
    <div
      className={`template-card ${isSelected ? 'template-card--selected' : ''}`}
      onClick={onSelect}
    >
      {/* Template Preview */}
      <div className="template-preview">
        <div className="template-preview-inner">
          {/* Mini browser mockup */}
          <div className="template-browser-bar">
            <span className="browser-dot" />
            <span className="browser-dot" />
            <span className="browser-dot" />
          </div>
          <div className="template-layout">
            {template.previewImage ? (
              <img
                src={template.previewImage}
                alt={`${template.name} preview`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  minHeight: '140px',
                  display: 'block',
                }}
              />
            ) : (
              <>
                <div className="template-header-mock" style={{ background: template.colors[0] }} />
                <div className="template-body-mock">
                  <div className="template-accent-bar" style={{ background: template.colors[2] }} />
                  <div className="template-grid-mock">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="template-grid-item"
                        style={{
                          background: template.colors[i % template.colors.length],
                          opacity: 0.6 + i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overlay badges */}
        {template.popular && (
          <div className="template-popular-badge">
            <Zap size={12} />
            Popular
          </div>
        )}

        {template.storeUrl ? (
          <button
            className="template-preview-btn"
            onClick={(e) => {
              e.stopPropagation()
              router.push(template.storeUrl!)
            }}
          >
            <Eye size={14} />
            Ver Tienda
          </button>
        ) : (
          <button
            className="template-preview-btn"
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
          >
            <Eye size={14} />
            Vista previa
          </button>
        )}
      </div>

      {/* Template Info */}
      <div className="template-info">
        <div className="template-info-top">
          <h3 className="template-name">{template.name}</h3>
          <span className="template-category">{template.category}</span>
        </div>
        <p className="template-description">{template.description}</p>

        {/* Color palette */}
        <div className="template-colors">
          {template.colors.map((color, i) => (
            <span key={i} className="template-color-dot" style={{ background: color }} />
          ))}
        </div>

        {/* Rating & Uses */}
        <div className="template-meta">
          <div className="template-rating">
            <Star size={12} fill="#f97316" stroke="#f97316" />
            <span>{template.rating}</span>
          </div>
          <span className="template-uses">{template.uses} tiendas</span>
        </div>

        {/* Features */}
        <div className="template-features">
          {template.features.slice(0, 3).map((feature, i) => (
            <span key={i} className="template-feature-tag">
              {feature}
            </span>
          ))}
          {template.features.length > 3 && (
            <span className="template-feature-more">+{template.features.length - 3}</span>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="template-selected-indicator">
          <Check size={16} />
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        TEMPLATE PREVIEW MODAL                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TemplatePreviewModal({
  template,
  onClose,
  onSelect,
}: {
  template: (typeof storeTemplates)[0]
  onClose: () => void
  onSelect: () => void
}) {
  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="preview-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="preview-modal-content">
          {/* Large preview */}
          <div className="preview-large">
            <div className="preview-browser">
              <div className="preview-browser-bar">
                <span className="browser-dot" />
                <span className="browser-dot" />
                <span className="browser-dot" />
                <span className="preview-url">localecomer.vercel.app/tu-tienda</span>
              </div>
              <div className="preview-layout-large">
                <div className="preview-header-l" style={{ background: template.colors[0] }}>
                  <span style={{ color: template.colors[2] }}>● {template.name}</span>
                </div>
                <div
                  className="preview-hero-l"
                  style={{
                    background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`,
                  }}
                >
                  <div className="preview-hero-text">
                    <div
                      className="preview-hero-badge"
                      style={{ background: template.colors[2] }}
                    />
                    <div className="preview-hero-title" />
                    <div className="preview-hero-subtitle" />
                  </div>
                </div>
                <div className="preview-products-l">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="preview-product-item">
                      <div
                        className="preview-product-img"
                        style={{
                          background: template.colors[i % template.colors.length],
                          opacity: 0.4,
                        }}
                      />
                      <div className="preview-product-lines">
                        <div className="preview-line" />
                        <div
                          className="preview-line-short"
                          style={{ background: template.colors[2] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="preview-info-panel">
            <div className="preview-info-header">
              <h2>{template.name}</h2>
              <span className="template-category">{template.category}</span>
            </div>
            <p className="preview-description">{template.description}</p>

            <div className="preview-palette">
              <h4>Paleta de colores</h4>
              <div className="preview-colors-row">
                {template.colors.map((color, i) => (
                  <div key={i} className="preview-color-item">
                    <span className="preview-color-swatch" style={{ background: color }} />
                    <span className="preview-color-code">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="preview-features-list">
              <h4>Características incluidas</h4>
              {template.features.map((feature, i) => (
                <div key={i} className="preview-feature-item">
                  <Check size={14} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="preview-stats-row">
              <div className="preview-stat">
                <Star size={16} fill="#f97316" stroke="#f97316" />
                <span>{template.rating} rating</span>
              </div>
              <div className="preview-stat">
                <Users size={16} />
                <span>{template.uses} tiendas</span>
              </div>
            </div>

            <button className="preview-select-btn" onClick={onSelect}>
              <Palette size={18} />
              Usar esta plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        CREATE STORE FLOW                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CreateStoreSection({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [storeWhatsapp, setStoreWhatsapp] = useState('')
  const [storeLocation, setStoreLocation] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<(typeof storeTemplates)[0] | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  const categories = [
    'all',
    'Premium',
    'Mascotas',
    'Motos',
    'Calzado',
    'Artesanía',
    'Gorras',
    'Lujo',
    'Alimentos',
    'Tecnología',
    'Gaming',
    'Belleza',
  ]

  const filteredTemplates =
    filterCategory === 'all'
      ? storeTemplates
      : storeTemplates.filter((t) => t.category === filterCategory)

  const handleStoreNameChange = (value: string) => {
    setStoreName(value)
    setStoreSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    )
  }

  const handleContinueToTemplates = () => {
    if (storeName.trim().length >= 3 && storeLocation.trim().length >= 3) {
      setStep(2)
    }
  }

  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      setStep(3)
    }
  }

  const handleCreateStore = async () => {
    const tmpl = storeTemplates.find((t) => t.id === selectedTemplate)
    if (!tmpl) return

    setIsCreating(true)
    setCreateError(null)

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          slug: storeSlug,
          templateId: tmpl.id,
          templateUrl: tmpl.storeUrl,
          themeColor: tmpl.colors[2] || '#6366f1',
          description: tmpl.description,
          whatsappNumber: storeWhatsapp,
          location: storeLocation,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCreateError(data.error || 'Error al crear la tienda')
        setIsCreating(false)
        return
      }

      setCreateSuccess(true)
      setTimeout(() => {
        router.push(`/tienda/${storeSlug}`)
      }, 1800)
    } catch {
      setCreateError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      setIsCreating(false)
    }
  }

  return (
    <div className="create-store-section premium-flow">
      {/* Minimalist Top Nav */}
      <div className="premium-breadcrumb">
        <button className="premium-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        <div className="premium-step-indicator">
          <span className={`step-dot ${step >= 1 ? 'active' : ''}`} />
          <span className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <span className={`step-dot ${step >= 2 ? 'active' : ''}`} />
          <span className={`step-line ${step >= 3 ? 'active' : ''}`} />
          <span className={`step-dot ${step >= 3 ? 'active' : ''}`} />
        </div>
        <div className="premium-step-text">Paso {step} de 3</div>
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <div className="premium-step-container step-anim-enter">
          <div className="premium-hero-header">
            <div className="glow-icon">
              <Sparkles size={40} />
            </div>
            <h1 className="hero-title">Crea tu imperio</h1>
            <p className="hero-subtitle">Dale un nombre único y memorable a tu tienda digital.</p>
          </div>

          <div className="premium-form-card">
            <div className="premium-input-group">
              <label>Nombre de tu Tienda</label>
              <input
                type="text"
                className="premium-input massive-input"
                placeholder="Escribe el nombre..."
                value={storeName}
                onChange={(e) => handleStoreNameChange(e.target.value)}
                maxLength={40}
                autoFocus
              />
            </div>

            {storeSlug && (
              <div className="premium-url-showcase anim-fade-in">
                <div className="url-badge">Tu enlace único</div>
                <div className="url-string">
                  localecomer.vercel.app/tienda/<span className="glow-text">{storeSlug}</span>
                </div>
              </div>
            )}

            <div className="premium-input-group mt-spacing" style={{ marginTop: '24px' }}>
              <label>Ubicación de la tienda (Ciudad / Sector)</label>
              <input
                type="text"
                className="premium-input"
                placeholder="Ej: Medellín, Bogotá, etc."
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                maxLength={40}
              />
            </div>

            <div className="premium-input-group mt-spacing" style={{ marginTop: '24px' }}>
              <label>WhatsApp de la Tienda (Opcional)</label>
              <div className="input-with-icon">
                <MessageCircleIcon size={20} className="input-icon" />
                <input
                  type="tel"
                  className="premium-input"
                  placeholder="Ej: 300 000 0000"
                  value={storeWhatsapp}
                  onChange={(e) => setStoreWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={15}
                />
              </div>
            </div>

            <button
              className={`premium-btn-main ${storeName.length < 3 || storeLocation.length < 3 ? 'disabled' : ''}`}
              onClick={handleContinueToTemplates}
              disabled={storeName.length < 3 || storeLocation.length < 3}
            >
              Explorar Plantillas <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Templates */}
      {step === 2 && (
        <div className="premium-step-container step-template-anim">
          <div className="premium-hero-header compact">
            <h1 className="hero-title">Elige tu estética</h1>
            <p className="hero-subtitle">Muestra tu marca al mundo con un visual impecable.</p>
          </div>

          <div className="premium-filters-scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`premium-filter-pill ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat === 'all' ? 'Todas las estéticas' : cat}
              </button>
            ))}
          </div>

          <div className="premium-templates-grid">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`premium-template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="pt-image-wrapper">
                  {template.previewImage ? (
                    <img src={template.previewImage} alt={template.name} className="pt-img" />
                  ) : (
                    <div
                      className="pt-mock"
                      style={{
                        background: `linear-gradient(45deg, ${template.colors[0]}, ${template.colors[1]})`,
                      }}
                    />
                  )}
                  <button
                    className="pt-preview-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewTemplate(template)
                    }}
                  >
                    <EyeIcon size={16} /> Vista Previa
                  </button>
                </div>
                <div className="pt-content">
                  <div className="pt-meta">
                    <h3>{template.name}</h3>
                    <span className="pt-category">{template.category}</span>
                  </div>
                  <p>{template.description}</p>
                  <div className="pt-colors">
                    {template.colors.map((c, i) => (
                      <span key={i} className="pt-color-dot" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                {selectedTemplate === template.id && <div className="pt-selected-glow" />}
              </div>
            ))}
          </div>

          <div className="premium-sticky-bottom">
            <div className="psb-content">
              <span>
                {selectedTemplate
                  ? `Seleccionaste: ${storeTemplates.find((t) => t.id === selectedTemplate)?.name}`
                  : 'Selecciona una plantilla para continuar'}
              </span>
              <button
                className={`premium-btn-main ${!selectedTemplate ? 'disabled' : ''}`}
                onClick={handleConfirmTemplate}
                disabled={!selectedTemplate}
              >
                Continuar <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="premium-step-container step-anim-enter">
          <div className="premium-confirm-card">
            {createSuccess ? (
              <div className="success-state">
                <div className="success-icon-ring">
                  <CheckCircle2 size={64} className="success-check" />
                </div>
                <h2>Magia realizada</h2>
                <p>Tu tienda digital está viva. Preparando las llaves...</p>
              </div>
            ) : (
              <div className="review-state">
                <div className="review-hero">
                  <img
                    src={storeTemplates.find((t) => t.id === selectedTemplate)?.previewImage || ''}
                    alt="Preview"
                    className="review-img"
                  />
                  <div className="review-overlay">
                    <div className="review-badge">Listo para lanzar</div>
                    <h2>{storeName}</h2>
                    <a
                      href={`https://localecomer.vercel.app/tienda/${storeSlug}`}
                      className="review-link"
                      target="_blank"
                      rel="noreferrer"
                    >
                      localecomer.vercel.app/tienda/{storeSlug} <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {createError && (
                  <div className="premium-error-banner">
                    <AlertCircle size={18} />
                    {createError}
                  </div>
                )}

                <div className="review-actions">
                  <button
                    className="premium-btn-ghost"
                    onClick={() => setStep(2)}
                    disabled={isCreating}
                  >
                    Cambiar Diseño
                  </button>
                  <button
                    className="premium-btn-large-glow"
                    onClick={handleCreateStore}
                    disabled={isCreating}
                  >
                    {isCreating ? <Loader2 size={24} className="anim-spin" /> : 'Lanzar mi Tienda'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Previsualización */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            setSelectedTemplate(previewTemplate.id)
            setPreviewTemplate(null)
          }}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        CHANGE TEMPLATE SECTION (CONFIGURACIÓN)             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ChangeTemplateSection({
  onBack,
  storeId,
  initialTemplate,
}: {
  onBack: () => void
  storeId: string
  initialTemplate: string
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<(typeof storeTemplates)[0] | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [changeSuccess, setChangeSuccess] = useState(false)

  // Plantilla actual desde DB
  const [currentTemplate, setCurrentTemplate] = useState(initialTemplate)

  const categories = [
    'all',
    'Premium',
    'Mascotas',
    'Motos',
    'Calzado',
    'Artesanía',
    'Gorras',
    'Lujo',
    'Alimentos',
    'Tecnología',
    'Gaming',
    'Belleza',
  ]

  const filteredTemplates =
    filterCategory === 'all'
      ? storeTemplates
      : storeTemplates.filter((t) => t.category === filterCategory)

  const currentTemplateData = storeTemplates.find((t) => t.id === currentTemplate)
  const selectedTemplateData = storeTemplates.find((t) => t.id === selectedTemplate)

  const handleSelectTemplate = (templateId: string) => {
    if (templateId !== currentTemplate) {
      setSelectedTemplate(templateId)
    }
  }

  const handleConfirmChange = async () => {
    if (!selectedTemplate) return
    setIsChanging(true)

    try {
      const res = await fetch('/api/stores/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, templateId: selectedTemplate }),
      })

      if (res.ok) {
        setCurrentTemplate(selectedTemplate)
        setShowConfirm(false)
        setChangeSuccess(true)
        setSelectedTemplate(null)

        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setChangeSuccess(false)
        }, 3000)
      } else {
        alert('Hubo un error al actualizar la plantilla. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Error changing template:', error)
      alert('Error de conexión o de servidor.')
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="change-template-section">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <span className="breadcrumb-item">Administrar Tienda</span>
        <ChevronRight size={14} />
        <span className="breadcrumb-item active">Configuración</span>
        <ChevronRight size={14} />
        <span className="breadcrumb-item active">Cambiar Plantilla</span>
      </div>

      {/* Success Message */}
      {changeSuccess && (
        <div className="change-success-toast">
          <CheckCircle2 size={20} />
          <span>¡Plantilla cambiada exitosamente!</span>
        </div>
      )}

      {/* Current Template Info */}
      <div className="current-template-card">
        <div className="current-template-header">
          <div className="current-template-icon">
            <LayoutTemplate size={24} />
          </div>
          <div className="current-template-info">
            <span className="current-label">Plantilla actual</span>
            <h3>{currentTemplateData?.name || 'Sin plantilla'}</h3>
            <p>{currentTemplateData?.description || ''}</p>
          </div>
        </div>
        {currentTemplateData && (
          <div className="current-template-colors">
            {currentTemplateData.colors.map((color, i) => (
              <span key={i} className="template-color-dot" style={{ background: color }} />
            ))}
          </div>
        )}
      </div>

      {/* Section Header */}
      <div className="change-template-header">
        <div className="change-template-title-row">
          <RefreshCw size={22} />
          <h2>Cambiar Plantilla</h2>
        </div>
        <p>Selecciona una nueva plantilla para tu tienda. El cambio se aplicará automáticamente.</p>
      </div>

      {/* Category Filter */}
      <div className="template-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="templates-grid">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="change-template-wrapper">
            {template.id === currentTemplate && (
              <div className="current-badge">
                <Check size={12} />
                Actual
              </div>
            )}
            <TemplateCard
              template={template}
              isSelected={selectedTemplate === template.id}
              onSelect={() => handleSelectTemplate(template.id)}
              onPreview={() => setPreviewTemplate(template)}
            />
          </div>
        ))}
      </div>

      {/* Action Button */}
      {selectedTemplate && selectedTemplate !== currentTemplate && (
        <div className="change-template-actions">
          <div className="change-summary">
            <span className="change-from">{currentTemplateData?.name}</span>
            <ChevronRight size={16} />
            <span className="change-to">{selectedTemplateData?.name}</span>
          </div>
          <div className="change-buttons">
            <button className="btn-secondary" onClick={() => setSelectedTemplate(null)}>
              Cancelar
            </button>
            <button className="btn-primary btn-change" onClick={() => setShowConfirm(true)}>
              <RefreshCw size={16} />
              Cambiar plantilla
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && selectedTemplateData && (
        <div className="confirm-modal-overlay" onClick={() => !isChanging && setShowConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <RefreshCw size={32} className={isChanging ? 'spinning' : ''} />
            </div>
            <h3>¿Cambiar plantilla?</h3>
            <p>
              Tu tienda cambiará de <strong>{currentTemplateData?.name}</strong> a{' '}
              <strong>{selectedTemplateData.name}</strong>.
            </p>
            <div className="confirm-modal-preview">
              <div className="confirm-from">
                <div className="confirm-template-mini">
                  {currentTemplateData?.colors.map((c, i) => (
                    <span key={i} style={{ background: c }} />
                  ))}
                </div>
                <span>{currentTemplateData?.name}</span>
              </div>
              <ChevronRight size={20} />
              <div className="confirm-to">
                <div className="confirm-template-mini">
                  {selectedTemplateData.colors.map((c, i) => (
                    <span key={i} style={{ background: c }} />
                  ))}
                </div>
                <span>{selectedTemplateData.name}</span>
              </div>
            </div>
            <div className="confirm-modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={isChanging}
              >
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleConfirmChange} disabled={isChanging}>
                {isChanging ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirmar cambio
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            handleSelectTemplate(previewTemplate.id)
            setPreviewTemplate(null)
          }}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        PRODUCT TYPES                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ProductVariant {
  id: string
  color: string
  colorHex: string
  size: string
  type: string // 'niño' | 'niña' | 'adulto' | 'unisex'
  images: string[] /* URLs locales (base64) para preview */
  uploadedImages: UploadedImage[] /* URLs de R2 después de subir */
  stock: number
  priceModifier: number // 0 = same price, positive = extra cost
}

interface DashboardProduct {
  id: string
  name: string
  description: string
  price: number
  discountPrice: number | null
  mainImage: string
  category: string
  variants: ProductVariant[]
  isActive: boolean
  createdAt: string
}

// Demo products for the list view removed

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        PRODUCT UPLOAD SECTION                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ProductUploadSection({
  onBack,
  onGoToProducts,
  storeId,
}: {
  onBack: () => void
  onGoToProducts: () => void
  storeId: string | null
}) {
  // Form state
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDiscountPrice, setProductDiscountPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productTags, setProductTags] = useState('')
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [, setMainImageUploaded] = useState<UploadedImage | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  // Variant form state
  const [variantColor, setVariantColor] = useState('')
  const [variantColorHex, setVariantColorHex] = useState('#000000')
  const [variantSize, setVariantSize] = useState('')
  const [variantType, setVariantType] = useState('adulto')
  const [variantImages, setVariantImages] = useState<string[]>([])
  const [, setVariantImageFiles] = useState<File[]>([])
  const [variantStock, setVariantStock] = useState('1')
  const [variantPriceMod, setVariantPriceMod] = useState('0')

  // Detail view state
  const [previewProduct, setPreviewProduct] = useState(false)

  // Hook de subida de imágenes
  const {
    uploadImages,
    uploadSingleImage,
    uploading,
    progress,
    error: uploadError,
  } = useImageUpload({
    maxFiles: 10,
    onError: (err) => setPublishError(err),
  })

  const mainImageRef = useRef<HTMLInputElement>(null)
  const variantImageRef = useRef<HTMLInputElement>(null)

  const categories = [
    'Calzado',
    'Ropa',
    'Accesorios',
    'Electrónica',
    'Hogar',
    'Mascotas',
    'Artesanía',
    'Gorras',
    'Alimentos',
    'Belleza',
    'Deportes',
    'Otro',
  ]
  const sizeOptions = [
    'XS',
    'S',
    'M',
    'L',
    'XL',
    'XXL',
    '28',
    '30',
    '32',
    '34',
    '36',
    '38',
    '40',
    '42',
    '44',
    'Única',
  ]
  const typeOptions = [
    { value: 'adulto', label: '👤 Adulto' },
    { value: 'niño', label: '👦 Niño' },
    { value: 'niña', label: '👧 Niña' },
    { value: 'unisex', label: '⚡ Unisex' },
  ]

  /* ─── Manejar imagen principal (preview local + guardar File) ─── */
  const handleMainImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMainImageFile(file)
      setMainImageUploaded(null) /* Reset uploaded state */
      const reader = new FileReader()
      reader.onload = () => setMainImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }, [])

  /* ─── Manejar imágenes de variante (preview + guardar Files) ─── */
  const handleVariantImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileArray = Array.from(files)
      setVariantImageFiles((prev) => [...prev, ...fileArray])
      fileArray.forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          setVariantImages((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }, [])

  const removeVariantImage = (index: number) => {
    setVariantImages((prev) => prev.filter((_, i) => i !== index))
    setVariantImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const addVariant = () => {
    if (!variantColor || !variantSize || variantImages.length === 0) return

    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      color: variantColor,
      colorHex: variantColorHex,
      size: variantSize,
      type: variantType,
      images: variantImages,
      uploadedImages: [] /* Se llenarán al publicar */,
      stock: parseInt(variantStock) || 1,
      priceModifier: parseInt(variantPriceMod) || 0,
    }

    setVariants((prev) => [...prev, newVariant])
    // Reset variant form
    setVariantColor('')
    setVariantColorHex('#000000')
    setVariantSize('')
    setVariantType('adulto')
    setVariantImages([])
    setVariantImageFiles([])
    setVariantStock('1')
    setVariantPriceMod('0')
    setShowAddVariant(false)
  }

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id))
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  PUBLICAR PRODUCTO — Pipeline completo:                                */
  /*  1. Subir imagen principal → Sharp → WebP → R2                         */
  /*  2. Subir imágenes de variantes → Sharp → WebP → R2                    */
  /*  3. Crear producto en Supabase vía /api/products                        */
  /* ═══════════════════════════════════════════════════════════════════════ */
  const handlePublish = async () => {
    if (!productName || !productPrice || !mainImageFile) return

    setIsPublishing(true)
    setPublishError(null)

    try {
      /* ─── Paso 1: Subir imagen principal ─── */
      const mainResult = await uploadSingleImage(mainImageFile, 'products')
      if (!mainResult) {
        setPublishError('Error al subir la imagen principal')
        setIsPublishing(false)
        return
      }
      setMainImageUploaded(mainResult)

      /* ─── Paso 2: Subir imágenes de variantes ─── */
      const variantsWithUploads = []

      for (const variant of variants) {
        /* Usar las imágenes base64 para convertir a File objects      */
        const variantFiles: File[] = []
        for (const base64Img of variant.images) {
          const response = await fetch(base64Img)
          const blob = await response.blob()
          variantFiles.push(
            new File([blob], `variant-${variant.id}-${Date.now()}.jpg`, {
              type: blob.type || 'image/jpeg',
            })
          )
        }

        let uploadedVariantImages: UploadedImage[] = []
        if (variantFiles.length > 0) {
          uploadedVariantImages = await uploadImages(variantFiles, 'products')
        }

        variantsWithUploads.push({
          color: variant.color,
          colorHex: variant.colorHex,
          size: variant.size,
          type: variant.type,
          images: uploadedVariantImages.map((img) => ({
            fullUrl: img.fullUrl,
            thumbnailUrl: img.thumbnailUrl,
          })),
          stock: variant.stock,
          priceModifier: variant.priceModifier,
        })
      }

      /* ─── Paso 3: Crear producto en Supabase ─── */
      const productData = {
        storeId: storeId /* ID real de la tienda cargado del dashboard */,
        name: productName,
        description: productDescription,
        price: parseInt(productPrice),
        discountPrice: productDiscountPrice ? parseInt(productDiscountPrice) : null,
        category: productCategory,
        productTags: productTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        mainImage: {
          fullUrl: mainResult.fullUrl,
          thumbnailUrl: mainResult.thumbnailUrl,
        },
        variants: variantsWithUploads,
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      const result = await response.json()

      if (!response.ok) {
        /* Si el error es de auth/tienda, mostrar mensaje amigable    */
        setPublishError(result.error || 'Error al publicar el producto')
        setIsPublishing(false)
        return
      }

      /* ─── Éxito ─── */
      setShowSuccess(true)
      setIsPublishing(false)
      setTimeout(() => {
        setShowSuccess(false)
        onGoToProducts()
      }, 2500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setPublishError(msg)
      setIsPublishing(false)
    }
  }

  const totalImages = variants.reduce((acc, v) => acc + v.images.length, 0) + (mainImage ? 1 : 0)
  const totalStock = variants.reduce((acc, v) => acc + v.stock, 0)

  // Preview modal
  if (previewProduct) {
    return (
      <div className="product-preview-view">
        <div className="breadcrumb">
          <button className="breadcrumb-back" onClick={() => setPreviewProduct(false)}>
            <ArrowLeft size={18} />
          </button>
          <span className="breadcrumb-item">Subir Producto</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-item active">Vista Previa</span>
        </div>

        <div className="product-detail-layout">
          {/* Main Image */}
          <div className="product-detail-gallery">
            <div className="product-detail-main-img">
              {mainImage && <img src={mainImage} alt={productName} />}
            </div>
            {variants.length > 0 && (
              <div className="product-detail-thumbnails">
                <div className="thumb-item active">
                  {mainImage && <img src={mainImage} alt="Principal" />}
                  <span className="thumb-label">Principal</span>
                </div>
                {variants.map((v) =>
                  v.images.map((img, i) => (
                    <div key={`${v.id}-${i}`} className="thumb-item">
                      <img src={img} alt={`${v.color} ${v.size}`} />
                      <span className="thumb-label">
                        {v.color} - {v.size}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-detail-info">
            <span className="product-detail-category">{productCategory || 'Sin categoría'}</span>
            <h2>{productName || 'Nombre del producto'}</h2>
            <p className="product-detail-desc">{productDescription || 'Sin descripción'}</p>

            <div className="product-detail-pricing">
              {productDiscountPrice && (
                <span className="product-detail-original-price">
                  ${parseInt(productPrice || '0').toLocaleString()}
                </span>
              )}
              <span className="product-detail-price">
                ${parseInt(productDiscountPrice || productPrice || '0').toLocaleString()}
              </span>
            </div>

            {variants.length > 0 && (
              <>
                <h4 className="product-detail-section-title">
                  <Layers size={16} />
                  Variantes disponibles ({variants.length})
                </h4>
                <div className="product-detail-variants">
                  {variants.map((v) => (
                    <div key={v.id} className="product-detail-variant-card">
                      <div className="variant-card-header">
                        <span className="variant-color-dot-lg" style={{ background: v.colorHex }} />
                        <div>
                          <strong>{v.color}</strong>
                          <span className="variant-meta">
                            Talla {v.size} · {v.type}
                          </span>
                        </div>
                      </div>
                      <div className="variant-card-images">
                        {v.images.map((img, i) => (
                          <img key={i} src={img} alt={`${v.color} ${i}`} />
                        ))}
                      </div>
                      <div className="variant-card-footer">
                        <span>Stock: {v.stock}</span>
                        {v.priceModifier !== 0 && (
                          <span className={v.priceModifier > 0 ? 'price-up' : 'price-down'}>
                            {v.priceModifier > 0 ? '+' : ''}
                            {v.priceModifier.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="product-detail-stats-row">
              <div className="stat-box">
                <ImageIcon size={18} />
                <span>{totalImages} imágenes</span>
              </div>
              <div className="stat-box">
                <Layers size={18} />
                <span>{variants.length} variantes</span>
              </div>
              <div className="stat-box">
                <Package size={18} />
                <span>{totalStock} en stock</span>
              </div>
            </div>

            <button className="btn-publish" onClick={handlePublish}>
              <CheckCircle2 size={18} />
              Publicar Producto
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-upload-section">
      {/* Success Toast */}
      {showSuccess && (
        <div className="product-success-toast">
          <CheckCircle2 size={20} />
          <span>¡Producto publicado exitosamente!</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <span className="breadcrumb-item">Productos</span>
        <ChevronRight size={14} />
        <span className="breadcrumb-item active">Subir Producto</span>
      </div>

      {/* Upload Form */}
      <div className="product-upload-grid">
        {/* Left Column - Images */}
        <div className="product-upload-images">
          <h3>
            <ImageIcon size={18} />
            Imagen Principal
          </h3>
          <p className="upload-hint">Esta será la imagen que verán los clientes primero</p>

          <div
            className={`main-image-upload ${mainImage ? 'has-image' : ''}`}
            onClick={() => mainImageRef.current?.click()}
          >
            {mainImage ? (
              <div className="main-image-preview">
                <img src={mainImage} alt="Principal" />
                <button
                  className="remove-main-image"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMainImage(null)
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <ImagePlus size={48} />
                <span>Toca para subir imagen</span>
                <span className="upload-subtitle">JPG, PNG o WebP · Max 5MB</span>
              </div>
            )}
          </div>
          <input
            ref={mainImageRef}
            type="file"
            accept="image/*"
            onChange={handleMainImageChange}
            style={{ display: 'none' }}
          />

          {/* Variants Section */}
          <div className="variants-section">
            <div className="variants-header">
              <h3>
                <Layers size={18} />
                Variantes del Producto
              </h3>
              <span className="variants-count">{variants.length}</span>
            </div>
            <p className="upload-hint">Agrega colores, tallas y más imágenes de tu producto</p>

            {/* Existing Variants */}
            {variants.map((variant) => (
              <div key={variant.id} className="variant-item">
                <div className="variant-item-header">
                  <span className="variant-color-dot" style={{ background: variant.colorHex }} />
                  <div className="variant-item-info">
                    <strong>{variant.color}</strong>
                    <span>
                      Talla {variant.size} · {variant.type} · Stock: {variant.stock}
                    </span>
                  </div>
                  <span className="variant-image-count">
                    <ImageIcon size={12} /> {variant.images.length}
                  </span>
                  <button className="variant-remove-btn" onClick={() => removeVariant(variant.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="variant-item-images">
                  {variant.images.map((img, i) => (
                    <img key={i} src={img} alt={`${variant.color} ${i}`} />
                  ))}
                </div>
              </div>
            ))}

            {/* Add Variant Form */}
            {showAddVariant ? (
              <div className="add-variant-form">
                <div className="add-variant-form-header">
                  <h4>Nueva Variante</h4>
                  <button onClick={() => setShowAddVariant(false)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="variant-form-grid">
                  <div className="variant-field">
                    <label>Color</label>
                    <div className="color-input-row">
                      <input
                        type="color"
                        value={variantColorHex}
                        onChange={(e) => setVariantColorHex(e.target.value)}
                        className="color-picker"
                      />
                      <input
                        type="text"
                        placeholder="Ej: Negro, Rojo..."
                        value={variantColor}
                        onChange={(e) => setVariantColor(e.target.value)}
                        className="variant-input"
                      />
                    </div>
                  </div>

                  <div className="variant-field">
                    <label>Talla</label>
                    <select
                      value={variantSize}
                      onChange={(e) => setVariantSize(e.target.value)}
                      className="variant-select"
                    >
                      <option value="">Seleccionar...</option>
                      {sizeOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="variant-field">
                    <label>Tipo</label>
                    <div className="type-options">
                      {typeOptions.map((t) => (
                        <button
                          key={t.value}
                          className={`type-option ${variantType === t.value ? 'active' : ''}`}
                          onClick={() => setVariantType(t.value)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="variant-field">
                    <label>Stock disponible</label>
                    <input
                      type="number"
                      min="0"
                      value={variantStock}
                      onChange={(e) => setVariantStock(e.target.value)}
                      className="variant-input"
                    />
                  </div>

                  <div className="variant-field">
                    <label>Modificador de precio</label>
                    <div className="price-mod-input">
                      <span className="price-mod-prefix">$</span>
                      <input
                        type="number"
                        value={variantPriceMod}
                        onChange={(e) => setVariantPriceMod(e.target.value)}
                        className="variant-input"
                        placeholder="0 = mismo precio"
                      />
                    </div>
                    <span className="field-hint">
                      Usa negativo para precio menor, positivo para mayor
                    </span>
                  </div>
                </div>

                {/* Variant Images */}
                <div className="variant-images-upload">
                  <label>Imágenes de esta variante</label>
                  <div className="variant-images-grid">
                    {variantImages.map((img, i) => (
                      <div key={i} className="variant-img-thumb">
                        <img src={img} alt={`Variante ${i}`} />
                        <button onClick={() => removeVariantImage(i)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="add-variant-img-btn"
                      onClick={() => variantImageRef.current?.click()}
                    >
                      <Plus size={24} />
                      <span>Agregar</span>
                    </button>
                  </div>
                  <input
                    ref={variantImageRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleVariantImagesChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="variant-form-actions">
                  <button className="btn-cancel-variant" onClick={() => setShowAddVariant(false)}>
                    Cancelar
                  </button>
                  <button
                    className="btn-add-variant"
                    onClick={addVariant}
                    disabled={!variantColor || !variantSize || variantImages.length === 0}
                  >
                    <Check size={16} />
                    Agregar Variante
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn-new-variant" onClick={() => setShowAddVariant(true)}>
                <Plus size={18} />
                Agregar Variante
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="product-upload-details">
          <h3>
            <Tag size={18} />
            Información del Producto
          </h3>

          <div className="product-form">
            <div className="form-field">
              <label>Nombre del producto *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej: Zapatillas Adidas Ultraboost"
                className="product-input"
                maxLength={80}
              />
              <span className="char-count">{productName.length}/80</span>
            </div>

            <div className="form-field">
              <label>Descripción</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe tu producto con detalle..."
                className="product-textarea"
                rows={4}
                maxLength={500}
              />
              <span className="char-count">{productDescription.length}/500</span>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>
                  <DollarSign size={14} />
                  Precio *
                </label>
                <div className="price-input-wrapper">
                  <span className="price-prefix">$</span>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="0"
                    className="product-input price-input"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>
                  <Tag size={14} />
                  Precio con descuento
                </label>
                <div className="price-input-wrapper">
                  <span className="price-prefix">$</span>
                  <input
                    type="number"
                    value={productDiscountPrice}
                    onChange={(e) => setProductDiscountPrice(e.target.value)}
                    placeholder="Opcional"
                    className="product-input price-input"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="form-field">
              <label>Categoría</label>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="product-select"
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Etiquetas (Tags para IA)</label>
              <input
                type="text"
                value={productTags}
                onChange={(e) => setProductTags(e.target.value)}
                placeholder="Ej: verano, running, mujer, oferta"
                className="product-input"
              />
              <span className="char-count" style={{ fontSize: '11px' }}>
                Separadas por comas. Usadas por la IA para recomendar productos.
              </span>
            </div>

            {/* Summary Stats */}
            <div className="upload-summary">
              <h4>Resumen</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <ImageIcon size={16} />
                  <span>
                    {totalImages} imagen{totalImages !== 1 ? 'es' : ''}
                  </span>
                </div>
                <div className="summary-item">
                  <Layers size={16} />
                  <span>
                    {variants.length} variante{variants.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="summary-item">
                  <Package size={16} />
                  <span>{totalStock} unidades</span>
                </div>
                <div className="summary-item">
                  <Grid3X3 size={16} />
                  <span>
                    {new Set(variants.map((v) => v.color)).size} color
                    {new Set(variants.map((v) => v.color)).size !== 1 ? 'es' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="upload-actions">
              <button
                className="btn-preview-product"
                onClick={() => setPreviewProduct(true)}
                disabled={!mainImage || !productName}
              >
                <Eye size={16} />
                Vista Previa
              </button>
              <button
                className="btn-publish"
                onClick={handlePublish}
                disabled={!mainImage || !productName || !productPrice || isPublishing || uploading}
              >
                {isPublishing || uploading ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    {progress.status === 'processing' ? 'Convirtiendo a WebP...' : 'Publicando...'}
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Publicar Producto
                  </>
                )}
              </button>
            </div>

            {/* Barra de progreso de subida */}
            {(uploading || isPublishing) && (
              <div className="upload-progress-bar">
                <div className="upload-progress-header">
                  <Wifi size={14} />
                  <span>{progress.message || 'Procesando imágenes...'}</span>
                </div>
                <div className="upload-progress-track">
                  <div className="upload-progress-fill" style={{ width: `${progress.percent}%` }} />
                </div>
                <span className="upload-progress-percent">{progress.percent}%</span>
              </div>
            )}

            {/* Error de publicación */}
            {publishError && (
              <div className="upload-error-banner">
                <AlertCircle size={16} />
                <span>{publishError}</span>
                <button onClick={() => setPublishError(null)}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Error de subida de imágenes */}
            {uploadError && !publishError && (
              <div className="upload-error-banner">
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        PRODUCT LIST SECTION                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ProductListSection({
  onBack,
  onAddProduct,
  storeId,
}: {
  onBack: () => void
  onAddProduct: () => void
  storeId: string | null
}) {
  const [products, setProducts] = useState<DashboardProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<DashboardProduct | null>(null)
  const [activeVariantImg, setActiveVariantImg] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true
    async function fetchProducts() {
      if (!storeId) {
        if (isMounted) {
          setProducts([])
          setIsLoading(false)
        }
        return
      }
      try {
        const res = await fetch(`/api/products?storeId=${storeId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && isMounted) {
            type DbImage = { thumbnail?: string; full?: string }
            type DbVariant = {
              id: string
              color: string
              color_hex: string
              size: string
              type: string
              images?: DbImage[]
              stock: number
              price_modifier: number
            }
            type DbProduct = {
              id: string
              name: string
              description?: string
              price: number
              discount_price?: number
              images?: DbImage[]
              category_id?: string
              product_variants?: DbVariant[]
              is_active: boolean
              created_at: string
            }

            const mapped = data.products.map((p: DbProduct) => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              price: p.price,
              discountPrice: p.discount_price,
              mainImage: p.images?.[0]?.thumbnail || p.images?.[0]?.full || '',
              category: p.category_id || 'Sin categoría',
              variants: (p.product_variants || []).map((v: DbVariant) => ({
                id: v.id,
                color: v.color,
                colorHex: v.color_hex,
                size: v.size,
                type: v.type,
                images: v.images?.map((img: DbImage) => img.thumbnail || img.full) || [],
                uploadedImages: [],
                stock: v.stock,
                priceModifier: v.price_modifier,
              })),
              isActive: p.is_active,
              createdAt: p.created_at,
            }))
            setProducts(mapped)
          }
        }
      } catch (err) {
        console.error('Error fetching products', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchProducts()
    return () => {
      isMounted = false
    }
  }, [storeId])

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const allCategories = ['all', ...new Set(products.map((p) => p.category))]

  // Product Detail View
  if (selectedProduct) {
    const allVariantImages = selectedProduct.variants.flatMap((v) =>
      v.images.map((img) => ({ img, color: v.color, size: v.size, type: v.type }))
    )
    const displayImage = activeVariantImg || selectedProduct.mainImage

    return (
      <div className="product-detail-view">
        <div className="breadcrumb">
          <button
            className="breadcrumb-back"
            onClick={() => {
              setSelectedProduct(null)
              setActiveVariantImg(null)
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="breadcrumb-item">Mis Productos</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-item active">{selectedProduct.name}</span>
        </div>

        <div className="product-detail-layout">
          {/* Gallery */}
          <div className="product-detail-gallery">
            <div className="product-detail-main-img">
              <img src={displayImage} alt={selectedProduct.name} />
              {selectedProduct.discountPrice && (
                <span className="detail-discount-badge">
                  -
                  {Math.round(
                    ((selectedProduct.price - selectedProduct.discountPrice) /
                      selectedProduct.price) *
                      100
                  )}
                  %
                </span>
              )}
            </div>
            <div className="product-detail-thumbnails">
              <div
                className={`thumb-item ${!activeVariantImg ? 'active' : ''}`}
                onClick={() => setActiveVariantImg(null)}
              >
                <img src={selectedProduct.mainImage} alt="Principal" />
                <span className="thumb-label">Principal</span>
              </div>
              {allVariantImages.map((v, i) => (
                <div
                  key={i}
                  className={`thumb-item ${activeVariantImg === v.img ? 'active' : ''}`}
                  onClick={() => setActiveVariantImg(v.img)}
                >
                  <img src={v.img} alt={`${v.color} ${v.size}`} />
                  <span className="thumb-label">{v.color}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="product-detail-info">
            <div className="detail-top-row">
              <span className="product-detail-category">{selectedProduct.category}</span>
              <span
                className={`product-status ${selectedProduct.isActive ? 'active' : 'inactive'}`}
              >
                {selectedProduct.isActive ? '● Activo' : '○ Inactivo'}
              </span>
            </div>
            <h2>{selectedProduct.name}</h2>
            <p className="product-detail-desc">{selectedProduct.description}</p>

            <div className="product-detail-pricing">
              {selectedProduct.discountPrice && (
                <span className="product-detail-original-price">
                  ${selectedProduct.price.toLocaleString()}
                </span>
              )}
              <span className="product-detail-price">
                ${(selectedProduct.discountPrice || selectedProduct.price).toLocaleString()}
              </span>
            </div>

            <h4 className="product-detail-section-title">
              <Layers size={16} />
              Variantes ({selectedProduct.variants.length})
            </h4>
            <div className="product-detail-variants">
              {selectedProduct.variants.map((v) => (
                <div
                  key={v.id}
                  className="product-detail-variant-card"
                  onClick={() => setActiveVariantImg(v.images[0] ?? null)}
                >
                  <div className="variant-card-header">
                    <span className="variant-color-dot-lg" style={{ background: v.colorHex }} />
                    <div>
                      <strong>{v.color}</strong>
                      <span className="variant-meta">
                        Talla {v.size} · {v.type}
                      </span>
                    </div>
                  </div>
                  <div className="variant-card-images">
                    {v.images.map((img, i) => (
                      <img key={i} src={img} alt={`${v.color} ${i}`} />
                    ))}
                  </div>
                  <div className="variant-card-footer">
                    <span>Stock: {v.stock}</span>
                    {v.priceModifier !== 0 && (
                      <span className={v.priceModifier > 0 ? 'price-up' : 'price-down'}>
                        {v.priceModifier > 0 ? '+' : ''}$
                        {Math.abs(v.priceModifier).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="product-detail-stats-row">
              <div className="stat-box">
                <ImageIcon size={18} />
                <span>
                  {selectedProduct.variants.reduce((acc, v) => acc + v.images.length, 0) + 1}{' '}
                  imágenes
                </span>
              </div>
              <div className="stat-box">
                <Layers size={18} />
                <span>{selectedProduct.variants.length} variantes</span>
              </div>
              <div className="stat-box">
                <Package size={18} />
                <span>
                  {selectedProduct.variants.reduce((acc, v) => acc + v.stock, 0)} en stock
                </span>
              </div>
            </div>

            {/* ── Share to Community ── */}
            <button
              className="btn-share-community"
              onClick={() => {
                setShareToast(selectedProduct.name)
                setTimeout(() => setShareToast(null), 3000)
              }}
            >
              <Share2 size={18} />
              Compartir en Comunidad
            </button>

            {/* Community Stats */}
            <div className="community-stats-card">
              <h4 className="community-stats-title">
                <Share2 size={16} />
                Estadísticas de Comunidad
              </h4>
              <div className="community-stats-grid">
                <div className="community-stat">
                  <Heart size={20} color="#e74c3c" />
                  <span className="community-stat-value">127</span>
                  <span className="community-stat-label">Me gusta</span>
                </div>
                <div className="community-stat">
                  <MessageCircleIcon size={20} color="#5eb5f7" />
                  <span className="community-stat-value">24</span>
                  <span className="community-stat-label">Comentarios</span>
                </div>
                <div className="community-stat">
                  <EyeIcon size={20} color="#f39c12" />
                  <span className="community-stat-value">1.5k</span>
                  <span className="community-stat-label">Vistas</span>
                </div>
                <div className="community-stat">
                  <ExternalLink size={20} color="#4dcd5e" />
                  <span className="community-stat-value">89</span>
                  <span className="community-stat-label">Visitas tienda</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share toast */}
        {shareToast && (
          <div className="share-toast">
            <CheckCircle2 size={18} />
            <span>&quot;{shareToast}&quot; compartido en la Comunidad</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="product-list-section">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <span className="breadcrumb-item">Productos</span>
        <ChevronRight size={14} />
        <span className="breadcrumb-item active">Todos los Productos</span>
      </div>

      {/* Top bar */}
      <div className="products-topbar">
        <div className="products-search-wrapper">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="products-search-input"
          />
        </div>
        <button className="btn-add-new-product" onClick={onAddProduct}>
          <Plus size={18} />
          <span>Subir Producto</span>
        </button>
      </div>

      {/* Category Filters */}
      <div className="products-filters">
        {allCategories.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="products-empty">
          <Loader2 size={48} className="spinning" style={{ marginBottom: 16 }} />
          <h3>Cargando productos...</h3>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="products-empty">
          <Package size={64} />
          <h3>No hay productos</h3>
          <p>Sube tu primer producto para verlo aquí</p>
          <button className="btn-add-new-product" onClick={onAddProduct}>
            <Plus size={18} />
            Subir Producto
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card-dashboard"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="product-card-image">
                <img src={product.mainImage} alt={product.name} />
                {product.discountPrice && (
                  <span className="product-card-discount">
                    -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                  </span>
                )}
                <span className={`product-card-status ${product.isActive ? 'active' : 'inactive'}`}>
                  {product.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <div className="product-card-variants-badge">
                  <Layers size={12} />
                  {product.variants.length}
                </div>
              </div>
              <div className="product-card-body">
                <span className="product-card-category">{product.category}</span>
                <h4 className="product-card-name">{product.name}</h4>
                <div className="product-card-pricing">
                  {product.discountPrice ? (
                    <>
                      <span className="product-card-old-price">
                        ${product.price.toLocaleString()}
                      </span>
                      <span className="product-card-price">
                        ${product.discountPrice.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="product-card-price">${product.price.toLocaleString()}</span>
                  )}
                </div>
                <div className="product-card-colors">
                  {product.variants.map((v) => (
                    <span
                      key={v.id}
                      className="product-card-color-dot"
                      style={{ background: v.colorHex }}
                      title={`${v.color} - ${v.size}`}
                    />
                  ))}
                </div>
                <div className="product-card-meta">
                  <span>
                    <ImageIcon size={12} />
                    {product.variants.reduce((acc, v) => acc + v.images.length, 0) + 1}
                  </span>
                  <span>
                    <Package size={12} />
                    {product.variants.reduce((acc, v) => acc + v.stock, 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                   COMMUNITY ANALYTICS SECTION                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CommunityAnalyticsSection({ onBack }: { onBack: () => void }) {
  const sharedProducts = [
    {
      name: 'Adidas Ultraboost 22',
      image: '/templates/sneaker-vault-preview.png',
      likes: 127,
      comments: 24,
      views: 1523,
      storeClicks: 89,
      date: '15 Feb 2026',
    },
    {
      name: 'Gorra Cap Kings Edición Limitada',
      image: '/templates/cap-kings-preview.png',
      likes: 84,
      comments: 12,
      views: 967,
      storeClicks: 52,
      date: '14 Feb 2026',
    },
  ]

  const totalLikes = sharedProducts.reduce((acc, p) => acc + p.likes, 0)
  const totalComments = sharedProducts.reduce((acc, p) => acc + p.comments, 0)
  const totalViews = sharedProducts.reduce((acc, p) => acc + p.views, 0)
  const totalClicks = sharedProducts.reduce((acc, p) => acc + p.storeClicks, 0)

  return (
    <div className="community-analytics-section">
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <span className="breadcrumb-item">Productos</span>
        <ChevronRight size={14} />
        <span className="breadcrumb-item active">Comunidad</span>
      </div>

      <div className="community-analytics-header">
        <div className="step-icon-wrapper">
          <Share2 size={32} />
        </div>
        <h2>Rendimiento en Comunidad</h2>
        <p>Mira cómo interactúan los usuarios con tus productos compartidos</p>
      </div>

      {/* Summary Cards */}
      <div className="community-summary-cards">
        <div className="summary-card">
          <Heart size={24} color="#e74c3c" />
          <span className="summary-value">{totalLikes}</span>
          <span className="summary-label">Me gusta totales</span>
        </div>
        <div className="summary-card">
          <MessageCircleIcon size={24} color="#5eb5f7" />
          <span className="summary-value">{totalComments}</span>
          <span className="summary-label">Comentarios</span>
        </div>
        <div className="summary-card">
          <EyeIcon size={24} color="#f39c12" />
          <span className="summary-value">{totalViews.toLocaleString()}</span>
          <span className="summary-label">Vistas</span>
        </div>
        <div className="summary-card">
          <ExternalLink size={24} color="#4dcd5e" />
          <span className="summary-value">{totalClicks}</span>
          <span className="summary-label">Visitas a tienda</span>
        </div>
      </div>

      {/* Shared Products List */}
      <h3 className="community-list-title">Productos Compartidos</h3>
      <div className="community-product-list">
        {sharedProducts.map((product, i) => (
          <div key={i} className="community-product-item">
            <div className="community-product-img-wrap">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="community-product-details">
              <h4>{product.name}</h4>
              <span className="community-product-date">Compartido: {product.date}</span>
              <div className="community-product-stats">
                <span>
                  <Heart size={14} color="#e74c3c" /> {product.likes}
                </span>
                <span>
                  <MessageCircleIcon size={14} color="#5eb5f7" /> {product.comments}
                </span>
                <span>
                  <EyeIcon size={14} color="#f39c12" /> {product.views}
                </span>
                <span>
                  <ExternalLink size={14} color="#4dcd5e" /> {product.storeClicks}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sharedProducts.length === 0 && (
        <div className="products-empty">
          <Share2 size={64} />
          <h3>Sin publicaciones</h3>
          <p>Comparte tu primer producto en la comunidad para ver las estadísticas aquí</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                 STORE CHECKOUT CONFIGURATION SECTION                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StoreCheckoutConfigSection({
  onBack,
  store,
}: {
  onBack: () => void
  store: Record<string, unknown>
}) {
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp_number || '')
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    store?.payment_methods || ['efectivo']
  )
  const [autoDiscountRules, setAutoDiscountRules] = useState(
    store?.auto_discount_rules
      ? JSON.stringify(store.auto_discount_rules, null, 2)
      : '[\n  {\n    "trigger_keyword": "descuento10",\n    "discount_percentage": 10\n  }\n]'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let parsedRules = null
      if (autoDiscountRules.trim()) {
        try {
          parsedRules = JSON.parse(autoDiscountRules)
        } catch {
          alert('Las reglas de descuento no tienen un formato JSON válido.')
          setIsSaving(false)
          return
        }
      }

      const res = await fetch('/api/stores/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          whatsappNumber: whatsapp,
          paymentMethods,
          autoDiscountRules: parsedRules,
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        // ideally update parent state too
      } else {
        alert('Error guardando la configuración.')
      }
    } catch {
      alert('Error de conexión.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="change-template-section">
      {' '}
      {/* Reusing styles */}
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <span className="breadcrumb-item">Administrar Tienda</span>
        <ChevronRight size={14} />
        <span className="breadcrumb-item active">Caja de Cobro (IA)</span>
      </div>
      <div className="change-template-header" style={{ marginBottom: '24px' }}>
        <div className="change-template-title-row">
          <DollarSign size={22} />
          <h2>Configuración de Caja y Asistente IA</h2>
        </div>
        <p>Configura las reglas que usará la Inteligencia Artificial para cobrar y guiar ventas.</p>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '600px',
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* WhatsApp */}
        <div className="input-group">
          <label
            className="form-label"
            style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}
          >
            Número de WhatsApp (con código de país ej: 57)
          </label>
          <input
            type="text"
            className="form-input"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '8px',
            }}
            placeholder="Ej: 573001234567"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>

        {/* Métodos de Pago */}
        <div className="input-group">
          <label
            className="form-label"
            style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}
          >
            Métodos de Pago Aceptados
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['efectivo', 'transferencia', 'nequi', 'daviplata', 'tarjeta', 'contra_entrega'].map(
              (method) => (
                <label
                  key={method}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: paymentMethods.includes(method) ? '#e0f2fe' : '#f1f5f9',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    border: paymentMethods.includes(method)
                      ? '1px solid #38bdf8'
                      : '1px solid transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={paymentMethods.includes(method)}
                    onChange={() => togglePaymentMethod(method)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                    {method.replace('_', ' ')}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* Reglas de Descuento (JSON) */}
        <div className="input-group">
          <label
            className="form-label"
            style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}
          >
            Reglas de Descuento (JSON)
          </label>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Instruye a la IA sobre qué descuentos puede ofrecer automáticamente.
          </p>
          <textarea
            className="form-input"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              minHeight: '120px',
              fontFamily: 'monospace',
            }}
            value={autoDiscountRules}
            onChange={(e) => setAutoDiscountRules(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: '#111',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            cursor: isSaving ? 'wait' : 'pointer',
          }}
        >
          {isSaving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        MAIN DASHBOARD PAGE                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>('admin-store')
  const [activeSection, setActiveSection] = useState('panel')
  const [userInitials, setUserInitials] = useState('TU')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userStore, setUserStore] = useState<{
    id: string
    name: string
    slug: string
    banner_url?: string
    whatsapp_number?: string
    payment_methods?: string[]
    auto_discount_rules?: unknown
  } | null>(null)
  const [initialTemplate, setInitialTemplate] = useState('minimal')
  const [isLoadingStore, setIsLoadingStore] = useState(true)
  const [userRole, setUserRole] = useState<string>('buyer')
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop')

  /* Cargar datos del usuario al montar */
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user?.email) {
          const email = user.email
          setUserEmail(email)
          const localPart = email.split('@')[0] ?? ''
          const parts = localPart.split('.')
          const first = parts[0] ?? ''
          const second = parts[1] ?? ''
          const initials = ((first[0] ?? '') + (second[0] ?? first[1] ?? '')).toUpperCase()
          setUserInitials(initials || 'TU')
        }

        /* Consultar rol de usuario desde auth metadatos o profile */
        let localRole = 'buyer'
        if (user) {
          // Check auth metadata as primary or fallback
          if (
            user.user_metadata?.role === 'superadmin' ||
            user.app_metadata?.role === 'superadmin'
          ) {
            localRole = 'superadmin'
            setUserRole(localRole)
          } else {
            // Intentar buscar de tabla perfiles por si existe
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, nombre')
              .eq('id', user.id)
              .single()
            if (profile?.role) {
              localRole = profile.role
              setUserRole(localRole)
            }
            if (profile?.nombre) {
              setUserName(profile.nombre)
            }
          }
        }

        if (localRole === 'superadmin') {
          // Si es master admin, bypass de tienda
          setIsLoadingStore(false)
          return
        }

        /* Cargar tienda */
        const res = await fetch('/api/stores')
        if (res.ok) {
          const storeData = await res.json()
          if (storeData.stores && storeData.stores.length > 0) {
            const store = storeData.stores[0]
            setUserStore(store)
            try {
              if (store.banner_url) {
                const parsed = JSON.parse(store.banner_url)
                if (parsed.templateId) {
                  setInitialTemplate(parsed.templateId)
                }
              }
            } catch {
              /* ignore */
            }
          } else {
            // Si no tiene tienda, forzar vista de creación solo si no es admin master
            setActiveSection('create-store')
          }
        }
      } catch {
        /* fallo silencioso */
      } finally {
        setIsLoadingStore(false)
      }
    }
    loadUser()
  }, [])

  /* Cerrar sesión real */
  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch {
      router.push('/')
    }
  }

  const toggleMenu = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId)
  }

  const handleSubItemClick = (subItemId: string) => {
    setActiveSection(subItemId)
    setSidebarOpen(false)
  }

  const renderContent = () => {
    // Renderizado especial por rol Master Admin
    if (userRole === 'superadmin') {
      switch (activeSection) {
        case 'panel':
          return <MasterAdminPanel />
        default:
          return <MasterAdminPanel /> // Podría extenderse a otras vistas después
      }
    }

    switch (activeSection) {
      case 'panel':
        if (!isLoadingStore && !userStore) {
          return <CreateStoreSection onBack={() => setActiveSection('panel')} />
        }
        return <AdminPanel storeSlug={userStore?.slug} />
      case 'create-store':
        return <CreateStoreSection onBack={() => setActiveSection('panel')} />
      case 'store-settings':
        if (!userStore) return <div>Cargando...</div>
        return (
          <ChangeTemplateSection
            onBack={() => setActiveSection('panel')}
            storeId={userStore.id}
            initialTemplate={initialTemplate}
          />
        )
      case 'store-checkout':
        if (!userStore) return <div>Cargando...</div>
        return (
          <StoreCheckoutConfigSection onBack={() => setActiveSection('panel')} store={userStore} />
        )
      case 'add-product':
        return (
          <ProductUploadSection
            onBack={() => setActiveSection('panel')}
            onGoToProducts={() => setActiveSection('all-products')}
            storeId={userStore?.id || null}
          />
        )
      case 'all-products':
        return (
          <ProductListSection
            onBack={() => setActiveSection('panel')}
            onAddProduct={() => setActiveSection('add-product')}
            storeId={userStore?.id || null}
          />
        )
      case 'community-analytics':
        return <CommunityAnalyticsSection onBack={() => setActiveSection('panel')} />
      case 'all-orders':
        return <OrdersDashboard />

      default:
        if (!isLoadingStore && !userStore) {
          return <CreateStoreSection onBack={() => setActiveSection('panel')} />
        }
        return <AdminPanel storeSlug={userStore?.slug} />
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">LocalEcomer</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">MENÚ PRINCIPAL</div>
          {(userRole === 'superadmin' ? masterMenuItems : menuItems).map((item) => (
            <div key={item.id} className="nav-group">
              <button
                className={`nav-group-btn ${expandedMenu === item.id ? 'expanded' : ''}`}
                onClick={() => (item.subItems ? toggleMenu(item.id) : handleSubItemClick(item.id))}
              >
                <div className="nav-group-left">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.subItems && (
                  <ChevronDown
                    size={16}
                    className={`nav-chevron ${expandedMenu === item.id ? 'rotated' : ''}`}
                  />
                )}
              </button>

              {item.subItems && expandedMenu === item.id && (
                <div className="nav-subitems">
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.id}
                      className={`nav-subitem ${activeSection === sub.id ? 'active' : ''}`}
                      onClick={() => handleSubItemClick(sub.id)}
                    >
                      {sub.icon}
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {userEmail && (
            <div
              style={{
                padding: '8px 16px',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.4)',
                wordBreak: 'break-all',
              }}
            >
              {userEmail}
            </div>
          )}
          <button className="sidebar-footer-btn">
            <HelpCircle size={18} />
            <span>Ayuda</span>
          </button>
          <button className="sidebar-footer-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top bar */}
        <header className="dashboard-topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="topbar-title">
            {activeSection === 'panel'
              ? userName
                ? `Panel de ${userName.split(' ')[0]}`
                : 'Panel de Administración'
              : activeSection === 'create-store'
                ? 'Crear Tienda'
                : activeSection === 'store-settings'
                  ? 'Plantilla'
                  : activeSection === 'store-checkout'
                    ? 'Caja de Cobro y Asistente IA'
                    : activeSection === 'add-product'
                      ? 'Subir Producto'
                      : activeSection === 'all-products'
                        ? 'Mis Productos'
                        : activeSection === 'all-orders'
                          ? 'Gestión de Pedidos'
                          : activeSection === 'community-analytics'
                            ? 'Comunidad'
                            : userName
                              ? `Panel de ${userName.split(' ')[0]}`
                              : 'Panel de Administración'}
          </h1>
          <div className="topbar-right flex items-center gap-4">
            {/* View Toggles */}
            <div className="flex bg-gray-200 rounded-full p-1 shrink-0 shadow-inner">
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-1.5 rounded-full transition-colors ${viewMode === 'mobile' ? 'bg-white shadow text-[#FF5A26]' : 'text-gray-500 hover:text-gray-700'}`}
                title="Vista Móvil"
              >
                <Smartphone size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-1.5 rounded-full transition-colors ${viewMode === 'desktop' ? 'bg-white shadow text-[#FF5A26]' : 'text-gray-500 hover:text-gray-700'}`}
                title="Vista Escritorio"
              >
                <Monitor size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="topbar-avatar" title={userEmail}>
              <span>{userInitials}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div
          className={`dashboard-content flex-1 max-w-full overflow-y-auto w-full flex flex-col items-center bg-[#f9fafb]`}
        >
          <div
            className={`w-full h-full ${viewMode === 'mobile' ? 'max-w-md sm:border-x shadow-2xl bg-[#f9fafb]' : 'w-full max-w-[1600px]'} transition-all mx-auto`}
          >
            {isLoadingStore ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  minHeight: '300px',
                }}
              >
                <Loader2 size={32} className="spinning" color="#6366f1" />
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
