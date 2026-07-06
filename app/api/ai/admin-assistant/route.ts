import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/* ══════════════════════════════════════════════════════════════════
   Asistente Admin PROPIO de LocalEcomer — SIN dependencias externas.
   Analiza datos reales de la tienda y responde al vendedor.
   ══════════════════════════════════════════════════════════════════ */

function buildAdminResponse(lastMsg: string, store: any, products: any[], orders: any[], currentOffer: string): { text: string; newOffer?: string } {
  const q = lastMsg.toLowerCase().trim()

  // ── Ventas / Finanzas ──
  if (/ventas|finanzas|ganancias|ingresos|dinero|facturación|cuánto|cómo va|reporte|balance|resumen/.test(q)) {
    const totalSales = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0)
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'entregado')
    const completedSales = completedOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0)

    return {
      text: `📊 *Resumen de ${store.name}*\n\n` +
        `• 💰 Ventas totales: $${totalSales.toLocaleString('es-CO')} COP\n` +
        `• ✅ Ventas completadas: $${completedSales.toLocaleString('es-CO')} COP\n` +
        `• 📦 Total de pedidos: ${orders.length}\n` +
        `• 🛍️ Productos en catálogo: ${products.length}\n\n` +
        `¿Necesitas más detalle sobre algún aspecto?`
    }
  }

  // ── Stock / Inventario ──
  if (/stock|inventario|producto|agotado|quedan|unidades/.test(q)) {
    const lowStock = products.filter(p => p.stock !== null && p.stock !== undefined && p.stock <= 5)
    if (lowStock.length > 0) {
      const list = lowStock.map(p => `• ⚠️ *${p.name}*: ${p.stock} unidades`).join('\n')
      return { text: `🔴 *Productos con bajo stock:*\n\n${list}\n\nTe recomiendo reabastecer estos productos o crear una oferta para vender lo que queda rápido.` }
    }
    return { text: `✅ ¡Todo bien! Ningún producto tiene stock bajo (5 o menos). Tienes ${products.length} productos en catálogo.` }
  }

  // ── Publicar oferta ──
  if (/oferta|promo|descuento|anuncia|publica|mensaje.*comprador|dile.*cliente/.test(q)) {
    // Extraer la oferta del mensaje
    const offerText = lastMsg
      .replace(/publica|anuncia|pon|establece|dile a los compradores|crea una oferta|oferta:|promo:/gi, '')
      .replace(/que diga|que sea|con el texto/gi, '')
      .trim()

    if (offerText.length > 5) {
      return {
        text: `📢 ¡Oferta publicada con éxito!\n\n✨ "${offerText}" ✨\n\nTus compradores ya la verán al hablar con Chati.`,
        newOffer: offerText
      }
    }
    if (currentOffer) {
      return { text: `📢 Tu oferta actual es:\n✨ "${currentOffer}" ✨\n\n¿Quieres cambiarla? Escríbeme la nueva oferta.` }
    }
    return { text: `No tienes una oferta activa. Escríbeme algo como: "Anuncia envío gratis hoy" y lo publico de inmediato.` }
  }

  // ── Pedidos recientes ──
  if (/pedidos|órdenes|últimos|recientes/.test(q)) {
    const recent = orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
    if (recent.length === 0) return { text: `Aún no tienes pedidos registrados. ¡Comparte tu tienda para atraer compradores!` }
    const list = recent.map(o => `• Pedido #${o.id.slice(0, 8)} — $${(o.total_amount || 0).toLocaleString('es-CO')} COP — Estado: ${o.status}`).join('\n')
    return { text: `📋 *Últimos pedidos:*\n\n${list}` }
  }

  // ── Saludo ──
  if (/hola|buenas|hey|qué tal/.test(q)) {
    return { text: `¡Hola! 👋 Soy tu asistente de negocio para *${store.name}*.\n\nPuedo ayudarte con:\n• 📊 Ver tus ventas y finanzas\n• 📦 Revisar inventario y stock\n• 📢 Publicar ofertas para compradores\n• 📋 Ver pedidos recientes\n\n¿Qué necesitas?` }
  }

  // ── Fallback ──
  return {
    text: `Soy tu asistente de *${store.name}*. Puedo ayudarte con:\n\n` +
      `• 📊 "¿Cómo van mis ventas?"\n` +
      `• 📦 "¿Cómo está mi inventario?"\n` +
      `• 📢 "Publica que hoy hay envío gratis"\n` +
      `• 📋 "Muéstrame los últimos pedidos"\n\n` +
      `¡Pregúntame lo que necesites!`
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }

    let storeConfig: Record<string, any> = {}
    try {
      if (store.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
        storeConfig = JSON.parse(store.banner_url)
      }
    } catch {}
    const currentOffer = storeConfig.specialOffer || storeConfig.specialMessage || ''

    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, stock')
      .eq('store_id', store.id)
      .limit(30)

    const { data: allOrders } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('store_id', store.id)

    const lastMsg = messages?.[messages.length - 1]?.content || ''
    const result = buildAdminResponse(lastMsg, store, products || [], allOrders || [], currentOffer)

    // Si la IA detectó un comando de publicar oferta
    if (result.newOffer) {
      storeConfig.specialOffer = result.newOffer
      await supabase
        .from('stores')
        .update({ banner_url: JSON.stringify(storeConfig) })
        .eq('id', store.id)
    }

    return NextResponse.json({ response: result.text })
  } catch (error: any) {
    console.error('Admin AI Error:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
