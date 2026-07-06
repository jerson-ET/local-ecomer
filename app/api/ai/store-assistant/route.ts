import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

/* ══════════════════════════════════════════════════════════════════
   Motor de IA PROPIO de LocalEcomer — SIN dependencias externas.
   Analiza el catálogo en tiempo real y responde de forma natural.
   ══════════════════════════════════════════════════════════════════ */

function buildResponse(messages: any[], products: any[], storeName: string, paymentMethods: string, specialOffer: string): string {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase().trim() || ''

  // ── Saludos ──
  const greetings = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'buen dia', 'que tal', 'hey', 'ey', 'hi', 'hello', 'alguien', 'inicio', 'holi']
  if (greetings.some(g => lastMsg === g || lastMsg.startsWith(g + ' ') || lastMsg.startsWith(g + ','))) {
    const top = products.slice(0, 3).map(p => p.name).join(', ')
    let msg = `¡Hola! 👋 Bienvenido a ${storeName}. Soy Chati, tu asistente de compras.\n\n¿Qué buscas hoy? Tenemos productos increíbles como: ${top || 'novedades en catálogo'}.`
    if (specialOffer) msg += `\n\n🔥 *Oferta del día:* ${specialOffer}`
    return msg
  }

  // ── Ofertas / Descuentos ──
  if (/oferta|promo|descuento|especial|regalo|regalan|rebaja/.test(lastMsg)) {
    if (specialOffer) {
      return `🎉 ¡Tenemos una oferta activa!\n\n✨ "${specialOffer}" ✨\n\n¿Te gustaría aprovecharla?`
    }
    return `Por ahora no tenemos una promo activa, pero nuestros precios ya son increíbles. ¿Qué producto te interesa?`
  }

  // ── Métodos de pago ──
  if (/pago|pagar|método|efectivo|transferencia|nequi|daviplata|efipay|tarjeta/.test(lastMsg)) {
    return `💳 Aceptamos: ${paymentMethods}.\n\n¡Tu compra está 100% protegida! ¿Quieres que te ayude a elegir un producto?`
  }

  // ── Envíos ──
  if (/envio|enviar|domicilio|llegar|tiempo|despacho|entrega/.test(lastMsg)) {
    return `🚚 ¡Hacemos envíos seguros! El tiempo estimado es de 1 a 3 días hábiles dependiendo de tu ciudad.\n\n¿Te animas a pedir algo?`
  }

  // ── Intención de compra ──
  const buyIntents = ['quiero', 'comprar', 'agrega', 'añadir', 'lo llevo', 'lo quiero', 'compro', 'agregar', 'dame', 'mándame', 'envíame']
  const wantsToBuy = buyIntents.some(i => lastMsg.includes(i))

  // ── Buscar productos mencionados ──
  const matched: any[] = []
  for (const p of products) {
    const pName = p.name.toLowerCase()
    const pDesc = (p.description || '').toLowerCase()
    const words = lastMsg.split(/\s+/).filter(w => w.length > 2)
    if (words.some(w => pName.includes(w) || pDesc.includes(w))) {
      matched.push(p)
    }
  }

  // Si quiere comprar y encontramos producto
  if (wantsToBuy && matched.length > 0) {
    const p = matched[0]
    const price = typeof p.price === 'number' ? (p.price / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : p.price
    return `¡Excelente elección! 🛒 *${p.name}* (${price}) ha sido agregado a tu carrito.\n\n¿Te gustaría algo más?\n[CMD_AGREGAR_CARRITO: ${p.id}]`
  }

  // Si encontró productos sin intención de compra
  if (matched.length > 0) {
    const list = matched.slice(0, 4).map(p => {
      const price = typeof p.price === 'number' ? (p.price / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : p.price
      return `• *${p.name}* — ${price}${p.stock !== null && p.stock <= 5 ? ' (¡Quedan pocas unidades!)' : ''}`
    }).join('\n')
    return `¡Encontré esto para ti! 🔍\n\n${list}\n\n¿Cuál te gustaría llevar?`
  }

  // ── Despedida ──
  if (/gracias|adios|chao|bye|hasta luego|nos vemos/.test(lastMsg)) {
    return `¡Gracias por visitarnos! 😊 Vuelve cuando quieras. Estamos para servirte en ${storeName}. ¡Que tengas un excelente día!`
  }

  // ── Catálogo general / fallback ──
  if (/catálogo|catalogo|productos|que tienen|que venden|ver todo|menu|menú/.test(lastMsg) || products.length > 0) {
    const list = products.slice(0, 5).map(p => {
      const price = typeof p.price === 'number' ? (p.price / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : p.price
      return `• *${p.name}* — ${price}`
    }).join('\n')
    return `Aquí tienes algunos de nuestros productos destacados 🛍️:\n\n${list}\n\n¿Algo te llama la atención? Solo dime y te lo agrego al carrito.`
  }

  return `¡Estoy aquí para ayudarte! 😊 Pregúntame sobre nuestros productos, ofertas o métodos de pago en ${storeName}.`
}

export async function POST(req: Request) {
  try {
    const { messages, storeId } = await req.json()

    if (!storeId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Store ID y messages son requeridos' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('name, payment_methods, auto_discount_rules, banner_url')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, description, price, stock')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(30)

    let specialOffer = ''
    try {
      if (store.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
        const config = JSON.parse(store.banner_url)
        specialOffer = config.specialOffer || config.specialMessage || ''
      }
    } catch {}

    const paymentMethods = store.payment_methods ? store.payment_methods.join(', ') : 'Efectivo contra entrega y Transferencias'

    const response = buildResponse(messages, allProducts || [], store.name, paymentMethods, specialOffer)

    return NextResponse.json({ response })
  } catch (error: unknown) {
    console.error('Store Assistant Error:', error)
    return NextResponse.json(
      { error: 'Error processing conversation', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
