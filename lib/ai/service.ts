import { marketplaceProducts, MarketplaceProduct } from '@/lib/store/marketplace'

export type AIResponse = {
  message: string
  action?: {
    type: 'NAVIGATE' | 'SEARCH' | 'SHOW_PRODUCT'
    payload: string
  }
  suggested?: string[]
}

const GREETINGS = ['hola', 'buenos dias', 'buenas tardes', 'hey', 'inicio']
const HELP_KEYWORDS = ['ayuda', 'help', 'que puedes hacer', 'instrucciones', 'soporte']

export async function processAIQuery(query: string): Promise<AIResponse> {
  const q = query.toLowerCase().trim()

  // 1. Saludos
  if (GREETINGS.some((g) => q.includes(g))) {
    return {
      message:
        '¡Hola! Soy tu asistente virtual de LocalEcomer. ¿En qué puedo ayudarte hoy?\nPuedo buscar productos, llevarte a tiendas o responder dudas.',
      suggested: ['Ver ofertas', 'Buscar zapatos', 'Ir a Tecnología'],
    }
  }

  // 2. Ayuda
  if (HELP_KEYWORDS.some((k) => q.includes(k))) {
    return {
      message:
        'Estoy aquí para ayudarte a navegar el centro comercial digital. Puedes pedirme:\n- "Buscar zapatillas Nike"\n- "Ir a la tienda de tecnología"\n- "Ver ofertas flash"',
      suggested: ['Ver tiendas', 'Ofertas flash', 'Mi cuenta'],
    }
  }

  // 3. Navegación a Tiendas
  if (q.includes('ir a') || q.includes('ver tienda')) {
    const stores = Array.from(new Set(marketplaceProducts.map((p) => p.storeTemplate)))
    const targetStore = stores.find((s) => q.includes(s))

    if (targetStore) {
      return {
        message: `¡Claro! Te llevo a la sección de ${targetStore}.`,
        action: { type: 'NAVIGATE', payload: `/store/${targetStore}` },
      }
    }
  }

  // 4. Búsqueda de Productos (Inteligente)
  // Extraer palabras clave ignorando conectores
  const stopwords = [
    'busco',
    'quiero',
    'necesito',
    'unos',
    'unas',
    'el',
    'la',
    'los',
    'las',
    'de',
    'en',
    'para',
  ]
  const keywords = q.split(' ').filter((w) => !stopwords.includes(w) && w.length > 2)

  if (keywords.length > 0) {
    let bestMatch: MarketplaceProduct | null = null
    let maxScore = 0

    marketplaceProducts.forEach((p) => {
      let score = 0
      const text = `${p.name} ${p.category} ${p.storeName}`.toLowerCase()
      keywords.forEach((k) => {
        if (text.includes(k)) score++
      })
      if (score > maxScore) {
        maxScore = score
        bestMatch = p
      }
    })

    if (bestMatch && maxScore > 0) {
      const product = bestMatch as MarketplaceProduct // Assert type
      return {
        message: `He encontrado algo que te podría gustar: ${product.name} en ${product.storeName}.`,
        action: { type: 'SHOW_PRODUCT', payload: product.id }, // ID del producto
        suggested: [`Ver ${product.name}`, 'Buscar más'],
      }
    }
  }

  // 5. Fallback - Búsqueda general
  return {
    message: `Entendido, buscaré "${query}" en todo el marketplace.`,
    action: { type: 'SEARCH', payload: query },
    suggested: ['Ver categorías', 'Volver al inicio'],
  }
}
