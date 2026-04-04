import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  API: /api/analytics                                                       */
/*  Recibe eventos de tracking del navegador y los guarda en un archivo JSON  */
/*  local para que el admin pueda revisar la actividad de los usuarios.       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ANALYTICS_DIR = path.join(process.cwd(), 'analytics-data')
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, 'user-activity.json')

interface AnalyticsEvent {
  timestamp: string
  sessionId: string
  ip: string
  userAgent: string
  eventType: string        // 'page_view' | 'action' | 'session_start' | 'session_end'
  page: string             // URL de la página
  action?: string          // Acción específica (ej: 'product_upload', 'button_click')
  details?: string         // Detalles adicionales
  duration?: number        // Tiempo en la página (ms)
  cookieConsent: string    // 'accepted' | 'rejected'
  screenWidth?: number
  screenHeight?: number
  language?: string
  referrer?: string
}

function ensureAnalyticsDir() {
  if (!fs.existsSync(ANALYTICS_DIR)) {
    fs.mkdirSync(ANALYTICS_DIR, { recursive: true })
  }
  if (!fs.existsSync(ANALYTICS_FILE)) {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify({ events: [], summary: {} }, null, 2))
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return (forwarded.split(',')[0] ?? '').trim()
  }
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const event: AnalyticsEvent = {
      timestamp: new Date().toISOString(),
      sessionId: body.sessionId || 'unknown',
      ip,
      userAgent,
      eventType: body.eventType || 'page_view',
      page: body.page || '/',
      action: body.action,
      details: body.details,
      duration: body.duration,
      cookieConsent: body.cookieConsent || 'unknown',
      screenWidth: body.screenWidth,
      screenHeight: body.screenHeight,
      language: body.language,
      referrer: body.referrer,
    }

    ensureAnalyticsDir()

    // Leer archivo existente
    const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8')
    const data = JSON.parse(raw)

    // Agregar evento
    data.events.push(event)

    // Actualizar resumen por IP
    if (!data.summary[ip]) {
      data.summary[ip] = {
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        totalPageViews: 0,
        totalActions: 0,
        sessions: 0,
        pages: [],
        actions: [],
        userAgent,
        cookieConsent: event.cookieConsent,
      }
    }

    const userSummary = data.summary[ip]
    userSummary.lastSeen = event.timestamp
    userSummary.cookieConsent = event.cookieConsent

    if (event.eventType === 'page_view') {
      userSummary.totalPageViews++
      if (!userSummary.pages.includes(event.page)) {
        userSummary.pages.push(event.page)
      }
    }

    if (event.eventType === 'action' && event.action) {
      userSummary.totalActions++
      userSummary.actions.push({
        action: event.action,
        details: event.details,
        page: event.page,
        timestamp: event.timestamp,
      })
      // Mantener solo las últimas 100 acciones por usuario
      if (userSummary.actions.length > 100) {
        userSummary.actions = userSummary.actions.slice(-100)
      }
    }

    if (event.eventType === 'session_start') {
      userSummary.sessions++
    }

    // Mantener solo los últimos 10000 eventos globales
    if (data.events.length > 10000) {
      data.events = data.events.slice(-10000)
    }

    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// GET: Para que el admin vea los datos
export async function GET(request: NextRequest) {
  try {
    ensureAnalyticsDir()
    const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    
    // Parámetros de consulta
    const { searchParams } = new URL(request.url)
    const ip = searchParams.get('ip')
    const summaryOnly = searchParams.get('summary') === 'true'
    const last = parseInt(searchParams.get('last') || '50')

    if (summaryOnly) {
      return NextResponse.json({ summary: data.summary, totalEvents: data.events.length })
    }

    if (ip) {
      const filtered = data.events.filter((e: AnalyticsEvent) => e.ip === ip)
      return NextResponse.json({ 
        events: filtered.slice(-last), 
        total: filtered.length,
        userSummary: data.summary[ip] || null 
      })
    }

    return NextResponse.json({ 
      events: data.events.slice(-last),
      total: data.events.length,
      summary: data.summary 
    })
  } catch {
    return NextResponse.json({ events: [], summary: {} })
  }
}
