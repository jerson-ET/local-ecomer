import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { NextResponse } from 'next/server'

// Groq integration ensures lighting fast response times for the store assistant
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, storeId } = await req.json()

    if (!storeId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Store ID y messages son requeridos' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch store configuration & rules
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('name, payment_methods, auto_discount_rules, banner_url')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // 2. Fetch relevant products
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, description, price, stock')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(30)

    const productsCatalog = JSON.stringify(allProducts || [])

    // 3. Obtener oferta activa en vivo
    let specialOffer = ''
    try {
      if (store.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
        const config = JSON.parse(store.banner_url)
        specialOffer = config.specialOffer || config.specialMessage || ''
      }
    } catch {}

    // 4. System Prompt Construction
    const systemPrompt = `
Eres "Chati", el asistente virtual ultra-amigable, inteligente y exclusivo de la tienda "${store.name}".
Tu personalidad es humana, empática, alegre y muy servicial. Nunca suenas como un robot rígido.

AQUÍ ESTÁ EL CATÁLOGO EN TIEMPO REAL: 
${productsCatalog}

INFORMACIÓN DE LA TIENDA:
- Métodos de pago: ${store.payment_methods ? store.payment_methods.join(', ') : 'Efectivo contra entrega y Transferencias'}.
- Oferta/Mensaje Especial de hoy: ${specialOffer || 'Ninguna activa'}.

REGLAS ESTRICTAS DE RESPUESTA:
1. SOLO PUEDES OFRECER LOS PRODUCTOS QUE ESTÁN EN EL CATÁLOGO JSON. Si te piden algo que no está, dile amablemente que por ahora no lo tienes pero ofrécele una alternativa del catálogo.
2. Mantén la conversación fluida. Analiza el historial de chat para entender de qué están hablando.
3. Sé conciso pero muy carismático. Usa emojis.

ACCIONES ESPECIALES (CÓDIGO SECRETO):
Si el usuario dice claramente que "quiere comprar", "lo lleva", "agrégalo" o acepta comprar un producto específico del catálogo,
DEBES incluir este código exacto al FINAL de tu mensaje en una nueva línea:
[CMD_AGREGAR_CARRITO: ID_DEL_PRODUCTO]
(Sustituyendo ID_DEL_PRODUCTO por el campo "id" real del JSON).
Ejemplo de tu respuesta:
"¡Excelente elección! Esos tenis te van a quedar increíbles. Ya los he agregado a tu pedido. ¿Te gustaría ver unas medias que hagan juego?
[CMD_AGREGAR_CARRITO: 123-abc-456]"
`

    // 5. Send to Llama 3
    const { text } = await generateText({
      model: groq('llama-3.1-70b-versatile'),
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role || 'user',
        content: m.content
      })),
      temperature: 0.5,
    })

    return NextResponse.json({ response: text })
  } catch (error: unknown) {
    console.error('LLM Assistant Error:', error)
    return NextResponse.json(
      {
        error: 'Error processing AI conversation',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
