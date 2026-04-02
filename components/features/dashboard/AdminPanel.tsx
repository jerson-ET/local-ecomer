'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Star,
  AlertCircle,
  Bell,
  Target,
  Percent,
  ShoppingCart,
  UserPlus,
  MapPin,
  Smartphone,
  Monitor,
  RefreshCw,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           TYPES                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

type TimePeriod = 'today' | 'week' | 'month' | 'year'

interface KPI {
  label: string
  value: string
  change: number
  icon: React.ReactNode
  color: string
  bgColor: string
}

interface ProductStat {
  id: string
  name: string
  image: string
  sold: number
  revenue: number
  stock: number
  trend: number
}

interface RecentOrder {
  id: string
  customer: string
  customerPhone: string
  product: string
  amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  date: string
  avatar: string
}

interface CustomerData {
  total: number
  new: number
  returning: number
  topCity: string
  avgOrderValue: number
  satisfactionRate: number
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           STATUS HELPERS                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pendiente',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    icon: <Clock size={14} />,
  },
  processing: {
    label: 'Procesando',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    icon: <Package size={14} />,
  },
  shipped: {
    label: 'Enviado',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    icon: <Truck size={14} />,
  },
  delivered: {
    label: 'Entregado',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    icon: <CheckCircle size={14} />,
  },
  cancelled: {
    label: 'Cancelado',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    icon: <XCircle size={14} />,
  },
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        ADMIN PANEL COMPONENT                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface AdminPanelProps {
  storeSlug?: string | undefined
  storeId?: string | undefined
}

