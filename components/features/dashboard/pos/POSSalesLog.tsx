'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Receipt, Loader2, ShoppingCart, Banknote, Zap, CreditCard,
  Calendar, RefreshCw, Package, Search, ChevronDown, ChevronUp,
  Clock, TrendingUp, Filter, BarChart3,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════ */
/*  TYPES                                                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

interface SaleItem {
  product_name_snapshot: string
  quantity: number
  unit_price: number
  total_price: number
  product_image_snapshot: string | null
}

interface Sale {
  id: string
  buyer_name: string
  total_amount: number
  status: string
  created_at: string
  notes: string
  payment_method: string | null
  items: SaleItem[]
}

type DateFilter = 'today' | 'week' | 'month' | 'year' | 'all'

/* ═══════════════════════════════════════════════════════════════════════ */
/*  HELPERS                                                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function parsePaymentMethod(notes: string): string {
  const match = notes.match(/Pago:\s*([^|]+)/i)
  return match?.[1]?.trim() ?? 'N/A'
}
function fmt$(n: number) { return `$${n.toLocaleString('es-CO')}` }

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtFullDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(d: Date) { return isSameDay(d, new Date()) }
function isYesterday(d: Date) { const y = new Date(); y.setDate(y.getDate() - 1); return isSameDay(d, y) }

function getDayLabel(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return '📅 Hoy'
  if (isYesterday(d)) return '📅 Ayer'
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function groupByDay(sales: Sale[]): { label: string; date: string; sales: Sale[] }[] {
  const map = new Map<string, { label: string; date: string; sales: Sale[] }>()
  for (const s of sales) {
    const d = new Date(s.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, { label: getDayLabel(s.created_at), date: key, sales: [] })
    map.get(key)!.sales.push(s)
  }
  return Array.from(map.values())
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  BADGES                                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

function PaymentBadge({ notes }: { notes: string }) {
  const method = parsePaymentMethod(notes)
  const styles: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    'Efectivo': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <Banknote size={11} /> },
    'Transferencia': { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: <Zap size={11} /> },
    'Otro': { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: <CreditCard size={11} /> },
  }
  const s = styles[method] || { color: '#94a3b8', bg: '#f1f5f9', icon: <CreditCard size={11} /> }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
      {s.icon} {method}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  STAT CARD                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

function StatCard({ icon, label, value, sub, gradient }: { icon: React.ReactNode; label: string; value: string; sub: string; gradient: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', flex: 1, minWidth: 130 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, background: gradient, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 950, color: '#0f172a' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>{sub}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export const POSSalesLog: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  useEffect(() => {
    setLoading(true)
    fetch('/api/accounting/pos-sales')
      .then(r => r.json())
      .then(data => setSales(data.sales || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [refreshKey])

  /* ─── Filtrado por fecha ─── */
  const dateFiltered = useMemo(() => {
    const now = new Date()
    return sales.filter(s => {
      const d = new Date(s.created_at)
      switch (dateFilter) {
        case 'today': return isSameDay(d, now)
        case 'week': { const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); return d >= weekAgo }
        case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        case 'year': return d.getFullYear() === now.getFullYear()
        default: return true
      }
    })
  }, [sales, dateFilter])

  /* ─── Filtrado por búsqueda ─── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return dateFiltered
    return dateFiltered.filter(s =>
      s.buyer_name?.toLowerCase().includes(q) ||
      s.notes?.toLowerCase().includes(q) ||
      s.items?.some(i => i.product_name_snapshot?.toLowerCase().includes(q))
    )
  }, [dateFiltered, search])

  /* ─── Estadísticas ─── */
  const stats = useMemo(() => {
    const now = new Date()
    const todaySales = sales.filter(s => isSameDay(new Date(s.created_at), now))
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const weekSales = sales.filter(s => new Date(s.created_at) >= weekAgo)
    const monthSales = sales.filter(s => { const d = new Date(s.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })

    const sumAmount = (arr: Sale[]) => arr.reduce((a, s) => a + s.total_amount, 0)
    const sumItems = (arr: Sale[]) => arr.reduce((a, s) => a + (s.items?.reduce((b, i) => b + i.quantity, 0) || 0), 0)

    return {
      todayAmount: sumAmount(todaySales), todayCount: todaySales.length, todayItems: sumItems(todaySales),
      weekAmount: sumAmount(weekSales), weekCount: weekSales.length,
      monthAmount: sumAmount(monthSales), monthCount: monthSales.length,
      totalAmount: sumAmount(sales), totalCount: sales.length,
    }
  }, [sales])

  /* ─── Agrupado por día ─── */
  const grouped = useMemo(() => groupByDay(filtered), [filtered])

  const filterOptions: { key: DateFilter; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' },
    { key: 'all', label: 'Todo' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <Loader2 size={40} className="animate-spin" color="#6366f1" />
        <span style={{ color: '#64748b', fontWeight: 600 }}>Cargando registro de ventas...</span>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
            <Receipt size={22} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Registro de Ventas</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Historial detallado · Hora, día, mes y año</p>
          </div>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#475569', fontWeight: 700, fontSize: 12 }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
        <StatCard icon={<Clock size={15} color="white" />} label="Hoy" value={fmt$(stats.todayAmount)} sub={`${stats.todayCount} ventas · ${stats.todayItems} uds`} gradient="linear-gradient(135deg, #10b981, #059669)" />
        <StatCard icon={<Calendar size={15} color="white" />} label="Esta semana" value={fmt$(stats.weekAmount)} sub={`${stats.weekCount} ventas`} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" />
        <StatCard icon={<TrendingUp size={15} color="white" />} label="Este mes" value={fmt$(stats.monthAmount)} sub={`${stats.monthCount} ventas`} gradient="linear-gradient(135deg, #a855f7, #9333ea)" />
        <StatCard icon={<BarChart3 size={15} color="white" />} label="Total" value={fmt$(stats.totalAmount)} sub={`${stats.totalCount} ventas`} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} color="#94a3b8" style={{ marginRight: 4 }} />
        {filterOptions.map(f => (
          <button
            key={f.key}
            onClick={() => setDateFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              background: dateFilter === f.key ? '#0f172a' : '#f1f5f9',
              color: dateFilter === f.key ? 'white' : '#64748b',
              border: dateFilter === f.key ? '1px solid #0f172a' : '1px solid #e2e8f0',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
        <input
          type="text" placeholder="Buscar por cliente, producto..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 12px 10px 42px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13, color: '#0f172a', outline: 'none', fontWeight: 500, boxSizing: 'border-box' }}
        />
      </div>

      {/* Sales grouped by day */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#f8fafc', borderRadius: 20, border: '2px dashed #e2e8f0' }}>
          <ShoppingCart size={44} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8', margin: 0 }}>No hay ventas en este periodo</p>
          <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6 }}>Cambia el filtro o realiza ventas desde el POS</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(group => {
            const dayTotal = group.sales.reduce((a, s) => a + s.total_amount, 0)
            const dayItems = group.sales.reduce((a, s) => a + (s.items?.reduce((b, i) => b + i.quantity, 0) || 0), 0)

            return (
              <div key={group.date}>
                {/* Day Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '8px 14px', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} color="#6366f1" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>{group.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{group.sales.length} ventas · {dayItems} uds</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>{fmt$(dayTotal)}</span>
                  </div>
                </div>

                {/* Sales for this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 10, borderLeft: '2px solid #e2e8f0' }}>
                  {group.sales.map(sale => {
                    const isExpanded = expandedId === sale.id
                    return (
                      <div key={sale.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                        {/* Sale header */}
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
                        >
                          {/* Time badge */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '6px 10px', minWidth: 60, flexShrink: 0 }}>
                            <Clock size={12} color="#6366f1" />
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{fmtTime(sale.created_at)}</span>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{sale.buyer_name || 'Cliente de Caja'}</span>
                              <PaymentBadge notes={sale.notes || ''} />
                            </div>
                            {/* Products summary inline */}
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sale.items?.map(i => `${i.product_name_snapshot} x${i.quantity}`).join(', ') || 'Sin detalle'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 16, fontWeight: 950, color: '#10b981' }}>{fmt$(sale.total_amount)}</span>
                            {isExpanded ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9' }}>
                            {/* Full date/time info */}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '10px 0', marginBottom: 8 }}>
                              {[
                                { label: 'Fecha', value: fmtShortDate(sale.created_at) },
                                { label: 'Hora', value: fmtTime(sale.created_at) },
                                { label: 'Día', value: new Date(sale.created_at).toLocaleDateString('es-CO', { weekday: 'long' }) },
                                { label: 'Mes', value: new Date(sale.created_at).toLocaleDateString('es-CO', { month: 'long' }) },
                                { label: 'Año', value: String(new Date(sale.created_at).getFullYear()) },
                              ].map(d => (
                                <div key={d.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '5px 10px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{d.label}</div>
                                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>{d.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Items */}
                            {sale.items && sale.items.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {sale.items.map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {item.product_image_snapshot ? (
                                      <img src={item.product_image_snapshot} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #f1f5f9' }} />
                                    ) : (
                                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Package size={16} color="#94a3b8" />
                                      </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name_snapshot}</div>
                                      <div style={{ fontSize: 11, color: '#64748b' }}>x{item.quantity} · {fmt$(item.unit_price)} c/u</div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 900, color: '#6366f1', flexShrink: 0 }}>{fmt$(item.total_price)}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div style={{ fontSize: 9, color: '#cbd5e1', marginTop: 10 }}>ID: {sale.id}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
