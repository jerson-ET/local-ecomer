/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Service — Asistente virtual de LocalEcomer                            */
/*  Ahora usa queries reales en vez de datos demo hardcodeados.              */
/* ═══════════════════════════════════════════════════════════════════════════ */

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
        '¡Hola! Soy tu asistente virtual de LocalEcomer. ¿En qué puedo ayudarte?\nPuedo buscar productos, llevarte a tiendas o responder dudas.',
      suggested: ['Ver tiendas', 'Buscar productos', 'Crear catálogo'],
    }
  }

  // 2. Ayuda
  if (HELP_KEYWORDS.some((k) => q.includes(k))) {
    return {
      message:
        'Estoy aquí para ayudarte. Puedes pedirme:\n- "Buscar zapatillas"\n- "Ver tiendas"\n- "Crear mi catálogo"',
      suggested: ['Ver tiendas', 'Crear catálogo', 'Mis compras'],
    }
  }

  // 3. Navegación a tiendas
  if (q.includes('tienda') || q.includes('catálogo') || q.includes('catalogo')) {
    return {
      message: 'Te llevo a explorar las tiendas disponibles.',
      action: { type: 'NAVIGATE', payload: '/tiendas' },
      suggested: ['Ver más', 'Volver al inicio'],
    }
  }

  // 4. Crear catálogo
  if (q.includes('crear') || q.includes('vender') || q.includes('mi tienda')) {
    return {
      message: '¡Genial! Te llevo al panel para crear tu catálogo de productos.',
      action: { type: 'NAVIGATE', payload: '/dashboard' },
      suggested: ['Volver al inicio'],
    }
  }

  // 5. Búsqueda general
  return {
    message: `Entendido, buscaré "${query}" en las tiendas.`,
    action: { type: 'SEARCH', payload: query },
    suggested: ['Ver tiendas', 'Volver al inicio'],
  }
}
