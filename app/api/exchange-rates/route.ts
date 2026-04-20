/* ═══════════════════════════════════════════════════════════════════════════ */
/*  API: TASAS DE CAMBIO EN TIEMPO REAL                                       */
/*  Ruta: GET /api/exchange-rates                                             */
/*  Fuente: open.er-api.com (gratis, sin API key)                             */
/*  Cache: 1 hora en memoria del servidor                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'

interface CachedRates {
  rates: Record<string, number>
  timestamp: number
}

let cachedData: CachedRates | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hora en ms

/** Tasas de respaldo (aproximadas) por si falla la API externa */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  COP: 4150,
  EUR: 0.92,
  ARS: 1180,
  MXN: 17.2,
  BRL: 5.1,
  CLP: 950,
  PEN: 3.75,
  BOB: 6.91,
  UYU: 39.5,
  PYG: 7550,
  VES: 36.5,
  CNY: 7.25,
  GBP: 0.79,
  JPY: 155,
}

export async function GET() {
  try {
    // Verificar cache
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        rates: cachedData.rates,
        source: 'cache',
        updatedAt: new Date(cachedData.timestamp).toISOString(),
      })
    }

    // Intentar obtener tasas frescas
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.result === 'success' && data.rates) {
        // Filtrar solo las monedas que soportamos
        const supportedCurrencies = Object.keys(FALLBACK_RATES)
        const filteredRates: Record<string, number> = {}
        for (const curr of supportedCurrencies) {
          filteredRates[curr] = data.rates[curr] || FALLBACK_RATES[curr] || 1
        }

        cachedData = { rates: filteredRates, timestamp: Date.now() }

        return NextResponse.json({
          success: true,
          rates: filteredRates,
          source: 'live',
          updatedAt: new Date().toISOString(),
        })
      }
    }

    // Fallback si falla la API
    cachedData = { rates: FALLBACK_RATES, timestamp: Date.now() }
    return NextResponse.json({
      success: true,
      rates: FALLBACK_RATES,
      source: 'fallback',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[EXCHANGE-RATES] Error:', error)
    return NextResponse.json({
      success: true,
      rates: FALLBACK_RATES,
      source: 'fallback',
      updatedAt: new Date().toISOString(),
    })
  }
}
