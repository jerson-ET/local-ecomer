import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { NextResponse } from 'next/server'

// Groq integration ensures lighting fast response times for the store assistant
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const { messages, storeId } = await req.json()

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch store configuration & rules
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('name, payment_methods, auto_discount_rules, whatsapp_number')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // 2. Fetch relevant products (Lightweight DB constraint)
    // Extracting the last user message to serve as generic lookup query
    // const lastUserMessage = messages.length > 0 ? messages[messages.length - 1].content : ''

    // In a production environment we could trigger a PG vector search,
    // but for this phase we just fetch active products up to a limit
    // to give context to the LLM.
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, product_tags')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(15)

    const productsCatalog = JSON.stringify(products || [])

    // 3. System Prompt Construction
    const systemPrompt = `
Eres un vendedor experto y asistente brillante exclusivo de la tienda "${store.name}".
Aquí tienes el catálogo actualizado en formato JSON: 
${productsCatalog}

REGLAS ESTRICTAS:
1. SOLO PUEDES HABLAR DE LOS PRODUCTOS EN ESTE CATÁLOGO. Tienes prohibido responder sobre temas generales u otras tiendas.
2. Tu objetivo es vender amablemente, ofrecer productos complementarios (upselling) y confirmar la compra.
3. Métodos de pago aceptados en esta tienda: ${store.payment_methods ? store.payment_methods.join(', ') : 'Efectivo/Transferencia'}.
4. Promociones automáticas activas: ${JSON.stringify(store.auto_discount_rules)}.

COMPORTAMIENTO DE ACCIÓN CÓDIGO (¡CRÍTICO!):
Si el usuario dice de forma explícita o implícita 'lo quiero', 'agregar', o acepta comprar un producto específico,
DEBES responder incluyendo este código exacto al principio de tu mensaje:
[CMD_AGREGAR_CARRITO: ID_DEL_PRODUCTO]
(Sustituyendo ID_DEL_PRODUCTO por el ID real del JSON).
Luego, continúa con la conversación naturalmente confirmando y ofreciendo un complemento.
Ejemplo: [CMD_AGREGAR_CARRITO: 123-abc-456] ¡Excelente elección! Ya lo agregué a tu pedido. Por cierto, esos zapatos combinan perfecto con este pantalón...
`

    // 4. Send to Micro-LLM
    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: systemPrompt,
      messages: messages,
      temperature: 0.3, // Low temp for more deterministic selling
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