export default function AdminPanel({ storeSlug, storeId }: AdminPanelProps) {
  const [period, setPeriod] = useState<TimePeriod>('week')
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [, setIsLoading] = useState(true)

  // Data states
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topProducts, setTopProducts] = useState<ProductStat[]>([])
  const [kpis, setKpis] = useState<KPI[]>([
    { label: 'Ventas', value: '$0', change: 0, icon: <DollarSign size={20} />, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)' },
    { label: 'Pedidos', value: '0', change: 0, icon: <ShoppingBag size={20} />, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.12)' },
    { label: 'Visitantes', value: '0', change: 0, icon: <Eye size={20} />, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
    { label: 'Conversión', value: '0%', change: 0, icon: <Target size={20} />, color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.12)' },
  ])
  const [customerData, setCustomerData] = useState<CustomerData>({
    total: 0, new: 0, returning: 0, topCity: 'N/A', avgOrderValue: 0, satisfactionRate: 0,
  })
  
  const [notifications, setNotifications] = useState<{ type: string; icon: React.ReactNode; text: string; time: string, orderId?: string }[]>([])
  
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      if (res.ok) {
        // Refetch total dashboard data
        location.reload()
      } else {
        alert('Error actualizando pedido')
      }
    } catch (e) {
      console.error('Error updating order:', e)
    }
  }
  const [chartData] = useState([
    { label: 'L', value: 0, prevValue: 0 },
    { label: 'M', value: 0, prevValue: 0 },
    { label: 'Mi', value: 0, prevValue: 0 },
    { label: 'J', value: 0, prevValue: 0 },
    { label: 'V', value: 0, prevValue: 0 },
    { label: 'S', value: 0, prevValue: 0 },
    { label: 'D', value: 0, prevValue: 0 },
  ])

  useEffect(() => {
    let isMounted = true

    async function fetchDashboardData() {
      if (!storeId) {
        if (isMounted) setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const supabase = createClient()
        
        // 1. Fetch Orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, total_amount, status, created_at, buyer_id, buyer_name, buyer_phone')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(20)

        // 2. Fetch Best Sellers (Real Data from order_items in confirmed/delivered orders)
        const { data: bestSellersData } = await supabase
          .from('order_items')
          .select('product_id, quantity, total_price, product_name_snapshot, products(images, stock)')
          .in('order_id', (ordersData || []).filter(o => o.status === 'delivered').map(o => o.id))

        if (isMounted) {
          // KPI Calculation
          const confirmedOrders = (ordersData || []).filter(o => o.status === 'delivered')
          const totalSales = confirmedOrders.reduce((acc, order) => acc + order.total_amount, 0) || 0
          const numOrders = confirmedOrders.length || 0
          const totalVisits = Math.floor(Math.random() * 500) + 100 // Mock visits for now or from analytics if exists
          
          setKpis([
            { label: 'Ventas Reales', value: formatCurrency(totalSales), change: 12, icon: <DollarSign size={20} />, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)' },
            { label: 'Ventas Confirmadas', value: numOrders.toString(), change: 5, icon: <ShoppingBag size={20} />, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.12)' },
            { label: 'Visitas', value: totalVisits.toString(), change: 0, icon: <Eye size={20} />, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
            { label: 'Conversión', value: totalVisits > 0 ? `${((numOrders/totalVisits)*100).toFixed(1)}%` : '0%', change: 0, icon: <Target size={20} />, color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.12)' },
          ])

          // Map Orders
          const mappedOrders: RecentOrder[] = (ordersData || []).map(o => ({
            id: o.id,
            customer: o.buyer_name || `Cliente ${o.buyer_id.substring(0, 4)}`,
            customerPhone: o.buyer_phone || '',
            product: 'Pedido Real',
            amount: o.total_amount,
            status: (o.status as any) || 'pending',
            date: new Date(o.created_at).toLocaleDateString(),
            avatar: (o.buyer_name || 'U').substring(0, 1).toUpperCase()
          }))
          setRecentOrders(mappedOrders)

          // Aggregate Best Sellers
          const prodMap: Record<string, ProductStat> = {}
          bestSellersData?.forEach(item => {
            if (!prodMap[item.product_id]) {
              const pDetails = item.products as any
              let imgUrl = '🖼️'
              if (pDetails?.images && pDetails.images.length > 0) {
                imgUrl = pDetails.images[0]?.thumbnail || pDetails.images[0]?.full || '🖼️'
              }
              prodMap[item.product_id] = {
                id: item.product_id,
                name: item.product_name_snapshot,
                image: imgUrl.length > 5 ? '📦' : imgUrl,
                sold: 0,
                revenue: 0,
                stock: pDetails?.stock || 0,
                trend: 0
              }
            }
            prodMap[item.product_id].sold += item.quantity
            prodMap[item.product_id].revenue += item.total_price
          })
          setTopProducts(Object.values(prodMap).sort((a, b) => b.sold - a.sold).slice(0, 5))

          // Set Notifications (Pending Orders)
          const pendingOps = (ordersData || []).filter(o => o.status === 'pending')
          const mappedNotifs = pendingOps.map(o => ({
            type: 'warning',
            icon: <AlertCircle size={14} />,
            text: `Confirmar venta a ${o.buyer_name || 'Cliente'} ($${o.total_amount})`,
            time: 'Pedida vía WhatsApp',
            orderId: o.id
          }))
          setNotifications(mappedNotifs)
          
          const uniqueBuyers = new Set(ordersData?.map(o => o.buyer_id)).size
          setCustomerData({
            total: uniqueBuyers,
            new: uniqueBuyers,
            returning: 0,
            topCity: 'Local',
            avgOrderValue: numOrders > 0 ? totalSales / numOrders : 0,
            satisfactionRate: 5.0
          })
          
          setIsLoading(false)
        }
      } catch (e) {
        console.error('Error fetching dashboard data:', e)
        if (isMounted) setIsLoading(false)
      }
    }


    fetchDashboardData()
    return () => { isMounted = false }
  }, [storeId, period])

  const maxChartValue = Math.max(...chartData.map((d: { value: number }) => d.value), 1)

  const periodLabels: Record<TimePeriod, string> = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    year: 'Este Año',
  }

  const filteredOrders =
    orderFilter === 'all' ? recentOrders : recentOrders.filter((o) => o.status === orderFilter)

  /* ─── Order Summary Counts ─── */
  const orderSummary = {
    total: recentOrders.length,
    pending: recentOrders.filter((o) => o.status === 'pending').length,
    processing: recentOrders.filter((o) => o.status === 'processing').length,
    shipped: recentOrders.filter((o) => o.status === 'shipped').length,
    delivered: recentOrders.filter((o) => o.status === 'delivered').length,
    cancelled: recentOrders.filter((o) => o.status === 'cancelled').length,
  }

  return (
    <div className={`admin-panel w-full min-h-screen bg-[#f8f9fa]`}>
      <div
        className={`w-full transition-all duration-500 ${
          viewMode === 'mobile'
            ? 'max-w-[480px] mx-auto bg-white min-h-screen shadow-xl'
            : 'max-w-full'
        }`}
      >
        <div className="h-full overflow-y-auto no-scrollbar">
          {/* ──────────── HEADER ──────────── */}
          <div className="ap-header">
            <div className="ap-header-info">
              <div className="ap-greeting">
                <h1>Panel de Administración</h1>
                <p>Bienvenido de vuelta. Aquí tienes el resumen de tu tienda.</p>
              </div>
            </div>
            <div className="ap-header-main-action" style={{ display: 'flex', gap: '12px' }}>
              {storeSlug && (
                <button 
                  onClick={() => window.open(`/tienda/${storeSlug}`, '_blank')}
                  className="ap-period-btn active"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: '#FF5A26', color: 'white', fontWeight: 'bold' }}
                >
                  <Eye size={18} />
                  Mi Catálogo
                </button>
              )}
            </div>
            <div
              className="ap-header-actions"
              style={{ display: 'flex', gap: 12, alignItems: 'center' }}
            >
              <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 20, padding: 3 }}>
                <button
                  onClick={() => setViewMode('mobile')}
                  style={{
                    padding: 6,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'mobile' ? 'white' : 'transparent',
                    color: viewMode === 'mobile' ? '#FF5A26' : '#999',
                    display: 'flex',
                    boxShadow: viewMode === 'mobile' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Smartphone size={16} />
                </button>
                <button
                  onClick={() => setViewMode('desktop')}
                  style={{
                    padding: 6,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'desktop' ? 'white' : 'transparent',
                    color: viewMode === 'desktop' ? '#FF5A26' : '#999',
                    display: 'flex',
                    boxShadow: viewMode === 'desktop' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Monitor size={16} />
                </button>
              </div>
              <div className="ap-period-selector">
                {(['today', 'week', 'month', 'year'] as TimePeriod[]).map((p) => (
                  <button
                    key={p}
                    className={`ap-period-btn ${period === p ? 'active' : ''}`}
                    onClick={() => setPeriod(p)}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ──────────── NOTIFICATIONS BAR ──────────── */}
          <div className="ap-notifications">
            <div className="ap-notif-header">
              <Bell size={18} />
              <span>Actividad Reciente</span>
              <span className="ap-notif-badge">{notifications.length}</span>
            </div>
             <div className="ap-notif-list">
              {notifications.map((n, i) => (
                <div key={i} className={`ap-notif-item ap-notif-${n.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="ap-notif-icon">{n.icon}</div>
                    <div className="ap-notif-content">
                      <span className="ap-notif-text">{n.text}</span>
                      <span className="ap-notif-time">{n.time}</span>
                    </div>
                  </div>
                  {n.orderId && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                         onClick={() => updateOrderStatus(n.orderId!, 'delivered')}
                         style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                         Vendido
                      </button>
                      <button 
                         onClick={() => updateOrderStatus(n.orderId!, 'cancelled')}
                         style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                         No Vendido
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {notifications.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '13px' }}>
                  No hay ventas pendientes por confirmar
                </div>
              )}
            </div>
          </div>

          {/* ──────────── KPI CARDS ──────────── */}
          <div className="ap-kpi-grid">
            {kpis.map((kpi, i) => (
              <div key={i} className="ap-kpi-card">
                <div className="ap-kpi-icon" style={{ background: kpi.bgColor, color: kpi.color }}>
                  {kpi.icon}
                </div>
                <div className="ap-kpi-info">
                  <span className="ap-kpi-label">{kpi.label}</span>
                  <span className="ap-kpi-value">{kpi.value}</span>
                </div>
                <div className={`ap-kpi-change ${kpi.change >= 0 ? 'positive' : 'negative'}`}>
                  {kpi.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{Math.abs(kpi.change)}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* ──────────── REVENUE CHART ──────────── */}
          <div className="ap-chart-card">
            <div className="ap-chart-header">
              <div>
                <h3>Ingresos</h3>
                <p>Comparativa con el período anterior</p>
              </div>
              <div className="ap-chart-legend">
                <span className="ap-legend-item">
                  <span className="ap-legend-dot current"></span>
                  Actual
                </span>
                <span className="ap-legend-item">
                  <span className="ap-legend-dot previous"></span>
                  Anterior
                </span>
              </div>
            </div>
            <div className="ap-chart-container">
              <div className="ap-bar-chart">
                {chartData.map((d, i) => (
                  <div key={i} className="ap-bar-group">
                    <div className="ap-bar-wrapper">
                      <div
                        className="ap-bar previous"
                        style={{ height: `${(d.prevValue / maxChartValue) * 100}%` }}
                      >
                        <span className="ap-bar-tooltip">{formatCurrency(d.prevValue)}</span>
                      </div>
                      <div
                        className="ap-bar current"
                        style={{ height: `${(d.value / maxChartValue) * 100}%` }}
                      >
                        <span className="ap-bar-tooltip">{formatCurrency(d.value)}</span>
                      </div>
                    </div>
                    <span className="ap-bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ──────────── TWO-COL: ORDERS SUMMARY + CUSTOMERS ──────────── */}
          <div className="ap-two-col">
            {/* ─── Order Pipeline ─── */}
            <div className="ap-section-card">
              <div className="ap-section-header">
                <h3>📦 Estado de Pedidos</h3>
                <span className="ap-section-badge">{orderSummary.total} total</span>
              </div>
              <div className="ap-order-pipeline">
                <div className="ap-pipeline-item">
                  <div
                    className="ap-pipeline-icon"
                    style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}
                  >
                    <Clock size={18} />
                  </div>
                  <div className="ap-pipeline-info">
                    <span className="ap-pipeline-count">{orderSummary.pending}</span>
                    <span className="ap-pipeline-label">Pendientes</span>
                  </div>
                  <div className="ap-pipeline-bar">
                    <div
                      className="ap-pipeline-fill"
                      style={{
                        width: `${(orderSummary.pending / orderSummary.total) * 100}%`,
                        background: '#f59e0b',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="ap-pipeline-item">
                  <div
                    className="ap-pipeline-icon"
                    style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}
                  >
                    <Package size={18} />
                  </div>
                  <div className="ap-pipeline-info">
                    <span className="ap-pipeline-count">{orderSummary.processing}</span>
                    <span className="ap-pipeline-label">Procesando</span>
                  </div>
                  <div className="ap-pipeline-bar">
                    <div
                      className="ap-pipeline-fill"
                      style={{
                        width: `${(orderSummary.processing / orderSummary.total) * 100}%`,
                        background: '#6366f1',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="ap-pipeline-item">
                  <div
                    className="ap-pipeline-icon"
                    style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}
                  >
                    <Truck size={18} />
                  </div>
                  <div className="ap-pipeline-info">
                    <span className="ap-pipeline-count">{orderSummary.shipped}</span>
                    <span className="ap-pipeline-label">Enviados</span>
                  </div>
                  <div className="ap-pipeline-bar">
                    <div
                      className="ap-pipeline-fill"
                      style={{
                        width: `${(orderSummary.shipped / orderSummary.total) * 100}%`,
                        background: '#3b82f6',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="ap-pipeline-item">
                  <div
                    className="ap-pipeline-icon"
                    style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}
                  >
                    <CheckCircle size={18} />
                  </div>
                  <div className="ap-pipeline-info">
                    <span className="ap-pipeline-count">{orderSummary.delivered}</span>
                    <span className="ap-pipeline-label">Entregados</span>
                  </div>
                  <div className="ap-pipeline-bar">
                    <div
                      className="ap-pipeline-fill"
                      style={{
                        width: `${(orderSummary.delivered / orderSummary.total) * 100}%`,
                        background: '#10b981',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="ap-pipeline-item">
                  <div
                    className="ap-pipeline-icon"
                    style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}
                  >
                    <XCircle size={18} />
                  </div>
                  <div className="ap-pipeline-info">
                    <span className="ap-pipeline-count">{orderSummary.cancelled}</span>
                    <span className="ap-pipeline-label">Cancelados</span>
                  </div>
                  <div className="ap-pipeline-bar">
                    <div
                      className="ap-pipeline-fill"
                      style={{
                        width: `${(orderSummary.cancelled / orderSummary.total) * 100}%`,
                        background: '#ef4444',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Customer Stats ─── */}
            <div className="ap-section-card">
              <div className="ap-section-header">
                <h3>👥 Clientes</h3>
                <span className="ap-section-badge">
                  {customerData.total.toLocaleString()} total
                </span>
              </div>
              <div className="ap-customer-stats">
                <div className="ap-cust-stat-row">
                  <div className="ap-cust-stat">
                    <div
                      className="ap-cust-icon"
                      style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}
                    >
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <span className="ap-cust-value">{customerData.new}</span>
                      <span className="ap-cust-label">Nuevos este mes</span>
                    </div>
                  </div>
                  <div className="ap-cust-stat">
                    <div
                      className="ap-cust-icon"
                      style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}
                    >
                      <RefreshCw size={18} />
                    </div>
                    <div>
                      <span className="ap-cust-value">
                        {customerData.returning.toLocaleString()}
                      </span>
                      <span className="ap-cust-label">Recurrentes</span>
                    </div>
                  </div>
                </div>
                <div className="ap-cust-metrics">
                  <div className="ap-metric-row">
                    <MapPin size={16} />
                    <span>Ciudad principal:</span>
                    <strong>{customerData.topCity}</strong>
                  </div>
                  <div className="ap-metric-row">
                    <ShoppingCart size={16} />
                    <span>Ticket promedio:</span>
                    <strong>{formatCurrency(customerData.avgOrderValue)}</strong>
                  </div>
                  <div className="ap-metric-row">
                    <Star size={16} />
                    <span>Satisfacción:</span>
                    <strong>{customerData.satisfactionRate}/5.0 ⭐</strong>
                  </div>
                </div>

                {/* Customer Donut Chart */}
                <div className="ap-donut-section">
                  <div className="ap-donut-chart">
                    <svg viewBox="0 0 100 100" className="ap-donut-svg">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(99, 102, 241, 0.15)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="12"
                        strokeDasharray={`${(customerData.returning / customerData.total) * 251.2} 251.2`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${(customerData.new / customerData.total) * 251.2} 251.2`}
                        strokeDashoffset={`${-(customerData.returning / customerData.total) * 251.2}`}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="ap-donut-center">
                      <span className="ap-donut-value">
                        {Math.round((customerData.returning / customerData.total) * 100)}%
                      </span>
                      <span className="ap-donut-label">Retención</span>
                    </div>
                  </div>
                  <div className="ap-donut-legend">
                    <span className="ap-donut-leg-item">
                      <span style={{ background: '#6366f1' }}></span>
                      Recurrentes
                    </span>
                    <span className="ap-donut-leg-item">
                      <span style={{ background: '#10b981' }}></span>
                      Nuevos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────── TOP PRODUCTS TABLE ──────────── */}
          <div className="ap-section-card">
            <div className="ap-section-header">
              <h3>🏆 Productos Más Vendidos</h3>
              <button className="ap-view-all-btn">
                Ver todo <ChevronRight size={16} />
              </button>
            </div>
            <div className="ap-products-table">
              <div className="ap-table-header">
                <span className="ap-th product-col">Producto</span>
                <span className="ap-th">Vendidos</span>
                <span className="ap-th">Ingresos</span>
                <span className="ap-th">Stock</span>
                <span className="ap-th">Tendencia</span>
              </div>
              {topProducts.map((p) => (
                <div key={p.id} className="ap-table-row">
                  <div className="ap-td product-col">
                    <span className="ap-product-emoji">{p.image}</span>
                    <span className="ap-product-name">{p.name}</span>
                  </div>
                  <span className="ap-td ap-td-bold">{p.sold}</span>
                  <span className="ap-td">{formatCurrency(p.revenue)}</span>
                  <span className={`ap-td ${p.stock <= 10 ? 'ap-stock-low' : ''}`}>
                    {p.stock <= 10 && <AlertCircle size={12} />}
                    {p.stock}
                  </span>
                  <span className={`ap-td ap-trend ${p.trend >= 0 ? 'positive' : 'negative'}`}>
                    {p.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(p.trend)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ──────────── RECENT ORDERS TABLE ──────────── */}
          <div className="ap-section-card">
            <div className="ap-section-header">
              <h3>🛒 Pedidos Recientes</h3>
              <div className="ap-order-filters">
                {['all', 'pending', 'processing', 'shipped', 'delivered'].map((f) => (
                  <button
                    key={f}
                    className={`ap-order-filter-btn ${orderFilter === f ? 'active' : ''}`}
                    onClick={() => setOrderFilter(f)}
                  >
                    {f === 'all' ? 'Todos' : statusConfig[f]?.label || f}
                  </button>
                ))}
              </div>
            </div>
            <div className="ap-orders-list">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status]
                if (!status) return null
                return (
                  <div key={order.id} className="ap-order-row">
                    <div
                      className="ap-order-avatar"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {order.avatar}
                    </div>
                    <div className="ap-order-info">
                      <div className="ap-order-top">
                        <span className="ap-order-customer">{order.customer}</span>
                        <span className="ap-order-id">{order.id}</span>
                      </div>
                      <span className="ap-order-product">{order.product}</span>
                      <div className="ap-order-bottom">
                        <span className="ap-order-amount">{formatCurrency(order.amount)}</span>
                        <span
                          className="ap-order-status"
                          style={{ background: status.bg, color: status.color }}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                        <span className="ap-order-date">{order.date}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredOrders.length === 0 && (
                <div className="ap-empty-orders">
                  <Package size={40} />
                  <p>No hay pedidos con este filtro</p>
                </div>
              )}
            </div>
          </div>

          {/* ──────────── QUICK ACTIONS ──────────── */}
          <div className="ap-quick-actions">
            <h3>⚡ Acciones Rápidas</h3>
            <div className="ap-actions-grid">
              <button className="ap-action-btn">
                <Package size={22} />
                <span>Subir Producto</span>
              </button>
              <button className="ap-action-btn">
                <Percent size={22} />
                <span>Crear Oferta</span>
              </button>
               <button
                className="ap-action-btn"
                onClick={() => {
                  if (storeSlug) {
                    window.open(`/tienda/${storeSlug}`, '_blank')
                  } else {
                    alert('Aún no tienes una tienda creada.')
                  }
                }}
              >
                <Smartphone size={22} />
                <span>Mi Catálogo</span>
              </button>
              <button className="ap-action-btn">
                <Users size={22} />
                <span>Clientes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
