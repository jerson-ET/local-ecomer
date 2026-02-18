'use client'

import React, { useState, useRef, useCallback } from 'react'
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
} from 'lucide-react'
import OrdersDashboard from '@/components/features/dashboard/OrdersDashboard'

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
        description: 'Diseño agresivo y oscuro con acentos neón. Perfecto para tiendas de motos y repuestos.',
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
        description: 'Estilo urbano y moderno con gradientes. Ideal para tiendas de calzado y streetwear.',
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
        description: 'Diseño cultural y cálido con texturas orgánicas. Perfecto para artesanías y productos hechos a mano.',
        category: 'Artesanía',
        colors: ['#c05634', '#fefcf7', '#17a589', '#f39c12'],
        features: ['Historia de producto', 'Texuras de papel', 'Estilo ancestral', 'Foco en el artesano'],
        popular: false,
        rating: 5.0,
        uses: '3.4k',
        storeUrl: '/store/wayuu',
        previewImage: '/templates/wayuu-arts-preview.png',
    },
    {
        id: 'cap-kings',
        name: 'Cap Kings',
        description: 'Estilo urbano, bold y de alto contraste. Ideal para tiendas de gorras y accesorios de cabeza.',
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
        description: 'Vanguardista y minimalista. Perfecto para electrónicos, celulares y gadgets high-end.',
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
        description: 'Colores vibrantes y cálidos. Ideal para tiendas de mascotas, accesorios y alimento.',
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
        description: 'Estilo cyberpunk con neón y efectos glow. Perfecto para tiendas de videojuegos y periféricos gaming.',
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
        description: 'Elegante y femenino con tonos rosados y dorados. Ideal para cosméticos, skincare y fragancias.',
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

const menuItems: MenuItem[] = [
    {
        id: 'admin-store',
        label: 'Administrar Tienda',
        icon: <Store size={20} />,
        subItems: [
            { id: 'create-store', label: 'Crear Tienda', icon: <Sparkles size={16} /> },
            { id: 'store-settings', label: 'Configuración', icon: <Settings size={16} /> },
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
        ]
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
                                <div
                                    className="template-header-mock"
                                    style={{ background: template.colors[0] }}
                                />
                                <div className="template-body-mock">
                                    <div
                                        className="template-accent-bar"
                                        style={{ background: template.colors[2] }}
                                    />
                                    <div className="template-grid-mock">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="template-grid-item"
                                                style={{
                                                    background: template.colors[i % template.colors.length],
                                                    opacity: 0.6 + (i * 0.1),
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
                        <span
                            key={i}
                            className="template-color-dot"
                            style={{ background: color }}
                        />
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
                        <span className="template-feature-more">
                            +{template.features.length - 3}
                        </span>
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
                                <span className="preview-url">localecomer.tienda/tu-tienda</span>
                            </div>
                            <div className="preview-layout-large">
                                <div
                                    className="preview-header-l"
                                    style={{ background: template.colors[0] }}
                                >
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
                                        <span
                                            className="preview-color-swatch"
                                            style={{ background: color }}
                                        />
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

function CreateStoreSection({
    onBack,
}: {
    onBack: () => void
}) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [storeName, setStoreName] = useState('')
    const [storeSlug, setStoreSlug] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
    const [previewTemplate, setPreviewTemplate] = useState<(typeof storeTemplates)[0] | null>(null)
    const [filterCategory, setFilterCategory] = useState('all')

    const categories = ['all', 'Premium', 'Mascotas', 'Motos', 'Calzado', 'Artesanía', 'Gorras', 'Lujo', 'Alimentos', 'Tecnología', 'Gaming', 'Belleza']

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
        if (storeName.trim().length >= 3) {
            setStep(2)
        }
    }

    const handleSelectTemplate = (templateId: string) => {
        setSelectedTemplate(templateId)
    }

    const handleConfirmTemplate = () => {
        if (selectedTemplate) {
            setStep(3)
        }
    }

    return (
        <div className="create-store-section">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <button className="breadcrumb-back" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <span className="breadcrumb-item">Administrar Tienda</span>
                <ChevronRight size={14} />
                <span className="breadcrumb-item active">Crear Tienda</span>
                {step >= 2 && (
                    <>
                        <ChevronRight size={14} />
                        <span className="breadcrumb-item active">Elegir Plantilla</span>
                    </>
                )}
            </div>

            {/* Progress Steps */}
            <div className="create-steps">
                <div className={`create-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 1 ? <Check size={14} /> : '1'}</div>
                    <span>Información</span>
                </div>
                <div className="step-connector" />
                <div className={`create-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 2 ? <Check size={14} /> : '2'}</div>
                    <span>Plantilla</span>
                </div>
                <div className="step-connector" />
                <div className={`create-step ${step >= 3 ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <span>Confirmar</span>
                </div>
            </div>

            {/* Step 1: Store Info */}
            {step === 1 && (
                <div className="create-step-content step-info">
                    <div className="step-header">
                        <div className="step-icon-wrapper">
                            <Store size={32} />
                        </div>
                        <h2>Nombra tu tienda</h2>
                        <p>Elige un nombre único para tu tienda en LocalEcomer</p>
                    </div>

                    <div className="store-name-form">
                        <div className="form-field">
                            <label>Nombre de la tienda</label>
                            <input
                                type="text"
                                value={storeName}
                                onChange={(e) => handleStoreNameChange(e.target.value)}
                                placeholder="Ej: Mi Tienda Cool"
                                className="store-input"
                                maxLength={40}
                            />
                            <span className="char-count">{storeName.length}/40</span>
                        </div>

                        {storeSlug && (
                            <div className="store-url-preview">
                                <span className="url-label">Tu URL será:</span>
                                <span className="url-value">
                                    localecomer.tienda/<strong>{storeSlug}</strong>
                                </span>
                            </div>
                        )}

                        <button
                            className="btn-primary"
                            onClick={handleContinueToTemplates}
                            disabled={storeName.trim().length < 3}
                        >
                            Continuar
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Choose Template */}
            {step === 2 && (
                <div className="create-step-content step-templates">
                    <div className="step-header">
                        <div className="step-icon-wrapper">
                            <LayoutTemplate size={32} />
                        </div>
                        <h2>Elige una plantilla</h2>
                        <p>
                            Selecciona el diseño perfecto para <strong>{storeName}</strong>
                        </p>
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
                            <TemplateCard
                                key={template.id}
                                template={template}
                                isSelected={selectedTemplate === template.id}
                                onSelect={() => handleSelectTemplate(template.id)}
                                onPreview={() => setPreviewTemplate(template)}
                            />
                        ))}
                    </div>

                    {/* Continue Button */}
                    <div className="template-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => setStep(1)}
                        >
                            <ArrowLeft size={18} />
                            Volver
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleConfirmTemplate}
                            disabled={!selectedTemplate}
                        >
                            Continuar con plantilla
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div className="create-step-content step-confirm">
                    <div className="confirm-card">
                        <div className="confirm-icon">
                            <Crown size={48} />
                        </div>
                        <h2>¡Todo listo!</h2>
                        <p>Tu tienda está lista para ser creada</p>

                        <div className="confirm-summary">
                            <div className="confirm-row">
                                <span className="confirm-label">Nombre:</span>
                                <span className="confirm-value">{storeName}</span>
                            </div>
                            <div className="confirm-row">
                                <span className="confirm-label">URL:</span>
                                <span className="confirm-value">localecomer.tienda/{storeSlug}</span>
                            </div>
                            <div className="confirm-row">
                                <span className="confirm-label">Plantilla:</span>
                                <span className="confirm-value">
                                    {storeTemplates.find((t) => t.id === selectedTemplate)?.name}
                                </span>
                            </div>
                        </div>

                        <div className="confirm-actions">
                            <button className="btn-secondary" onClick={() => setStep(2)}>
                                <ArrowLeft size={18} />
                                Cambiar plantilla
                            </button>
                            <button
                                className="btn-primary btn-create"
                                onClick={() => {
                                    const tmpl = storeTemplates.find(t => t.id === selectedTemplate)
                                    if (tmpl?.storeUrl) {
                                        router.push(tmpl.storeUrl)
                                    } else {
                                        alert('Esta plantilla estará disponible pronto. Por ahora prueba la plantilla "Minimal".')
                                    }
                                }}
                            >
                                <Sparkles size={18} />
                                Crear mi tienda
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
}: {
    onBack: () => void
}) {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
    const [previewTemplate, setPreviewTemplate] = useState<(typeof storeTemplates)[0] | null>(null)
    const [filterCategory, setFilterCategory] = useState('all')
    const [showConfirm, setShowConfirm] = useState(false)
    const [isChanging, setIsChanging] = useState(false)
    const [changeSuccess, setChangeSuccess] = useState(false)

    // Simular plantilla actual (en producción vendría de la base de datos)
    const [currentTemplate, setCurrentTemplate] = useState('minimal')

    const categories = ['all', 'Premium', 'Mascotas', 'Motos', 'Calzado', 'Artesanía', 'Gorras', 'Lujo', 'Alimentos', 'Tecnología', 'Gaming', 'Belleza']

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

    const handleConfirmChange = () => {
        if (!selectedTemplate) return
        setIsChanging(true)

        // Simular cambio de plantilla
        setTimeout(() => {
            setCurrentTemplate(selectedTemplate)
            setIsChanging(false)
            setShowConfirm(false)
            setChangeSuccess(true)
            setSelectedTemplate(null)

            // Ocultar mensaje de éxito después de 3 segundos
            setTimeout(() => {
                setChangeSuccess(false)
            }, 3000)
        }, 1500)
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
                            <span
                                key={i}
                                className="template-color-dot"
                                style={{ background: color }}
                            />
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
                        <span className="change-from">
                            {currentTemplateData?.name}
                        </span>
                        <ChevronRight size={16} />
                        <span className="change-to">
                            {selectedTemplateData?.name}
                        </span>
                    </div>
                    <div className="change-buttons">
                        <button
                            className="btn-secondary"
                            onClick={() => setSelectedTemplate(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-primary btn-change"
                            onClick={() => setShowConfirm(true)}
                        >
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
                            <button
                                className="btn-primary"
                                onClick={handleConfirmChange}
                                disabled={isChanging}
                            >
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
    images: string[]
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

// Demo products for the list view
const demoProducts: DashboardProduct[] = [
    {
        id: '1',
        name: 'Adidas Ultraboost 22',
        description: 'Zapatillas running premium con tecnología Boost para máxima amortiguación.',
        price: 189900,
        discountPrice: 149900,
        mainImage: '/templates/sneaker-vault-preview.png',
        category: 'Calzado',
        variants: [
            { id: 'v1', color: 'Negro', colorHex: '#111', size: '38', type: 'adulto', images: ['/templates/sneaker-vault-preview.png'], stock: 12, priceModifier: 0 },
            { id: 'v2', color: 'Blanco', colorHex: '#f5f5f5', size: '40', type: 'adulto', images: ['/templates/minimal-preview.png'], stock: 8, priceModifier: 0 },
            { id: 'v3', color: 'Azul', colorHex: '#1e90ff', size: '36', type: 'niño', images: ['/templates/tech-phone-preview.png'], stock: 5, priceModifier: -10000 },
        ],
        isActive: true,
        createdAt: '2026-02-14',
    },
    {
        id: '2',
        name: 'Gorra Cap Kings Edición Limitada',
        description: 'Gorra snapback con diseño exclusivo bordado a mano.',
        price: 45000,
        discountPrice: null,
        mainImage: '/templates/cap-kings-preview.png',
        category: 'Gorras',
        variants: [
            { id: 'v4', color: 'Negro', colorHex: '#111', size: 'Única', type: 'unisex', images: ['/templates/cap-kings-preview.png'], stock: 25, priceModifier: 0 },
            { id: 'v5', color: 'Rojo', colorHex: '#e94560', size: 'Única', type: 'unisex', images: ['/templates/moto-racer-preview.png'], stock: 15, priceModifier: 5000 },
        ],
        isActive: true,
        createdAt: '2026-02-13',
    },
    {
        id: '3',
        name: 'Mochila Wayuu Original',
        description: 'Mochila tejida a mano por artesanas Wayuu del desierto de La Guajira.',
        price: 120000,
        discountPrice: 99000,
        mainImage: '/templates/wayuu-arts-preview.png',
        category: 'Artesanía',
        variants: [
            { id: 'v6', color: 'Multicolor Rojo', colorHex: '#e94560', size: 'Grande', type: 'unisex', images: ['/templates/wayuu-arts-preview.png'], stock: 3, priceModifier: 0 },
            { id: 'v7', color: 'Multicolor Azul', colorHex: '#1e90ff', size: 'Mediana', type: 'unisex', images: ['/templates/tech-modern-preview.png'], stock: 5, priceModifier: -15000 },
        ],
        isActive: false,
        createdAt: '2026-02-12',
    },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        PRODUCT UPLOAD SECTION                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ProductUploadSection({
    onBack,
    onGoToProducts,
}: {
    onBack: () => void
    onGoToProducts: () => void
}) {
    // Form state
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [productPrice, setProductPrice] = useState('')
    const [productDiscountPrice, setProductDiscountPrice] = useState('')
    const [productCategory, setProductCategory] = useState('')
    const [mainImage, setMainImage] = useState<string | null>(null)
    const [variants, setVariants] = useState<ProductVariant[]>([])
    const [showAddVariant, setShowAddVariant] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    // Variant form state
    const [variantColor, setVariantColor] = useState('')
    const [variantColorHex, setVariantColorHex] = useState('#000000')
    const [variantSize, setVariantSize] = useState('')
    const [variantType, setVariantType] = useState('adulto')
    const [variantImages, setVariantImages] = useState<string[]>([])
    const [variantStock, setVariantStock] = useState('1')
    const [variantPriceMod, setVariantPriceMod] = useState('0')

    // Detail view state
    const [previewProduct, setPreviewProduct] = useState(false)

    const mainImageRef = useRef<HTMLInputElement>(null)
    const variantImageRef = useRef<HTMLInputElement>(null)

    const categories = ['Calzado', 'Ropa', 'Accesorios', 'Electrónica', 'Hogar', 'Mascotas', 'Artesanía', 'Gorras', 'Alimentos', 'Belleza', 'Deportes', 'Otro']
    const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', '44', 'Única']
    const typeOptions = [
        { value: 'adulto', label: '👤 Adulto' },
        { value: 'niño', label: '👦 Niño' },
        { value: 'niña', label: '👧 Niña' },
        { value: 'unisex', label: '⚡ Unisex' },
    ]

    const handleMainImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => setMainImage(reader.result as string)
            reader.readAsDataURL(file)
        }
    }, [])

    const handleVariantImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            Array.from(files).forEach((file) => {
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
        setVariantStock('1')
        setVariantPriceMod('0')
        setShowAddVariant(false)
    }

    const removeVariant = (id: string) => {
        setVariants((prev) => prev.filter((v) => v.id !== id))
    }

    const handlePublish = () => {
        if (!productName || !productPrice || !mainImage) return
        setShowSuccess(true)
        setTimeout(() => {
            setShowSuccess(false)
            onGoToProducts()
        }, 2000)
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
                                            <span className="thumb-label">{v.color} - {v.size}</span>
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
                                                <span
                                                    className="variant-color-dot-lg"
                                                    style={{ background: v.colorHex }}
                                                />
                                                <div>
                                                    <strong>{v.color}</strong>
                                                    <span className="variant-meta">Talla {v.size} · {v.type}</span>
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
                                                        {v.priceModifier > 0 ? '+' : ''}{v.priceModifier.toLocaleString()}
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
                        <p className="upload-hint">
                            Agrega colores, tallas y más imágenes de tu producto
                        </p>

                        {/* Existing Variants */}
                        {variants.map((variant) => (
                            <div key={variant.id} className="variant-item">
                                <div className="variant-item-header">
                                    <span
                                        className="variant-color-dot"
                                        style={{ background: variant.colorHex }}
                                    />
                                    <div className="variant-item-info">
                                        <strong>{variant.color}</strong>
                                        <span>Talla {variant.size} · {variant.type} · Stock: {variant.stock}</span>
                                    </div>
                                    <span className="variant-image-count">
                                        <ImageIcon size={12} /> {variant.images.length}
                                    </span>
                                    <button
                                        className="variant-remove-btn"
                                        onClick={() => removeVariant(variant.id)}
                                    >
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
                                                <option key={s} value={s}>{s}</option>
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
                                        <span className="field-hint">Usa negativo para precio menor, positivo para mayor</span>
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
                                    <button
                                        className="btn-cancel-variant"
                                        onClick={() => setShowAddVariant(false)}
                                    >
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
                            <button
                                className="btn-new-variant"
                                onClick={() => setShowAddVariant(true)}
                            >
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
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Summary Stats */}
                        <div className="upload-summary">
                            <h4>Resumen</h4>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <ImageIcon size={16} />
                                    <span>{totalImages} imagen{totalImages !== 1 ? 'es' : ''}</span>
                                </div>
                                <div className="summary-item">
                                    <Layers size={16} />
                                    <span>{variants.length} variante{variants.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="summary-item">
                                    <Package size={16} />
                                    <span>{totalStock} unidades</span>
                                </div>
                                <div className="summary-item">
                                    <Grid3X3 size={16} />
                                    <span>{new Set(variants.map((v) => v.color)).size} color{new Set(variants.map((v) => v.color)).size !== 1 ? 'es' : ''}</span>
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
                                disabled={!mainImage || !productName || !productPrice}
                            >
                                <Upload size={16} />
                                Publicar Producto
                            </button>
                        </div>
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
}: {
    onBack: () => void
    onAddProduct: () => void
}) {
    const [products] = useState<DashboardProduct[]>(demoProducts)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [selectedProduct, setSelectedProduct] = useState<DashboardProduct | null>(null)
    const [activeVariantImg, setActiveVariantImg] = useState<string | null>(null)
    const [shareToast, setShareToast] = useState<string | null>(null)

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
                    <button className="breadcrumb-back" onClick={() => { setSelectedProduct(null); setActiveVariantImg(null) }}>
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
                                    -{Math.round(((selectedProduct.price - selectedProduct.discountPrice) / selectedProduct.price) * 100)}%
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
                            <span className={`product-status ${selectedProduct.isActive ? 'active' : 'inactive'}`}>
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
                                        <span
                                            className="variant-color-dot-lg"
                                            style={{ background: v.colorHex }}
                                        />
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
                                                {v.priceModifier > 0 ? '+' : ''}${Math.abs(v.priceModifier).toLocaleString()}
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
                                    {selectedProduct.variants.reduce((acc, v) => acc + v.images.length, 0) + 1} imágenes
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
            {filteredProducts.length === 0 ? (
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
                                        <span className="product-card-price">
                                            ${product.price.toLocaleString()}
                                        </span>
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

function CommunityAnalyticsSection({
    onBack,
}: {
    onBack: () => void
}) {
    const sharedProducts = [
        { name: 'Adidas Ultraboost 22', image: '/templates/sneaker-vault-preview.png', likes: 127, comments: 24, views: 1523, storeClicks: 89, date: '15 Feb 2026' },
        { name: 'Gorra Cap Kings Edición Limitada', image: '/templates/cap-kings-preview.png', likes: 84, comments: 12, views: 967, storeClicks: 52, date: '14 Feb 2026' },
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
                                <span><Heart size={14} color="#e74c3c" /> {product.likes}</span>
                                <span><MessageCircleIcon size={14} color="#5eb5f7" /> {product.comments}</span>
                                <span><EyeIcon size={14} color="#f39c12" /> {product.views}</span>
                                <span><ExternalLink size={14} color="#4dcd5e" /> {product.storeClicks}</span>
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
/*                        MAIN DASHBOARD PAGE                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [expandedMenu, setExpandedMenu] = useState<string | null>('admin-store')
    const [activeSection, setActiveSection] = useState('create-store')

    const toggleMenu = (menuId: string) => {
        setExpandedMenu(expandedMenu === menuId ? null : menuId)
    }

    const handleSubItemClick = (subItemId: string) => {
        setActiveSection(subItemId)
        setSidebarOpen(false)
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'create-store':
                return (
                    <CreateStoreSection
                        onBack={() => setActiveSection('')}
                    />
                )
            case 'store-settings':
                return (
                    <ChangeTemplateSection
                        onBack={() => setActiveSection('')}
                    />
                )
            case 'add-product':
                return (
                    <ProductUploadSection
                        onBack={() => setActiveSection('')}
                        onGoToProducts={() => setActiveSection('all-products')}
                    />
                )
            case 'all-products':
                return (
                    <ProductListSection
                        onBack={() => setActiveSection('')}
                        onAddProduct={() => setActiveSection('add-product')}
                    />
                )
            case 'community-analytics':
                return (
                    <CommunityAnalyticsSection
                        onBack={() => setActiveSection('')}
                    />
                )
            case 'all-orders':
                return <OrdersDashboard />
            default:
                return (
                    <div className="dashboard-welcome">
                        <div className="welcome-icon">
                            <Store size={64} />
                        </div>
                        <h2>Bienvenido al Dashboard</h2>
                        <p>Selecciona una opción del menú para comenzar</p>
                    </div>
                )
        }
    }

    return (
        <div className="dashboard-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <span className="brand-icon">⚡</span>
                        <span className="brand-text">LocalEcomer</span>
                    </div>
                    <button
                        className="sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">MENÚ PRINCIPAL</div>
                    {menuItems.map((item) => (
                        <div key={item.id} className="nav-group">
                            <button
                                className={`nav-group-btn ${expandedMenu === item.id ? 'expanded' : ''}`}
                                onClick={() => item.subItems ? toggleMenu(item.id) : handleSubItemClick(item.id)}
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
                    <button className="sidebar-footer-btn">
                        <HelpCircle size={18} />
                        <span>Ayuda</span>
                    </button>
                    <button className="sidebar-footer-btn">
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Top bar */}
                <header className="dashboard-topbar">
                    <button
                        className="topbar-menu-btn"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="topbar-title">
                        {activeSection === 'create-store'
                            ? 'Crear Tienda'
                            : activeSection === 'store-settings'
                                ? 'Configuración'
                                : activeSection === 'add-product'
                                    ? 'Subir Producto'
                                    : activeSection === 'all-products'
                                        ? 'Mis Productos'
                                        : activeSection === 'all-orders'
                                            ? 'Gestión de Pedidos'
                                            : 'Dashboard'}
                    </h1>
                    <div className="topbar-right">
                        <div className="topbar-avatar">
                            <span>JC</span>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="dashboard-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}
