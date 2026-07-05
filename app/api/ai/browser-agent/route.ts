import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

// Usamos el cliente Groq que ya está instalado en el proyecto
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { instruction, currentUrl, elements } = await req.json()

    if (!instruction || !currentUrl) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    const systemPrompt = `
Eres XuperBrain, el cerebro de un Agente Autónomo de Navegación Web Avanzado.
Estás conectado al navegador del usuario. Tu objetivo es analizar la pantalla actual y decidir la SIGUIENTE acción a ejecutar.

REGLAS DE RAZONAMIENTO:
1. Analiza el objetivo del usuario en lenguaje natural.
2. Si el usuario te pide ir a un sitio web y no estás en él (la URL no coincide), tu primera acción SIEMPRE debe ser navegar (goto).
3. Si estás en el sitio correcto, analiza la lista de "elementos interactivos" de la pantalla. Cada elemento tiene un ID único ("id").
4. Elige el paso más lógico: escribir, hacer clic, scrollear, esperar o terminar.
5. DEBES responder ÚNICA Y EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional, sin formato markdown.

ACCIONES PERMITIDAS (Responde con uno de estos JSON):
- Navegar a una URL:
  {"action": "goto", "url": "https://www.youtube.com"}
- Hacer clic en un elemento interactivo usando su ID:
  {"action": "click", "id": 12}
- Escribir texto en un campo de entrada usando su ID (presionará Enter automáticamente):
  {"action": "type", "id": 5, "text": "texto"}
- Hacer Scroll hacia abajo:
  {"action": "scroll"}
- Esperar unos segundos:
  {"action": "wait", "ms": 5000}
- Misión completada:
  {"action": "complete", "message": "Descripción de lo logrado"}
`;

    const userPrompt = `
OBJETIVO DEL USUARIO: "${instruction}"
URL ACTUAL DEL NAVEGADOR: "${currentUrl}"

ELEMENTOS INTERACTIVOS EN LA PANTALLA:
${JSON.stringify(elements || [], null, 2)}

Decide la próxima acción. Responde SOLO con el JSON.
`;

    const { text } = await generateText({
      model: groq('llama-3.1-70b-versatile'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.1,
    });

    let rawJson = text.trim();
    if (rawJson.startsWith('\`\`\`json')) rawJson = rawJson.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    else if (rawJson.startsWith('\`\`\`')) rawJson = rawJson.replace(/\`\`\`/g, '').trim();

    const parsedAction = JSON.parse(rawJson);
    return NextResponse.json({ action: parsedAction });

  } catch (error: any) {
    console.error('Browser Agent AI Error:', error);
    return NextResponse.json({ error: 'Error en el servidor de IA', details: error.message }, { status: 500 });
  }
}
