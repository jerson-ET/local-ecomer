import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { NextResponse } from 'next/server'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 1. Obtener la tienda
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }

    // Parsear la oferta o configuración actual
    let storeConfig: Record<string, any> = {}
    try {
      if (store.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
        storeConfig = JSON.parse(store.banner_url)
      }
    } catch {}
    const currentOffer = storeConfig.specialOffer || storeConfig.specialMessage || 'Ninguna'

    // 2. Obtener productos de la tienda
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, stock')
      .eq('store_id', store.id)
      .limit(30)

    // 3. Obtener todas las órdenes para análisis financiero real
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('store_id', store.id)

    // Calcular estadísticas en tiempo real
    const totalSalesSum = allOrders?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0
    const completedSalesSum = allOrders?.filter(o => o.status === 'completed' || o.status === 'entregado').reduce((acc, o) => acc + (o.total_amount || 0), 0) || 0
    const totalOrdersCount = allOrders?.length || 0
    
    // Últimas 5 órdenes
    const recentOrders = allOrders
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) || []

    // Productos con bajo stock
    const lowStockProducts = products?.filter(p => p.stock !== null && p.stock !== undefined && p.stock <= 5) || []

    const systemPrompt = `
Eres un Asistente Experto en Comercio Electrónico y Estrategia Digital para el dueño de la tienda "${store.name}".
Tu objetivo es ayudar al VENDEDOR a gestionar su negocio de forma exitosa en la plataforma LocalEcomer.

DATOS FINANCIEROS Y DE VENTAS EN TIEMPO REAL:
- Total de Ventas Registradas (Histórico): $${totalSalesSum.toLocaleString('es-CO')} COP
- Ventas Completadas: $${completedSalesSum.toLocaleString('es-CO')} COP
- Cantidad de Pedidos Totales: ${totalOrdersCount}
- Productos en Catálogo: ${products?.length || 0}
- Productos con Bajo Stock (menor o igual a 5 unidades): ${JSON.stringify(lowStockProducts)}
- Lista detallada de Productos: ${JSON.stringify(products || [])}
- Últimos 5 Pedidos: ${JSON.stringify(recentOrders)}
- Oferta/Anuncio Actual en vivo para los compradores: "${currentOffer}"

TUS CAPACIDADES CLAVE:
1. INFORMAR SOBRE VENTAS: Cuando el dueño te pregunte por ventas, finanzas, progreso o cómo va el negocio, usa los datos financieros exactos indicados arriba. Sé preciso, honesto y dale un resumen ejecutivo claro.
2. ANALIZAR PROGRESO DE PRODUCTOS: Analiza el stock de sus productos. Avísale cuáles tienen bajo stock y sugiérele reabastecerse o lanzar ofertas creativas para salir de inventario.
3. PUBLICAR OFERTAS / ANUNCIOS: Si el dueño te pide establecer, anunciar, cambiar o publicar un mensaje u oferta especial para los compradores (por ejemplo: "Dile a los compradores que hoy hay 20% de descuento en pantalones" o "anuncia que hay envío gratis hoy"), debes extraer la oferta, responder confirmándolo alegremente, e incluir al final de tu respuesta en una nueva línea exactamente este comando:
COMMAND:SET_OFFER=<texto de la oferta redactada de forma muy atractiva>
Esto guardará automáticamente la oferta en la base de datos para que el asistente Chati de los compradores la use de inmediato en vivo.

REGLAS:
- Sé sumamente motivador, profesional y directo.
- Usa emojis de forma sofisticada.
- Usa viñetas para que la información sea súper fácil de leer de un vistazo.
`

    const { text: responseText } = await generateText({
      model: groq('llama-3.1-70b-versatile'),
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
    })

    let text = responseText

    // Detectar comando especial de establecer oferta
    const offerMatch = text.match(/COMMAND:SET_OFFER=(.+)/)
    if (offerMatch) {
      const newOffer = offerMatch[1].trim()
      
      // Limpiar el comando del texto que verá el vendedor
      text = text.replace(/COMMAND:SET_OFFER=.+/, '').trim()

      // Actualizar en Supabase
      let config: any = {}
      try {
        if (store.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
          config = JSON.parse(store.banner_url)
        }
      } catch (e) {}

      config.specialOffer = newOffer

      await supabase
        .from('stores')
        .update({ banner_url: JSON.stringify(config) })
        .eq('id', store.id)
      
      text += `\n\n📢 *[Acción Ejecutada]*: He publicado esta oferta en vivo en el chat de tus compradores:\n✨ "${newOffer}" ✨`
    }

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error('Admin AI Error:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
