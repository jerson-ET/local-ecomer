/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    MARKETPLACE - SISTEMA CENTRALIZADO                        */
/*                                                                              */
/*   Los productos con descuento de cada tienda se agregan automáticamente     */
/*   al marketplace. Al hacer clic → redirige a la tienda original.            */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface MarketplaceProduct {
    id: string
    name: string
    price: number
    originalPrice: number
    discount: number
    image: string
    category: string
    rating: number
    reviews: string
    storeName: string
    storeUrl: string
    storeTemplate: string
    storeColor: string
    badge?: string
}

export type MarketplaceCategory =
    | 'Todos'
    | 'Moda'
    | 'Tecnología'
    | 'Calzado'
    | 'Gaming'
    | 'Hogar'
    | 'Deportes'
    | 'Belleza'
    | 'Accesorios'
    | 'Alimentos'
    | 'Motos'
    | 'Joyería'

export const marketplaceCategories: MarketplaceCategory[] = [
    'Todos',
    'Moda',
    'Tecnología',
    'Calzado',
    'Gaming',
    'Hogar',
    'Deportes',
    'Belleza',
    'Accesorios',
    'Alimentos',
    'Motos',
    'Joyería',
]

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Productos con descuento de diferentes tiendas                               */
/*  En producción: se extraerían de la BD / API de cada tienda                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export const marketplaceProducts: MarketplaceProduct[] = [
    // ── MODA (Vibrant Market) ──────────────────────────────────────────
    {
        id: 'mp-1',
        name: 'Chaqueta Oversize Denim Lavada',
        price: 89900,
        originalPrice: 159900,
        discount: 44,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        category: 'Moda',
        rating: 4.8,
        reviews: '234',
        storeName: 'Vibrant Market',
        storeUrl: '/store/moda',
        storeTemplate: 'moda',
        storeColor: '#ff6b6b',
        badge: 'TOP SELLER',
    },
    {
        id: 'mp-2',
        name: 'Vestido Midi Satinado Elegante',
        price: 65000,
        originalPrice: 120000,
        discount: 46,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
        category: 'Moda',
        rating: 4.9,
        reviews: '189',
        storeName: 'Vibrant Market',
        storeUrl: '/store/moda',
        storeTemplate: 'moda',
        storeColor: '#ff6b6b',
    },
    // ── CALZADO (Sneaker Vault) ────────────────────────────────────────
    {
        id: 'mp-3',
        name: 'Air Jordan 1 Retro High OG',
        price: 459000,
        originalPrice: 689000,
        discount: 33,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        category: 'Calzado',
        rating: 4.9,
        reviews: '1.2k',
        storeName: 'Sneaker Vault',
        storeUrl: '/store/calzado',
        storeTemplate: 'calzado',
        storeColor: '#6c5ce7',
        badge: 'HOT 🔥',
    },
    {
        id: 'mp-4',
        name: 'Nike Dunk Low Retro Panda',
        price: 289000,
        originalPrice: 459000,
        discount: 37,
        image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400',
        category: 'Calzado',
        rating: 4.7,
        reviews: '856',
        storeName: 'Sneaker Vault',
        storeUrl: '/store/calzado',
        storeTemplate: 'calzado',
        storeColor: '#6c5ce7',
    },
    // ── TECNOLOGÍA (Tech Store) ────────────────────────────────────────
    {
        id: 'mp-5',
        name: 'iPhone 15 Pro Max 256GB',
        price: 3899000,
        originalPrice: 5499000,
        discount: 29,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
        category: 'Tecnología',
        rating: 4.9,
        reviews: '2.3k',
        storeName: 'Tech Zone',
        storeUrl: '/store/celulares',
        storeTemplate: 'celulares',
        storeColor: '#00b894',
        badge: 'MEGA OFERTA',
    },
    {
        id: 'mp-6',
        name: 'Samsung Galaxy Buds FE Pro',
        price: 149000,
        originalPrice: 299000,
        discount: 50,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400',
        category: 'Tecnología',
        rating: 4.6,
        reviews: '432',
        storeName: 'Tech Zone',
        storeUrl: '/store/celulares',
        storeTemplate: 'celulares',
        storeColor: '#00b894',
    },
    // ── GAMING (Gaming Zone) ───────────────────────────────────────────
    {
        id: 'mp-7',
        name: 'PlayStation 5 DualSense Edge Controller',
        price: 489000,
        originalPrice: 749000,
        discount: 35,
        image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
        category: 'Gaming',
        rating: 4.8,
        reviews: '1.5k',
        storeName: 'Gaming Zone',
        storeUrl: '/store/gaming',
        storeTemplate: 'gaming',
        storeColor: '#a855f7',
        badge: 'GAMER DEAL',
    },
    {
        id: 'mp-8',
        name: 'Razer BlackWidow V4 Teclado Mecánico',
        price: 359000,
        originalPrice: 599000,
        discount: 40,
        image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400',
        category: 'Gaming',
        rating: 4.7,
        reviews: '678',
        storeName: 'Gaming Zone',
        storeUrl: '/store/gaming',
        storeTemplate: 'gaming',
        storeColor: '#a855f7',
    },
    // ── HOGAR (Casa Viva) ──────────────────────────────────────────────
    {
        id: 'mp-9',
        name: 'Lámpara de Pie LED Minimalista Arc',
        price: 189000,
        originalPrice: 349000,
        discount: 46,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400',
        category: 'Hogar',
        rating: 4.5,
        reviews: '156',
        storeName: 'Casa Viva',
        storeUrl: '/store/hogar',
        storeTemplate: 'hogar',
        storeColor: '#e17055',
    },
    {
        id: 'mp-10',
        name: 'Set de Cojines Decorativos Boho x4',
        price: 59000,
        originalPrice: 119000,
        discount: 50,
        image: 'https://images.unsplash.com/photo-1629949009765-75d3e3624039?w=400',
        category: 'Hogar',
        rating: 4.6,
        reviews: '89',
        storeName: 'Casa Viva',
        storeUrl: '/store/hogar',
        storeTemplate: 'hogar',
        storeColor: '#e17055',
        badge: '-50%',
    },
    // ── DEPORTES (Sports Zone) ─────────────────────────────────────────
    {
        id: 'mp-11',
        name: 'Guantes de Box Everlast Pro Elite',
        price: 129000,
        originalPrice: 219000,
        discount: 41,
        image: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400',
        category: 'Deportes',
        rating: 4.7,
        reviews: '312',
        storeName: 'Sports Zone',
        storeUrl: '/store/deportes',
        storeTemplate: 'deportes',
        storeColor: '#00cec9',
    },
    {
        id: 'mp-12',
        name: 'Banda de Resistencia Set Pro x5',
        price: 45000,
        originalPrice: 89000,
        discount: 49,
        image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400',
        category: 'Deportes',
        rating: 4.4,
        reviews: '567',
        storeName: 'Iron Pulse',
        storeUrl: '/store/fitness',
        storeTemplate: 'fitness',
        storeColor: '#ff6348',
    },
    // ── GORRAS (Cap Kings) ─────────────────────────────────────────────
    {
        id: 'mp-13',
        name: 'Gorra Snapback NY Yankees Edición Gold',
        price: 69000,
        originalPrice: 125000,
        discount: 45,
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400',
        category: 'Accesorios',
        rating: 4.8,
        reviews: '432',
        storeName: 'Cap Kings',
        storeUrl: '/store/gorras',
        storeTemplate: 'gorras',
        storeColor: '#ffd32a',
        badge: 'EXCLUSIVO',
    },
    // ── CAFÉ (Café Arábica) ────────────────────────────────────────────
    {
        id: 'mp-14',
        name: 'Pack Café Especial Colombia x3 (750g)',
        price: 45000,
        originalPrice: 75000,
        discount: 40,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
        category: 'Alimentos',
        rating: 4.9,
        reviews: '1.1k',
        storeName: 'Café Arábica',
        storeUrl: '/store/cafe',
        storeTemplate: 'cafe',
        storeColor: '#8B4513',
    },
    // ── JOYERÍA (Lumière) ──────────────────────────────────────────────
    {
        id: 'mp-15',
        name: 'Collar de Plata 925 con Circones',
        price: 189000,
        originalPrice: 350000,
        discount: 46,
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
        category: 'Joyería',
        rating: 4.9,
        reviews: '78',
        storeName: 'Lumière',
        storeUrl: '/store/joyeria',
        storeTemplate: 'joyeria',
        storeColor: '#d4af37',
        badge: 'LUXURY',
    },
    // ── MOTOS (Moto Racer) ─────────────────────────────────────────────
    {
        id: 'mp-16',
        name: 'Casco AGV K1 S Soleluna 2023',
        price: 659000,
        originalPrice: 1100000,
        discount: 40,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
        category: 'Motos',
        rating: 4.8,
        reviews: '234',
        storeName: 'Moto Racer',
        storeUrl: '/store/motos',
        storeTemplate: 'motos',
        storeColor: '#e74c3c',
        badge: 'SPEED DEAL',
    },
    // ── ORGÁNICO (Fresh & Organic) ─────────────────────────────────────
    {
        id: 'mp-17',
        name: 'Canasta Orgánica Familiar Semanal',
        price: 85000,
        originalPrice: 145000,
        discount: 41,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        category: 'Alimentos',
        rating: 4.7,
        reviews: '345',
        storeName: 'Fresh & Organic',
        storeUrl: '/store/organico',
        storeTemplate: 'organico',
        storeColor: '#27ae60',
    },
    // ── LUXURY (Dark Luxury) ───────────────────────────────────────────
    {
        id: 'mp-18',
        name: 'Reloj Automático Luxury Edition Black',
        price: 1200000,
        originalPrice: 2400000,
        discount: 50,
        image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400',
        category: 'Accesorios',
        rating: 5.0,
        reviews: '56',
        storeName: 'Dark Luxury',
        storeUrl: '/store/luxury',
        storeTemplate: 'luxury',
        storeColor: '#c9a961',
        badge: 'VIP -50%',
    },
    // ── WAYUU (Wayuu Arts) ─────────────────────────────────────────────
    {
        id: 'mp-19',
        name: 'Mochila Wayuu Artesanal Multicolor',
        price: 120000,
        originalPrice: 220000,
        discount: 45,
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
        category: 'Accesorios',
        rating: 4.9,
        reviews: '187',
        storeName: 'Wayuu Arts',
        storeUrl: '/store/wayuu',
        storeTemplate: 'wayuu',
        storeColor: '#e74c3c',
        badge: 'ARTESANAL',
    },
    // ── BELLEZA (Beauty Glow) ──────────────────────────────────────────
    {
        id: 'mp-20',
        name: 'Kit Skincare Premium 5 Pasos',
        price: 159000,
        originalPrice: 289000,
        discount: 45,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
        category: 'Belleza',
        rating: 4.8,
        reviews: '923',
        storeName: 'Beauty Glow',
        storeUrl: '/store/belleza',
        storeTemplate: 'belleza',
        storeColor: '#ff69b4',
        badge: 'BEST SELLER',
    },
    {
        id: 'mp-21',
        name: 'Cama Ortopédica para Perros',
        price: 180000,
        originalPrice: 250000,
        discount: 28,
        image: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400',
        category: 'Hogar',
        rating: 4.8,
        reviews: '124',
        storeName: 'Patitas Felices',
        storeUrl: '/store/mascotas',
        storeTemplate: 'mascotas',
        storeColor: '#fdcb6e',
        badge: 'NEW',
    },
    // ── MINIMAL (Minimal Studio) ───────────────────────────────────────
    {
        id: 'mp-22',
        name: 'Lámpara de Escritorio Industrial',
        price: 210000,
        originalPrice: 320000,
        discount: 34,
        image: 'https://images.unsplash.com/photo-1534349762230-e7371d9d19dd?w=400',
        category: 'Hogar',
        rating: 4.7,
        reviews: '89',
        storeName: 'Élite Boutique',
        storeUrl: '/store/minimal',
        storeTemplate: 'minimal',
        storeColor: '#1c1c1e',
    },
]

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Funciones utilitarias del marketplace                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Obtiene productos con descuento filtrados por categoría */
export function getMarketplaceProducts(category: MarketplaceCategory = 'Todos'): MarketplaceProduct[] {
    if (category === 'Todos') return marketplaceProducts
    return marketplaceProducts.filter(p => p.category === category)
}

