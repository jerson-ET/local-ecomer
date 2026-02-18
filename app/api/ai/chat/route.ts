import { processAIQuery } from '@/lib/ai/service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json()
        const response = await processAIQuery(query)
        return NextResponse.json(response)
    } catch (error) {
        console.error('AI Error:', error)
        return NextResponse.json({ message: 'Lo siento, tuve un problema procesando tu mensaje.' }, { status: 500 })
    }
}
