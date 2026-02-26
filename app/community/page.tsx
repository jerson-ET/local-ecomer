/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                   COMUNIDAD LOCALECOMER — FEED DE PRODUCTOS                  */
/*                                                                              */
/*   Feed comunitario con filtrado por categorías y búsqueda inteligente        */
/*   tipo "fuzzy" para encontrar productos aunque se escriban mal.              */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client'

import './community.css'

import React, { useState, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Heart,
  MessageCircle,
  ExternalLink,
  Store,
  Send,
  X,
  ShoppingBag,
  Eye,
  Bookmark,
  BookmarkCheck,
  Clock,
  TrendingUp,
  Utensils,
  Shirt,
  Home,
  Smartphone,
  Dog,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'

// Importamos nuestra nueva utilidad de búsqueda inteligente
// NOTA: Si este archivo no existe, asegúrate de haberlo creado en el paso anterior.
// Si da error de importación, crearemos una versión local simplificada aquí.
import { fuzzySearch } from '@/lib/fuzzySearch'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              TYPES                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

type CategoryId =
  | 'all'
  | 'moda'
  | 'hogar'
  | 'tecnologia'
  | 'mascotas'
  | 'alimentos'
  | 'belleza'
  | 'otros'

interface ProductOwner {
  id: string
  storeName: string
  storeColor: string
  storeUrl: string
  avatar?: string
}

interface Comment {
  id: string
  userId: string
  userName: string
  userColor: string
  content: string
  timestamp: Date
  isOwner?: boolean
}

interface CommunityPost {
  id: string
  owner: ProductOwner
  category: CategoryId // Nuevo campo para filtrado
  productName: string
  productImage: string
  price: number
  originalPrice: number
  discount: number
  description: string
  likes: number
  liked: boolean
  saved: boolean
  comments: Comment[]
  views: number
  storeClicks: number
  timestamp: Date
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                           DEMO DATA                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

const today = new Date('2026-02-26T10:00:00')
const t = (h: number, m: number) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m)

const DEMO_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    owner: {
      id: 'o1',
      storeName: 'SneakerVault',
      storeColor: '#6c5ce7',
      storeUrl: '/store/calzado',
    },
    category: 'moda',
    productName: 'Air Jordan 1 Retro High OG',
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
    price: 459000,
    originalPrice: 689000,
    discount: 33,
    description:
      '🔥 Recién llegadas! Edición limitada. Disponibles en todas las tallas del 38 al 44. Envío gratis por compras superiores a $200,000 🚚',
    likes: 127,
    liked: false,
    saved: false,
    views: 1523,
    storeClicks: 89,
    comments: [
      {
        id: 'c1',
        userId: 'u1',
        userName: 'Carlos M.',
        userColor: '#e17055',
        content: 'Esas Jordan están increíbles 🔥🔥 ¿tienen talla 42?',
        timestamp: t(10, 8),
      },
      {
        id: 'c2',
        userId: 'o1',
        userName: 'SneakerVault',
        userColor: '#6c5ce7',
        content: '¡Sí Carlos! Tenemos todas las tallas. Envío gratis 🚚',
        timestamp: t(10, 9),
        isOwner: true,
      },
    ],
    timestamp: t(10, 5),
  },
  {
    id: 'p2',
    owner: { id: 'o2', storeName: 'Cap Kings', storeColor: '#00b894', storeUrl: '/store/gorras' },
    category: 'moda',
    productName: 'Gorra Snapback NY Yankees Edición Gold',
    productImage: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600',
    price: 69000,
    originalPrice: 125000,
    discount: 45,
    description:
      '👑 Nueva colección! Solo por este fin de semana. Edición limitada con bordado dorado premium.',
    likes: 84,
    liked: true,
    saved: false,
    views: 967,
    storeClicks: 52,
    comments: [
      {
        id: 'c5',
        userId: 'u3',
        userName: 'Diego Torres',
        userColor: '#00cec9',
        content: '¡Esa gorra está brutal! La quiero 🔥',
        timestamp: t(10, 38),
      },
    ],
    timestamp: t(10, 35),
  },
  {
    id: 'p3',
    owner: {
      id: 'o3',
      storeName: 'Beauty Glow',
      storeColor: '#ff69b4',
      storeUrl: '/store/belleza',
    },
    category: 'belleza',
    productName: 'Kit Completo Skincare Coreano 7 Pasos',
    productImage: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
    price: 89000,
    originalPrice: 178000,
    discount: 50,
    description:
      '💄 ¡OFERTA FLASH! 50% de descuento en toda la línea de skincare. Solo hoy! 🌸\n\nUsa el código: BEAUTY50',
    likes: 215,
    liked: false,
    saved: true,
    views: 2341,
    storeClicks: 156,
    comments: [
      {
        id: 'c7',
        userId: 'u5',
        userName: 'Valentina R.',
        userColor: '#a29bfe',
        content: 'Wow estos productos se ven increíbles 😍 ¿Alguien los ha probado?',
        timestamp: t(10, 48),
      },
    ],
    timestamp: t(10, 45),
  },
  {
    id: 'p4',
    owner: {
      id: 'o4',
      storeName: 'TechZone',
      storeColor: '#0984e3',
      storeUrl: '/store/tecnologia',
    },
    category: 'tecnologia',
    productName: 'Audífonos Inalámbricos Pro con Cancelación de Ruido',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    price: 189000,
    originalPrice: 250000,
    discount: 24,
    description:
      '🎧 Sumérgete en tu música con la mejor cancelación de ruido activa. Batería de 24 horas y carga rápida.',
    likes: 156,
    liked: false,
    saved: true,
    views: 890,
    storeClicks: 67,
    comments: [],
    timestamp: t(9, 30),
  },
  {
    id: 'pet-4',
    owner: { id: 'o5', storeName: 'PetHappy', storeColor: '#fdcb6e', storeUrl: '/store/mascotas' },
    category: 'mascotas',
    productName: 'Cama Ortopédica para Perros Grandes',
    productImage: 'https://images.unsplash.com/photo-1541781777631-faaf29752167?w=600',
    price: 120000,
    originalPrice: 160000,
    discount: 25,
    description:
      '🐶 El descanso que tu peludo merece. Espuma viscoelástica y funda lavable. Ideal para perros mayores o con problemas articulares.',
    likes: 92,
    liked: true,
    saved: false,
    views: 450,
    storeClicks: 30,
    comments: [
      {
        id: 'c9',
        userId: 'u8',
        userName: 'Ana P.',
        userColor: '#e17055',
        content: '¿Tienen para gatos también?',
        timestamp: t(11, 20),
      },
    ],
    timestamp: t(8, 15),
  },
  {
    id: 'p6',
    owner: {
      id: 'o6',
      storeName: 'Delicias Caseras',
      storeColor: '#e17055',
      storeUrl: '/store/alimentos',
    },
    category: 'alimentos',
    productName: 'Pack de Mermeladas Artesanales',
    productImage: 'https://images.unsplash.com/photo-1599321955726-e04842d994e7?w=600',
    price: 25000,
    originalPrice: 30000,
    discount: 16,
    description:
      '🍓 Hechas con fruta 100% natural, sin conservantes. Sabores: Fresa, Mora y Piña. ¡Perfectas para el desayuno!',
    likes: 45,
    liked: false,
    saved: false,
    views: 210,
    storeClicks: 15,
    comments: [],
    timestamp: t(8, 0),
  },
]