/** Obtiene los productos con mayor descuento (flash deals) */
export function getFlashDeals(limit = 6): MarketplaceProduct[] {
    return [...marketplaceProducts]
        .sort((a, b) => b.discount - a.discount)
        .slice(0, limit)
}

/** Obtiene productos de una tienda específica */
export function getProductsByStore(storeTemplate: string): MarketplaceProduct[] {
    return marketplaceProducts.filter(p => p.storeTemplate === storeTemplate)
}

/** Busca productos por texto */
export function searchMarketplace(query: string): MarketplaceProduct[] {
    const q = query.toLowerCase()
    return marketplaceProducts.filter(
        p =>
            p.name.toLowerCase().includes(q) ||
            p.storeName.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
    )
}

/** Formatea precio en COP con formato manual para evitar errores de hidratación */
export function formatCOP(price: number): string {
    return '$' + Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

/** Obtiene tiendas únicas del marketplace */
export function getActiveStores(): { name: string; url: string; color: string; productCount: number }[] {
    const storeMap = new Map<string, { name: string; url: string; color: string; productCount: number }>()
    for (const p of marketplaceProducts) {
        const existing = storeMap.get(p.storeTemplate)
        if (existing) {
            existing.productCount++
        } else {
            storeMap.set(p.storeTemplate, {
                name: p.storeName,
                url: p.storeUrl,
                color: p.storeColor,
                productCount: 1,
            })
        }
    }
    return Array.from(storeMap.values())
}
