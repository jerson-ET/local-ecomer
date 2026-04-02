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

    // 1. Fetch store and products
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }

    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, stock')
      .eq('store_id', store.id)
      .limit(20)

    // 2. Fetch recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const systemPrompt = `
Eres un Asistente Experto en Comercio Electrónico y Estrategia Digital para el dueño de la tienda "${store.name}".
Tu objetivo es ayudar al VENDEDOR a gestionar su negocio de forma exitosa en la plataforma LocalEcomer.

CONOCIMIENTO ACTUAL DE LA TIENDA:
- Productos (${products?.length || 0}): ${JSON.stringify(products || [])}
- Pedidos Recientes: ${JSON.stringify(orders || [])}

TUS CAPACIDADES:
1. AYUDA CON PRODUCTOS: Puedes redactar descripciones persuasivas, sugerir precios basados en el mercado o proponer títulos llamativos.
2. ANÁLISIS DE VENTAS: Puedes resumir cómo van los pedidos recientes y sugerir acciones (ej: "tienes 3 pedidos pendientes, deberías contactar a los clientes").
3. SOPORTE TÉCNICO: Explicar cómo usar el panel (subir fotos, cambiar el diseño, configurar WhatsApp).
4. MARKETING: Sugerir ideas de promociones para productos con poco stock o descripciones para estados de WhatsApp.

REGLAS:
- Habla siempre de forma profesional, motivadora y ejecutiva.
- Usa emojis para que la conversación sea fluida.
- Si el vendedor te pide subir un producto, recuérdale que puede hacerlo en el botón "Subir Nuevo", pero ofrécele redactar la descripción primero para que solo tenga que copiar y pegar.
- Sé conciso y directo al grano.
`

    const { text } = await generateText({
      model: groq('llama-3.1-70b-versatile'), // Better model for complex logic and writing
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
    })

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error('Admin AI Error:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
