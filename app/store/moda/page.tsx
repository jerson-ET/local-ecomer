'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Search,
  ShoppingBag,
  Heart,
  Plus,
  X,
  Minus,
  Trash2,
  Camera,
  Upload,
  ImagePlus,
  Star,
  ChevronRight,
  ChevronLeft,
  Menu,
  User,
  Home,
  Grid3X3,
  Tag,
  Check,
  Package,
  Truck,
  Shield,
  SlidersHorizontal,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           TYPES                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  description: string
  category: string
  sizes: string[]
  colors: string[]
  images: string[]
  rating: number
  reviews: number
  inStock: boolean
  isNew?: boolean
  isFeatured?: boolean
}

interface CartItem {
  product: Product
  quantity: number
  selectedSize: string
  selectedColor: string
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           DATA                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const defaultProducts: Product[] = [
  {
    id: 'p1',
    name: 'Vestido Floral de Verano',
    price: 49.99,
    originalPrice: 79.99,
    description: 'Vestido ligero con estampado floral, perfecto para los días cálidos.',
    category: 'Mujer',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#ff6b6b', '#feca57', '#ff9ff3'],
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    isNew: true,
    isFeatured: true,
  },
  {
    id: 'p2',
    name: 'Chaqueta Denim Clásica',
    price: 89.99,
    originalPrice: 129.99,
    description: 'Chaqueta de mezclilla con corte clásico. Duradera y versátil.',
    category: 'Unisex',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#48dbfb', '#2e86de', '#1a1a2e'],
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    isFeatured: true,
  },
  {
    id: 'p3',
    name: 'Sneakers Urban Style',
    price: 119.99,
    originalPrice: 159.99,
    description: 'Zapatillas urbanas con diseño moderno y suela amortiguada.',
    category: 'Calzado',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43'],
    colors: ['#ff9ff3', '#ffffff', '#1a1a2e'],
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
    rating: 4.9,
    reviews: 256,
    inStock: true,
    isNew: true,
  },
  {
    id: 'p4',
    name: 'Bolso Crossbody Premium',
    price: 65.0,
    description: 'Bolso cruzado de cuero sintético premium. Espacioso y elegante.',
    category: 'Accesorios',
    sizes: ['Único'],
    colors: ['#ff6b6b', '#1a1a2e', '#feca57'],
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'],
    rating: 4.7,
    reviews: 67,
    inStock: true,
  },
  {
    id: 'p5',
    name: 'Pantalón Wide Leg',
    price: 59.99,
    originalPrice: 89.99,
    description: 'Pantalón de pierna ancha con cintura alta. Cómodo y elegante.',
    category: 'Mujer',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#1a1a2e', '#feca57', '#48dbfb'],
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'],
    rating: 4.5,
    reviews: 45,
    inStock: true,
  },
  {
    id: 'p6',
    name: 'Gafas de Sol Retro UV400',
    price: 35.0,
    originalPrice: 55.0,
    description: 'Gafas de sol con montura retro. Protección UV400.',
    category: 'Accesorios',
    sizes: ['Único'],
    colors: ['#1a1a2e', '#ff6b6b', '#feca57'],
    images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'],
    rating: 4.4,
    reviews: 198,
    inStock: true,
    isFeatured: true,
  },
  {
    id: 'p7',
    name: 'Camisa Lino Premium',
    price: 55.0,
    originalPrice: 75.0,
    description: 'Camisa de lino con corte relajado. Fresca y sofisticada.',
    category: 'Hombre',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#ffffff', '#48dbfb', '#feca57'],
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'],
    rating: 4.7,
    reviews: 56,
    inStock: true,
    isNew: true,
  },
  {
    id: 'p8',
    name: 'Reloj Minimalista',
    price: 79.99,
    description: 'Reloj con diseño minimalista y correa de cuero genuino.',
    category: 'Accesorios',
    sizes: ['Único'],
    colors: ['#1a1a2e', '#d4af37', '#ffffff'],
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'],
    rating: 4.8,
    reviews: 312,
    inStock: true,
    isFeatured: true,
  },
]

const carouselImages = [
  { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400', label: 'Vestidos' },
  { src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400', label: 'Casual' },
  { src: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', label: 'Street' },
  { src: 'https://images.unsplash.com/photo-1487222477894-f702e4571e7e?w=400', label: 'Sport' },
  { src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400', label: 'Elegant' },
  { src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', label: 'Shopping' },
]

const categories = ['Todo', 'Mujer', 'Hombre', 'Unisex', 'Calzado', 'Accesorios']

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        CAROUSEL COMPONENT                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ImageCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })
  }

  useEffect(() => {
    checkScroll()
  }, [])

  return (
    <section className="vm-carousel-section">
      <div className="vm-carousel-wrapper">
        {canScrollLeft && (
          <button className="vm-carousel-arrow vm-arrow-left" onClick={() => scroll('left')}>
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="vm-carousel-track" ref={scrollRef} onScroll={checkScroll}>
          {carouselImages.map((img, i) => (
            <div key={i} className="vm-carousel-item" style={{ animationDelay: `${i * 0.1}s` }}>
              <img src={img.src} alt={img.label} />
              <span className="vm-carousel-label">{img.label}</span>
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button className="vm-carousel-arrow vm-arrow-right" onClick={() => scroll('right')}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        IMAGE UPLOADER                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
}: {
  images: string[]
  onImagesChange: (imgs: string[]) => void
  maxImages?: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      if (images.length >= maxImages) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const r = ev.target?.result as string
        if (r) onImagesChange([...images, r])
      }
      reader.readAsDataURL(file)
    })
    if (fileRef.current) fileRef.current.value = ''
  }
  return (
    <div className="vm-image-uploader">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="vm-file-input"
      />
      <div className="vm-upload-grid">
        {images.map((img, i) => (
          <div key={i} className="vm-upload-preview">
            <img src={img} alt="" />
            <button
              className="vm-upload-remove"
              onClick={() => onImagesChange(images.filter((_, idx) => idx !== i))}
            >
              <X size={14} />
            </button>
            {i === 0 && <span className="vm-upload-main">Principal</span>}
          </div>
        ))}
        {images.length < maxImages && (
          <button className="vm-upload-add" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={24} />
            <span>Agregar foto</span>
            <span className="vm-upload-hint">Desde galería</span>
          </button>
        )}
      </div>
      <p className="vm-upload-count">
        {images.length}/{maxImages} fotos
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        ADD PRODUCT MODAL                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AddProductModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Product) => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Mujer')
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const sizeOpts = [
    'XS',
    'S',
    'M',
    'L',
    'XL',
    'XXL',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    'Único',
  ]
  const presetColors = [
    '#ff6b6b',
    '#feca57',
    '#48dbfb',
    '#ff9ff3',
    '#1a1a2e',
    '#ffffff',
    '#2ecc71',
    '#e17055',
  ]

  const handleSubmit = () => {
    if (!name || !price || images.length === 0) return
    onAdd({
      id: `c-${Date.now()}`,
      name,
      price: parseFloat(price),
      ...(originalPrice ? { originalPrice: parseFloat(originalPrice) } : {}),
      description,
      category,
      sizes: sizes.length ? sizes : ['Único'],
      colors: colors.length ? colors : ['#1a1a2e'],
      images,
      rating: 5.0,
      reviews: 0,
      inStock: true,
      isNew: true,
    })
    onClose()
  }

  return (
    <div className="vm-modal-overlay" onClick={onClose}>
      <div className="vm-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vm-add-modal-header">
          <h2>Agregar Producto</h2>
          <button className="vm-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="vm-add-modal-body">
          <div className="vm-form-section">
            <h3>
              <Camera size={16} /> Fotos del producto
            </h3>
            <ImageUploader images={images} onImagesChange={setImages} />
          </div>
          <div className="vm-form-section">
            <h3>
              <Tag size={16} /> Información básica
            </h3>
            <div className="vm-form-field">
              <label>Nombre del producto *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Vestido de noche"
                className="vm-input"
              />
            </div>
            <div className="vm-form-row">
              <div className="vm-form-field">
                <label>Precio *</label>
                <div className="vm-price-input">
                  <span className="vm-currency">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="vm-input"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="vm-form-field">
                <label>Precio anterior</label>
                <div className="vm-price-input">
                  <span className="vm-currency">$</span>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0.00"
                    className="vm-input"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <div className="vm-form-field">
              <label>Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu producto..."
                className="vm-textarea"
                rows={3}
              />
            </div>
            <div className="vm-form-field">
              <label>Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="vm-select"
              >
                {categories
                  .filter((c) => c !== 'Todo')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="vm-form-section">
            <h3>
              <SlidersHorizontal size={16} /> Tallas
            </h3>
            <div className="vm-size-options">
              {sizeOpts.map((s) => (
                <button
                  key={s}
                  className={`vm-size-option ${sizes.includes(s) ? 'selected' : ''}`}
                  onClick={() =>
                    setSizes((prev) =>
                      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                    )
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="vm-form-section">
            <h3>
              <Grid3X3 size={16} /> Colores
            </h3>
            <div className="vm-color-options">
              {presetColors.map((c) => (
                <button
                  key={c}
                  className={`vm-color-option ${colors.includes(c) ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() =>
                    setColors((prev) =>
                      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                    )
                  }
                >
                  {colors.includes(c) && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="vm-add-modal-footer">
          <button className="vm-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="vm-btn-publish"
            onClick={handleSubmit}
            disabled={!name || !price || images.length === 0}
          >
            <Upload size={16} /> Publicar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        PRODUCT DETAIL                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ProductDetail({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product
  onClose: () => void
  onAddToCart: (p: Product, s: string, c: string) => void
}) {
  const [selSize, setSelSize] = useState(product.sizes[0] ?? '')
  const [selColor, setSelColor] = useState(product.colors[0] ?? '')
  const [liked, setLiked] = useState(false)
  const disc = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="vm-modal-overlay" onClick={onClose}>
      <div className="vm-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="vm-detail-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="vm-detail-content">
          <div className="vm-detail-gallery">
            <div className="vm-detail-main-image">
              <img src={product.images[0]} alt={product.name} />
              {disc > 0 && <span className="vm-detail-discount">-{disc}%</span>}
              {product.isNew && <span className="vm-detail-new">NUEVO</span>}
              <button
                className={`vm-detail-heart ${liked ? 'liked' : ''}`}
                onClick={() => setLiked(!liked)}
              >
                <Heart size={20} fill={liked ? '#ff6b6b' : 'none'} />
              </button>
            </div>
          </div>
          <div className="vm-detail-info">
            <div className="vm-detail-rating">
              <div className="vm-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    fill={s <= Math.round(product.rating) ? '#feca57' : 'none'}
                    stroke={s <= Math.round(product.rating) ? '#feca57' : '#ccc'}
                  />
                ))}
              </div>
              <span>
                {product.rating} ({product.reviews} reseñas)
              </span>
            </div>
            <h2 className="vm-detail-name">{product.name}</h2>
            <div className="vm-detail-pricing">
              <span className="vm-detail-price">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="vm-detail-original">${product.originalPrice.toFixed(2)}</span>
              )}
              {disc > 0 && (
                <span className="vm-detail-save">
                  Ahorras ${(product.originalPrice! - product.price).toFixed(2)}
                </span>
              )}
            </div>
            <p className="vm-detail-desc">{product.description}</p>
            <div className="vm-detail-section">
              <h4>Color</h4>
              <div className="vm-detail-colors">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    className={`vm-detail-color ${selColor === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setSelColor(c)}
                  >
                    {selColor === c && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="vm-detail-section">
              <h4>Talla</h4>
              <div className="vm-detail-sizes">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    className={`vm-detail-size ${selSize === s ? 'selected' : ''}`}
                    onClick={() => setSelSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="vm-trust-badges">
              <div className="vm-trust-badge">
                <Truck size={16} />
                <span>Envío gratis</span>
              </div>
              <div className="vm-trust-badge">
                <Shield size={16} />
                <span>Garantía 30d</span>
              </div>
              <div className="vm-trust-badge">
                <Package size={16} />
                <span>Devolución fácil</span>
              </div>
            </div>
            <button
              className="vm-btn-add-to-cart"
              onClick={() => onAddToCart(product, selSize, selColor)}
            >
              <ShoppingBag size={18} /> Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        CART DRAWER                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CartDrawer({
  items,
  onClose,
  onUpdateQty,
  onRemove,
}: {
  items: CartItem[]
  onClose: () => void
  onUpdateQty: (i: number, q: number) => void
  onRemove: (i: number) => void
}) {
  const total = items.reduce((s, it) => s + it.product.price * it.quantity, 0)
  const count = items.reduce((s, it) => s + it.quantity, 0)
  return (
    <div className="vm-modal-overlay" onClick={onClose}>
      <div className="vm-cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="vm-cart-header">
          <h2>
            <ShoppingBag size={20} /> Mi Carrito ({count})
          </h2>
          <button className="vm-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="vm-cart-body">
          {items.length === 0 ? (
            <div className="vm-cart-empty">
              <ShoppingBag size={48} />
              <h3>Carrito vacío</h3>
              <p>Agrega productos</p>
              <button className="vm-btn-continue" onClick={onClose}>
                Seguir comprando
              </button>
            </div>
          ) : (
            items.map((it, i) => (
              <div key={i} className="vm-cart-item">
                <div className="vm-cart-item-image">
                  <img src={it.product.images[0]} alt="" />
                </div>
                <div className="vm-cart-item-info">
                  <h4>{it.product.name}</h4>
                  <p className="vm-cart-item-variant">
                    Talla: {it.selectedSize} ·{' '}
                    <span className="vm-cart-color-dot" style={{ background: it.selectedColor }} />
                  </p>
                  <div className="vm-cart-item-bottom">
                    <span className="vm-cart-item-price">
                      ${(it.product.price * it.quantity).toFixed(2)}
                    </span>
                    <div className="vm-cart-qty">
                      <button onClick={() => onUpdateQty(i, Math.max(1, it.quantity - 1))}>
                        <Minus size={14} />
                      </button>
                      <span>{it.quantity}</span>
                      <button onClick={() => onUpdateQty(i, it.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <button className="vm-cart-remove" onClick={() => onRemove(i)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="vm-cart-footer">
            <div className="vm-cart-summary">
              <div className="vm-cart-summary-row">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="vm-cart-summary-row">
                <span>Envío</span>
                <span className="vm-free">GRATIS</span>
              </div>
              <div className="vm-cart-summary-row vm-cart-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button className="vm-btn-checkout">Proceder al pago</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        MAIN STORE                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ModaStorePage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCat, setSelectedCat] = useState('Todo')
  const [searchQ, setSearchQ] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [isOwner] = useState(true)
  const [notif, setNotif] = useState<string | null>(null)

  const cartCount = cart.reduce((s, it) => s + it.quantity, 0)
  const filtered = products.filter((p) => {
    const mc = selectedCat === 'Todo' || p.category === selectedCat
    const ms = p.name.toLowerCase().includes(searchQ.toLowerCase())
    return mc && ms
  })

  const notify = (msg: string) => {
    setNotif(msg)
    setTimeout(() => setNotif(null), 2500)
  }

  const addToCart = (p: Product, size: string, color: string) => {
    const idx = cart.findIndex(
      (it) => it.product.id === p.id && it.selectedSize === size && it.selectedColor === color
    )
    if (idx >= 0) {
      const u = [...cart]
      const item = u[idx]
      if (item) {
        item.quantity++
      }
      setCart(u)
    } else setCart([...cart, { product: p, quantity: 1, selectedSize: size, selectedColor: color }])
    setSelProduct(null)
    notify('¡Agregado al carrito!')
  }

  return (
    <div className="vm-store">
      {notif && (
        <div className="vm-toast">
          <Check size={16} />
          {notif}
        </div>
      )}

      {/* ══════ HEADER ══════ */}
      <header className="vm-header">
        <div className="vm-header-inner">
          <div className="vm-header-left">
            <button className="vm-menu-toggle">
              <Menu size={22} />
            </button>
            <div className="vm-brand">
              <span className="vm-brand-accent">V</span>
              <span className="vm-brand-name">IBRANT</span>
              <span className="vm-brand-dot">.</span>
            </div>
          </div>
          <div className="vm-header-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
          <div className="vm-header-right">
            <button className="vm-header-icon">
              <Heart size={20} />
            </button>
            <button className="vm-header-icon vm-cart-btn" onClick={() => setShowCart(true)}>
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="vm-cart-count">{cartCount}</span>}
            </button>
            <button className="vm-header-icon">
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ══════ BANNER WITH PHOTO ══════ */}
      <section className="vm-banner">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200"
          alt="Fashion Banner"
          className="vm-banner-img"
        />
        <div className="vm-banner-overlay">
          <span className="vm-banner-tag">NUEVA COLECCIÓN 2026</span>
          <h1 className="vm-banner-title">
            Descubre tu
            <br />
            <span>estilo único</span>
          </h1>
          <p className="vm-banner-desc">Hasta 40% de descuento en toda la colección</p>
          <button className="vm-banner-btn">
            Comprar ahora <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ══════ IMAGE CAROUSEL ══════ */}
      <ImageCarousel />

      {/* ══════ CATEGORY FILTERS ══════ */}
      <section className="vm-categories">
        <div className="vm-section-header">
          <h2>Categorías</h2>
          <span className="vm-product-count">{filtered.length} productos</span>
        </div>
        <div className="vm-categories-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`vm-category-chip ${selectedCat === cat ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ══════ PRODUCTS GRID ══════ */}
      <section className="vm-products-section">
        <div className="vm-products-grid">
          {isOwner && (
            <button className="vm-add-product-card" onClick={() => setShowAdd(true)}>
              <div className="vm-add-product-icon">
                <Plus size={32} />
              </div>
              <span className="vm-add-product-text">Agregar producto</span>
              <span className="vm-add-product-hint">Sube fotos desde tu galería</span>
            </button>
          )}
          {filtered.map((p) => (
            <div key={p.id} className="vm-product-card" onClick={() => setSelProduct(p)}>
              <div className="vm-product-image-wrap">
                <img src={p.images[0]} alt={p.name} />
                <div className="vm-product-badges">
                  {p.isNew && <span className="vm-product-badge vm-badge-new">NEW</span>}
                  {p.originalPrice && (
                    <span className="vm-product-badge vm-badge-sale">
                      -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="vm-product-quick-actions">
                  <button
                    className="vm-quick-action"
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(p, p.sizes[0] ?? '', p.colors[0] ?? '')
                    }}
                  >
                    <ShoppingBag size={16} />
                  </button>
                  <button className="vm-quick-action">
                    <Heart size={16} />
                  </button>
                </div>
              </div>
              <div className="vm-product-card-info">
                <div className="vm-product-card-rating">
                  <Star size={12} fill="#feca57" stroke="#feca57" />
                  <span>{p.rating}</span>
                  <span className="vm-review-count">({p.reviews})</span>
                </div>
                <h3 className="vm-product-card-name">{p.name}</h3>
                <div className="vm-product-card-pricing">
                  <span className="vm-product-price">${p.price.toFixed(2)}</span>
                  {p.originalPrice && (
                    <span className="vm-product-original">${p.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                <div className="vm-product-card-colors">
                  {p.colors.slice(0, 4).map((c, i) => (
                    <span key={i} className="vm-product-color-dot" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="vm-footer">
        <div className="vm-footer-content">
          <div className="vm-brand">
            <span className="vm-brand-accent">V</span>
            <span className="vm-brand-name">IBRANT</span>
            <span className="vm-brand-dot">.</span>
          </div>
          <p className="vm-footer-text">Tu destino de moda favorito</p>
          <p className="vm-footer-copy">© 2026 VIBRANT - Powered by LocalEcomer</p>
        </div>
      </footer>

      {/* ══════ MOBILE NAV ══════ */}
      <nav className="vm-bottom-nav">
        <button className="vm-bottom-item active">
          <Home size={20} />
          <span>Inicio</span>
        </button>
        <button className="vm-bottom-item">
          <Grid3X3 size={20} />
          <span>Catálogo</span>
        </button>
        {isOwner && (
          <button className="vm-bottom-item vm-bottom-add" onClick={() => setShowAdd(true)}>
            <div className="vm-bottom-add-circle">
              <Plus size={24} />
            </div>
          </button>
        )}
        <button className="vm-bottom-item" onClick={() => setShowCart(true)}>
          <div className="vm-bottom-cart-wrap">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="vm-bottom-badge">{cartCount}</span>}
          </div>
          <span>Carrito</span>
        </button>
        <button className="vm-bottom-item">
          <User size={20} />
          <span>Perfil</span>
        </button>
      </nav>

      {/* ══════ MODALS ══════ */}
      {showCart && (
        <CartDrawer
          items={cart}
          onClose={() => setShowCart(false)}
          onUpdateQty={(i, q) => {
            const u = [...cart]
            const item = u[i]
            if (item) {
              item.quantity = q
            }
            setCart(u)
          }}
          onRemove={(i) => setCart(cart.filter((_, idx) => idx !== i))}
        />
      )}
      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onAdd={(p) => {
            setProducts([p, ...products])
            notify('¡Producto publicado!')
          }}
        />
      )}
      {selProduct && (
        <ProductDetail
          product={selProduct}
          onClose={() => setSelProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  )
}