const CATEGORIES: { id: CategoryId; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todos', icon: <ShoppingBag size={15} /> },
  { id: 'moda', label: 'Moda', icon: <Shirt size={15} /> },
  { id: 'hogar', label: 'Hogar', icon: <Home size={15} /> },
  { id: 'tecnologia', label: 'Tecnología', icon: <Smartphone size={15} /> },
  { id: 'mascotas', label: 'Mascotas', icon: <Dog size={15} /> },
  { id: 'alimentos', label: 'Alimentos', icon: <Utensils size={15} /> },
  { id: 'belleza', label: 'Belleza', icon: <Sparkles size={15} /> },
  { id: 'otros', label: 'Otros', icon: <MoreHorizontal size={15} /> },
]

/* ─────────────────────────────────────────────────────────────────────────── */
/*                         HELPERS                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function timeAgo(date: Date) {
  const now = new Date('2026-02-26T10:30:00')
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1 || diffMin < 0) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `hace ${diffD}d`
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         COMPONENTE PRINCIPAL                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CommunityPage() {
  /* ── State ── */
  const [posts, setPosts] = useState<CommunityPost[]>(DEMO_POSTS)
  const [expandedComments, setExpandedComments] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  // Search & Filter State
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all')
  const [sortBy, setSortBy] = useState<'new' | 'trending'>('new')

  /* ── Refs ── */
  const feedRef = useRef<HTMLDivElement>(null)
  const commentInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  /* ── Handlers ── */
  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1,
        }
      })
    )
  }, [])

  const toggleSave = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        return { ...p, saved: !p.saved }
      })
    )
  }, [])

  const toggleComments = useCallback((postId: string) => {
    setExpandedComments((prev) => (prev === postId ? null : postId))
    setTimeout(() => {
      commentInputRefs.current[postId]?.focus()
    }, 100)
  }, [])

  const submitComment = useCallback(
    (postId: string) => {
      const text = (commentInputs[postId] || '').trim()
      if (!text) return

      const newComment: Comment = {
        id: `c-${Date.now()}`,
        userId: 'me',
        userName: 'Tú',
        userColor: '#5eb5f7',
        content: text,
        timestamp: new Date(),
      }

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p
          return { ...p, comments: [...p.comments, newComment] }
        })
      )

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
    },
    [commentInputs]
  )

  const handleCommentKeyDown = useCallback(
    (e: React.KeyboardEvent, postId: string) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        submitComment(postId)
      }
    },
    [submitComment]
  )

  const trackStoreClick = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        return { ...p, storeClicks: p.storeClicks + 1 }
      })
    )
  }, [])

  /* ── Smart Filtering Logic ── */
  const filteredPosts = useMemo(() => {
    let result = posts

    // 1. Filtrar por búsqueda inteligente (Fuzzy Search)
    // El algoritmo "adivina" qué quiere el usuario incluso con errores ortográficos
    if (searchQuery.length > 1) {
      // Usamos nuestra utilidad personalizada de fuzzy search
      // Buscamos en nombre de producto y descripción
      result = fuzzySearch(result, searchQuery, ['productName', 'description'])
    }
    // 2. Si no hay búsqueda, aplicar filtro de categoría normal
    else if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory)
    }

    // 3. Ordenamiento
    // Si hay búsqueda, el fuzzySearch ya ordena por relevancia (score), así que respetamos ese orden.
    // Si no hay búsqueda, ordenamos por fecha o popularidad.
    if (searchQuery.length <= 1) {
      result = [...result].sort((a, b) => {
        if (sortBy === 'trending') return b.likes - a.likes
        // default: new
        return b.timestamp.getTime() - a.timestamp.getTime()
      })
    }

    return result
  }, [posts, searchQuery, activeCategory, sortBy])

  /* ════════════════════════════════════════════════════════════════════════ */
  /*                              RENDER                                     */
  /* ════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="cm-app">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*                          HEADER                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      <div className="cm-header">
        <div className="cm-header-info">
          <div className="cm-header-name">
            Comunidad
            {activeCategory !== 'all' && (
              <span className="cm-header-cat-badge">
                • {CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </span>
            )}
          </div>
        </div>

        <div className="cm-header-actions">
          <button
            className={`cm-header-btn ${showSearch ? 'active' : ''}`}
            onClick={() => {
              setShowSearch(!showSearch)
              if (!showSearch)
                setTimeout(() => document.getElementById('cm-search-input')?.focus(), 100)
            }}
          >
            <Search size={22} />
          </button>
        </div>
      </div>

      {/* Search Bar Overlay */}
      {showSearch && (
        <div className="cm-search-bar">
          <Search size={18} className="cm-search-icon" />
          <input
            id="cm-search-input"
            type="text"
            className="cm-search-input"
            placeholder="Buscar... (ej: 'zapatillas', 'comida', 'regalos')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <button className="cm-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*                       CATEGORY TABS                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      <div className="cm-categories-scroll">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`cm-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat.id)
              setSearchQuery('') // Limpiar búsqueda al cambiar categoría
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Sort & Status Bar */}
      <div className="cm-feed-status-bar">
        <span>
          {searchQuery ? (
            <>Resultados para "{searchQuery}"</>
          ) : (
            <>
              {activeCategory === 'all'
                ? 'Explorar todo'
                : CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </>
          )}
        </span>

        {!searchQuery && (
          <div className="cm-sort-toggles">
            <button
              className={`cm-sort-btn ${sortBy === 'new' ? 'active' : ''}`}
              onClick={() => setSortBy('new')}
            >
              <Clock size={14} /> Recientes
            </button>
            <button
              className={`cm-sort-btn ${sortBy === 'trending' ? 'active' : ''}`}
              onClick={() => setSortBy('trending')}
            >
              <TrendingUp size={14} /> Populares
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*                      PRODUCT FEED                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      <div className="cm-feed" ref={feedRef}>
        {/* Promotional banner only on 'All' view */}
        {activeCategory === 'all' && !searchQuery && (
          <div className="cm-promo-banner">
            <div className="cm-promo-text">
              <span className="cm-promo-emoji">🛍️</span>
              <div>
                <strong>¿Vendes productos?</strong>
                <span>Publica gratis en la comunidad</span>
              </div>
            </div>
            <Link href="/dashboard" className="cm-promo-btn">
              Ir al Panel
            </Link>
          </div>
        )}

        {/* Posts */}
        {filteredPosts.map((post) => (
          <article key={post.id} className="cm-post">
            {/* Post Header */}
            <div className="cm-post-header">
              <div className="cm-post-avatar" style={{ background: post.owner.storeColor }}>
                <Store size={16} />
              </div>
              <div className="cm-post-store-info">
                <div className="cm-post-store-name">
                  {post.owner.storeName}
                  <span className="cm-badge-cat">
                    {CATEGORIES.find((c) => c.id === post.category)?.label}
                  </span>
                </div>
                <div className="cm-post-time">{timeAgo(post.timestamp)}</div>
              </div>
              <Link
                href={`${post.owner.storeUrl}?product=${post.id}`}
                className="cm-post-visit-btn"
                onClick={() => trackStoreClick(post.id)}
              >
                <ExternalLink size={14} />
                Ver más
              </Link>
            </div>

            {/* Product Image */}
            <Link
              href={`${post.owner.storeUrl}?product=${post.id}`}
              className="cm-post-image-wrapper"
              onClick={() => trackStoreClick(post.id)}
            >
              <img src={post.productImage} alt={post.productName} className="cm-post-image" />
              {post.discount > 0 && <span className="cm-post-discount">-{post.discount}%</span>}
            </Link>

            {/* Product Info */}
            <div className="cm-post-product-info">
              <div className="cm-post-product-name">{post.productName}</div>
              {post.description && (
                <div className="cm-post-description-text">{post.description}</div>
              )}

              <div className="cm-post-pricing">
                <span className="cm-post-price">{formatCOP(post.price)}</span>
                {post.originalPrice > post.price && (
                  <span className="cm-post-original">{formatCOP(post.originalPrice)}</span>
                )}
              </div>

              <Link
                href={`${post.owner.storeUrl}?product=${post.id}`}
                className="cm-post-cta"
                onClick={() => trackStoreClick(post.id)}
              >
                <Eye size={16} />
                Ver detalles
              </Link>
            </div>

            {/* Actions */}
            <div className="cm-post-actions">
              <button
                className={`cm-action-btn ${post.liked ? 'liked' : ''}`}
                onClick={() => toggleLike(post.id)}
              >
                <Heart size={20} fill={post.liked ? '#e74c3c' : 'none'} />
                <span>{post.likes > 0 ? formatNumber(post.likes) : ''}</span>
              </button>
              <button
                className={`cm-action-btn ${expandedComments === post.id ? 'active' : ''}`}
                onClick={() => toggleComments(post.id)}
              >
                <MessageCircle size={20} />
                <span>{post.comments.length > 0 ? post.comments.length : ''}</span>
              </button>
              <div className="cm-spacer" />
              <button
                className={`cm-action-btn save ${post.saved ? 'saved' : ''}`}
                onClick={() => toggleSave(post.id)}
              >
                {post.saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
              </button>
            </div>

            {/* Interaction Details */}
            {post.likes > 0 && (
              <div className="cm-post-likes-text">
                Le gusta a <strong>{formatNumber(post.likes)} personas</strong>
              </div>
            )}

            {/* Comments Section */}
            {expandedComments === post.id && (
              <div className="cm-comments-section">
                <div className="cm-comments-list">
                  {post.comments.length === 0 && (
                    <div className="cm-no-comments">Sé el primero en comentar 👇</div>
                  )}
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`cm-comment ${comment.isOwner ? 'is-owner' : ''}`}
                    >
                      <span className="cm-comment-user" style={{ color: comment.userColor }}>
                        {comment.userName}
                        {comment.isOwner && <span className="cm-owner-tag">Vendedor</span>}:
                      </span>
                      <span className="cm-comment-content">{comment.content}</span>
                    </div>
                  ))}
                </div>

                <div className="cm-comment-input-area">
                  <input
                    ref={(el) => {
                      commentInputRefs.current[post.id] = el
                    }}
                    type="text"
                    className="cm-comment-input"
                    placeholder="Deja un comentario..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => handleCommentKeyDown(e, post.id)}
                  />
                  <button
                    className="cm-comment-send"
                    onClick={() => submitComment(post.id)}
                    disabled={!(commentInputs[post.id] || '').trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Comments Preview Button */}
            {expandedComments !== post.id && post.comments.length > 0 && (
              <button className="cm-comments-preview-btn" onClick={() => toggleComments(post.id)}>
                Ver los {post.comments.length} comentarios
              </button>
            )}
          </article>
        ))}

        {/* Empty state */}
        {filteredPosts.length === 0 && (
          <div className="cm-empty">
            <Search size={48} />
            <h3>Sin resultados</h3>
            <p>No encontramos productos para "{searchQuery || activeCategory}"</p>
            {searchQuery && (
              <button className="cm-empty-btn" onClick={() => setSearchQuery('')}>
                Ver todo
              </button>
            )}
          </div>
        )}

        <div className="cm-bottom-spacer" />
      </div>
    </div>
  )
}
