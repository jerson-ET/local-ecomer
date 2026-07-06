import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PLATFORM_KNOWLEDGE = `
Eres el Asistente de Soporte Oficial de LocalEcomer, una plataforma de comercio electrónico y catálogos digitales diseñada para vendedores locales en Colombia.
Tu objetivo es responder de forma clara, detallada, precisa y amigable a los vendedores sobre cómo funciona la plataforma.
No inventes funciones, no alucines y sé sincero si algo no está en las especificaciones.

INFORMACIÓN COMPLETA DE LA PLATAFORMA LOCALECOMER:

1. ¿Qué es LocalEcomer?
   Es una solución integral que permite a cualquier comerciante crear su propia tienda online (catálogo digital) en minutos, administrar su inventario, vender físicamente con un Punto de Venta (POS) y automatizar el registro de sus ingresos y gastos.

2. Creación y Configuración del Catálogo:
   - Los usuarios van a la sección "Catálogo" (bajo "Administrar Tienda").
   - Pueden elegir un nombre, personalizar el banner y configurar la información del negocio.
   - Cuenta con plantillas de diseño seleccionables en la pestaña "Plantillas" (Minimal, Moda, Mascotas, Hogar) adaptables a celulares y computadoras.

3. Métodos de Pago:
   - Acepta pagos contra entrega (efectivo al recibir el pedido).
   - Transferencia directa (Nequi, Daviplata o cuentas bancarias).
   - EfiPay (integración directa para pagos digitales y electrónicos).

4. Gestión de Productos:
   - Se gestiona desde la sección "Productos".
   - Permite subir productos con nombre, descripción, precio en COP, imágenes (almacenadas de forma segura en Cloudflare R2) y control de stock/inventario.

5. Sistema Super POS (Punto de Venta):
   - Sistema de caja para ventas físicas y presenciales.
   - Permite buscar productos por nombre o código, añadir al carrito de caja, aplicar descuentos personalizados, registrar al cliente y completar la venta de inmediato.
   - Genera recibos y facturas en formato digital.

6. Cuaderno de Contabilidad (Accounting Book):
   - Herramienta financiera para el vendedor.
   - Registra de forma automática todas las ventas completadas del POS y la tienda online.
   - Permite agregar egresos (gastos manuales) e ingresos externos.
   - Muestra gráficos y resúmenes ejecutivos con ingresos netos y gastos.

7. Centro de Mensajes (Chat Center):
   - Panel tipo WhatsApp Web unificado.
   - Muestra todos los chats iniciados por compradores en las tiendas del vendedor.
   - El vendedor puede interactuar directamente con los clientes en tiempo real.

8. Configuración de Dominio Personalizado:
   - Disponible en la pestaña "Dominio".
   - Permite enlazar un dominio propio (.com, .store, etc.) al catálogo digital configurando los registros DNS correspondientes.

9. Planes y Facturación:
   - La plataforma muestra alertas del vencimiento del periodo de prueba en la esquina superior derecha.
   - Los usuarios pueden adquirir el Plan Pro ProIA para contar con acceso ilimitado a las automatizaciones, POS avanzado y descargas de PDFs de inventario.

Pautas para tus respuestas:
- Habla en español, de forma muy educada y profesional.
- Usa emojis de manera natural.
- Presenta las guías paso a paso de forma clara y ordenada usando viñetas.
- Si el usuario te pregunta cosas que no corresponden a LocalEcomer, recuérdale amablemente tu rol de asistente de soporte oficial.
`

export async function POST(req: Request) {
  try {
    const { messages, apiKey, model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages es requerido' }, { status: 400 })
    }

    // Priorizar API Key del cliente, de lo contrario buscar en env
    const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!geminiKey) {
      return NextResponse.json({ 
        error: 'missing_key',
        message: 'No se encontró la Gemini API Key. Por favor confígurala en los ajustes del asistente.' 
      }, { status: 400 })
    }

    // Mapear modelo seleccionado
    const selectedModel = model === 'Pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash'

    // Formatear historial para la API REST de Gemini (v1beta)
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const body = {
      systemInstruction: {
        parts: [{ text: PLATFORM_KNOWLEDGE }]
      },
      contents,
      generationConfig: {
        temperature: 0.2, // Temperatura baja para evitar alucinaciones
        maxOutputTokens: 1000
      }
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API Error details:', data)
      throw new Error(data.error?.message || 'Error en la API de Gemini')
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no logré procesar la respuesta. ¿Puedes reformular tu pregunta?'

    return NextResponse.json({ response: aiText })
  } catch (error: any) {
    console.error('Platform Assistant Route Error:', error)
    return NextResponse.json({ 
      error: 'server_error', 
      message: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}
