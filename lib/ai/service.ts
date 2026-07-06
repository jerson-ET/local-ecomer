/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Service — Asistente virtual de Ventas Local de LocalEcomer            */
/*  Procesa consultas en tiempo real sin dependencias ni APIs externas.      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type LocalProduct = {
  id: string
  name: string
  description?: string | null
  price: number
  stock?: number | null
}

export type AISalesResponse = {
  message: string
  action?: {
    type: 'ADD_TO_CART' | 'NAVIGATE' | 'SEARCH'
    payload: string
  }
  suggested?: string[]
}

// La función processLocalSalesQuery fue reemplazada por la IA en la nube (Llama-3) en /api/ai/store-assistant

// Mantener compatibilidad anterior para processAIQuery original
export async function processAIQuery(query: string): Promise<{ message: string, action?: { type: string, payload: string }, suggested?: string[] }> {
  const q = query.toLowerCase().trim()
  if (q.includes('tienda') || q.includes('catálogo')) {
    return {
      message: 'Te llevo a explorar las tiendas disponibles.',
      action: { type: 'NAVIGATE', payload: '/tiendas' },
      suggested: ['Ver más', 'Volver al inicio'],
    }
  }
  if (q.includes('crear') || q.includes('vender') || q.includes('mi tienda')) {
    return {
      message: '¡Genial! Te llevo al panel para crear tu catálogo de productos.',
      action: { type: 'NAVIGATE', payload: '/dashboard' },
      suggested: ['Volver al inicio'],
    }
  }
  return {
    message: `Hola! Soy tu asistente de LocalEcomer. ¿En qué puedo ayudarte hoy?`,
    suggested: ['Ver tiendas', 'Crear mi catálogo']
  }
}
