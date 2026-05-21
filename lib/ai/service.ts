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

export function processLocalSalesQuery(
  query: string,
  storeName: string,
  products: LocalProduct[],
  specialOffer?: string
): AISalesResponse {
  const q = query.toLowerCase().trim()
  
  const greetings = ['hola', 'buenos dias', 'buenas tardes', 'buen', 'que tal', 'hey', 'alguien', 'inicio']
  const purchaseIntents = ['quiero', 'comprar', 'agrega', 'añadir', 'me interesa', 'cuanto vale', 'precio de', 'lo quiero', 'ordenar', 'compro', 'agregar']

  // 1. Saludos
  if (greetings.some(g => q === g || q.startsWith(g + ' '))) {
    const topProducts = products.slice(0, 3).map(p => p.name).join(', ')
    let welcomeMsg = `¡Hola! Bienvenido a *${storeName}* 🛍️. Soy tu asistente virtual de ventas de la tienda.\n\nEstoy aquí para atenderte de inmediato. ¿Qué producto estás buscando hoy? Tenemos excelentes opciones en catálogo como: *${topProducts || 'novedades increíbles'}*.`
    
    if (specialOffer && specialOffer !== 'Ninguna') {
      welcomeMsg += `\n\n📢 *Oferta Especial de Hoy:* \n✨ "${specialOffer}" ✨`
    }
    
    return {
      message: welcomeMsg,
      suggested: products.slice(0, 3).map(p => `Ver ${p.name}`)
    }
  }

  // Detectar si pregunta específicamente por ofertas, descuentos, promociones, regalos
  if (q.includes('oferta') || q.includes('promo') || q.includes('descuento') || q.includes('especial') || q.includes('regalo') || q.includes('regalan')) {
    if (specialOffer && specialOffer !== 'Ninguna') {
      return {
        message: `📢 *¡Novedad de hoy en la tienda!* \n\nTenemos este anuncio y beneficio exclusivo:\n✨ "${specialOffer}" ✨\n\n¿Te gustaría llevar algún producto de nuestro catálogo?`,
        suggested: products.slice(0, 3).map(p => `Agregar ${p.name}`)
      }
    }
  }

  // 2. Intención de agregar al carrito (Fuzzy name matching + intent)
  for (const product of products) {
    const pName = product.name.toLowerCase()
    const isExactClick = q === `ver ${pName}` || q === `agregar ${pName}` || q === `quiero ${pName}`
    const hasIntentAndName = purchaseIntents.some(intent => q.includes(intent)) && q.includes(pName)

    if (isExactClick || hasIntentAndName) {
      const formattedPrice = (product.price / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
      return {
        message: `¡Excelente elección! El producto *${product.name}* (${formattedPrice}) ya se encuentra agregado en tu carrito de compras 🛒.\n\n¿Te gustaría ver algún otro producto de nuestro catálogo, o procedemos a confirmar tu pedido?`,
        action: {
          type: 'ADD_TO_CART',
          payload: product.id
        },
        suggested: ['Confirmar Pedido', '¿Cómo pago?', 'Seguir Comprando']
      }
    }
  }

  // 3. Búsqueda de productos en el catálogo por palabras clave
  const matchedProducts: LocalProduct[] = []
  for (const product of products) {
    const pName = product.name.toLowerCase()
    const pDesc = (product.description || '').toLowerCase()
    const queryWords = q.split(/\s+/)
    const isMatch = queryWords.some(word => word.length > 2 && (pName.includes(word) || pDesc.includes(word)))
    if (isMatch) {
      matchedProducts.push(product)
    }
  }

  if (matchedProducts.length > 0) {
    const productsList = matchedProducts.map(p => {
      const formattedPrice = (p.price / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
      return `• *${p.name}* - ${formattedPrice}\n  _${p.description || 'Disponible en tienda.'}_`
    }).join('\n\n')

    return {
      message: `¡Claro! Encontré estas maravillosas opciones en nuestro catálogo:\n\n${productsList}\n\n¿Deseas agregar alguno de ellos al carrito?`,
      suggested: matchedProducts.slice(0, 3).map(p => `Agregar ${p.name}`)
    }
  }

  // 4. Preguntas Frecuentes: Métodos de Pago
  if (q.includes('pago') || q.includes('pagar') || q.includes('metodo') || q.includes('efectivo') || q.includes('transferencia') || q.includes('efipay')) {
    return {
      message: `Aceptamos excelentes opciones de pago en esta tienda para tu total comodidad y confianza:\n\n• 💵 **Pago contra entrega** (pagas en efectivo en tu casa al recibir el pedido).\n• 💳 **EfiPay** (pago digital seguro por internet).\n\n¿Te gustaría llevar algún producto ahora?`,
      suggested: products.slice(0, 2).map(p => `Agregar ${p.name}`)
    }
  }

  // 5. Preguntas Frecuentes: Envíos y Domicilios
  if (q.includes('envio') || q.includes('enviar') || q.includes('domicilio') || q.includes('llegar') || q.includes('tiempo')) {
    return {
      message: `¡Hacemos envíos rápidos y seguros a nivel nacional! 🇨🇴\n\nEl tiempo estimado de entrega es de **1 a 3 días hábiles** dependiendo de tu ciudad. Tu compra está 100% protegida y respaldada.`,
      suggested: ['¿Cómo pago?', 'Ver catálogo']
    }
  }

  // 6. Respuesta persuasiva por defecto
  const defaultProducts = products.slice(0, 3).map(p => {
    const formattedPrice = (p.price / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    return `• *${p.name}* (${formattedPrice})`
  }).join('\n')

  let defaultMsg = `Estoy aquí para ayudarte a comprar de forma rápida y segura en nuestra tienda.\n\nTe recomiendo llevar nuestros productos recomendados de hoy:\n\n${defaultProducts}\n\n¿Cuál te gustaría agregar a tu pedido?`
  if (specialOffer && specialOffer !== 'Ninguna') {
    defaultMsg += `\n\n💡 *Recuerda nuestra oferta especial de hoy:* "${specialOffer}"`
  }

  return {
    message: defaultMsg,
    suggested: products.slice(0, 3).map(p => `Agregar ${p.name}`)
  }
}

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
