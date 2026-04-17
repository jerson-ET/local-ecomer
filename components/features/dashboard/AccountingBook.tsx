'use client'

import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Package, 
  TrendingUp, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  User, 
  Tag, 
  ChevronRight,
  ArrowRight,
  Hash
} from 'lucide-react'

interface PendingOrder {
  id: string
  buyer_name: string
  total_amount: number
  status: string
  created_at: string
  estimated_delivery: string | null
  items: {
    product_name_snapshot: string
    quantity: number
    product: { sku: string | null } | null
  }[]
}

interface Product {
  id: string
  name: string
  price: number
  discount_price: number | null
  stock: number
  images: any[]
  sku: string | null
}

interface Stats {
  activeProducts: number
  soldUnits: number
  pendingOrdersCount: number
}

export const AccountingBook: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Manual Sale Modal State
  const [showModal, setShowModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [manualSale, setManualSale] = useState({
    productId: '',
    quantity: 1,
    buyerName: '',
    buyerPhone: '',
    estimatedDelivery: '',
    notes: ''
  })
  const [submittingSale, setSubmittingSale] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/accounting/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setPendingOrders(data.pendingOrders)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStoreProducts = async () => {
    setLoadingProducts(true)
    try {
      const storeRes = await fetch('/api/user/stores')
      if (storeRes.ok) {
        const stores = await storeRes.json()
        if (stores.length > 0) {
          const res = await fetch(`/api/products?storeId=${stores[0].id}`)
          if (res.ok) {
            const data = await res.json()
            setProducts(data.products || [])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleOpenModal = () => {
    setShowModal(true)
    fetchStoreProducts()
  }

  const handleManualSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualSale.productId) return
    setSubmittingSale(true)
    try {
      const res = await fetch('/api/accounting/manual-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualSale)
      })
      if (res.ok) {
        setShowModal(false)
        setManualSale({
          productId: '',
          quantity: 1,
          buyerName: '',
          buyerPhone: '',
          estimatedDelivery: '',
          notes: ''
        })
        fetchStats()
      }
    } catch (error) {
      console.error('Error registering manual sale:', error)
    } finally {
      setSubmittingSale(false)
    }
  }

  const updateDeliveryDate = async (orderId: string, dateText: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch('/api/accounting/stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, estimatedDelivery: dateText })
      })
      if (res.ok) {
        setPendingOrders(prev => prev.map(o => o.id === orderId ? { ...o, estimated_delivery: dateText } : o))
      }
    } catch (error) {
      console.error('Error updating delivery date:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #f1f5f9', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Cargando cuaderno...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* Header — Estilo Apple Premium */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ 
            width: 64, height: 64, 
            background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 12px 24px rgba(99, 102, 241, 0.3)',
            color: 'white'
          }}>
            <BookOpen size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Cuaderno Contable</h2>
            <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500, margin: '4px 0 0' }}>Gestión inteligente de ventas y entregas</p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenModal}
          style={{ 
            background: '#0f172a', color: 'white', border: 'none', 
            borderRadius: 18, padding: '14px 28px', fontSize: 15, fontWeight: 800, 
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(15, 23, 42, 0.3)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.2)'
          }}
        >
          <Plus size={20} />
          Nueva Venta Manual
        </button>
      </div>

      {/* Grid de Estadísticas — Diseño Limpio y Moderno */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 48 }}>
        <StatCard 
          icon={<Package size={24} />} 
          title="Productos Activos" 
          value={stats?.activeProducts || 0} 
          subtitle="En catálogo online" 
          color="#10b981" 
          onClick={() => window.location.hash = '#productos'}
        />
        <StatCard 
          icon={<TrendingUp size={24} />} 
          title="Unidades Vendidas" 
          value={stats?.soldUnits || 0} 
          subtitle="Ventas totales" 
          color="#6366f1" 
          onClick={handleOpenModal}
        />
        <StatCard 
          icon={<Clock size={24} />} 
          title="Pendientes Entrega" 
          value={stats?.pendingOrdersCount || 0} 
          subtitle="Requieren acción" 
          color="#f59e0b" 
          onClick={() => document.getElementById('entregas')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      {/* Sección de Entregas Pendientes */}
      <div id="entregas" style={{ 
        background: 'white', 
        borderRadius: 32, 
        border: '1px solid #f1f5f9', 
        padding: '32px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.02)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: '#fef3c7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={22} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Gestión de Entregas</h3>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', background: '#f8fafc', padding: '6px 16px', borderRadius: 12 }}>
            {pendingOrders.length} Pendientes
          </span>
        </div>

        {pendingOrders.length === 0 ? (
          <div style={{ 
            padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 24, border: '2px dashed #e2e8f0'
          }}>
            <div style={{ width: 64, height: 64, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>
            <p style={{ color: '#64748b', fontWeight: 600, fontSize: 16 }}>No tienes entregas pendientes por ahora.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} updatingId={updatingId} onUpdateDate={updateDeliveryDate} />
            ))}
          </div>
        )}
      </div>

      {/* Manual Sale Modal — Glassmorphism */}
      {showModal && (
        <div style={{ 
          position: 'fixed', inset: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
        }}>
          <div style={{ 
            background: 'white', borderRadius: 36, width: '100%', maxWidth: 540, 
            padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', position: 'relative',
            animation: 'modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 32, right: 32, border: 'none', background: '#f8fafc', borderRadius: 14, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.5px' }}>Registrar Venta</h3>
            <p style={{ color: '#64748b', fontSize: 15, marginBottom: 32, fontWeight: 500 }}>Añade una venta externa para sincronizar tu inventario.</p>

            <form onSubmit={handleManualSaleSubmit} style={{ display: 'grid', gap: 24 }}>
              {/* Selección de Producto con Mejor Diseño */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 10 }}>Producto a vender</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    required
                    value={manualSale.productId}
                    onChange={(e) => setManualSale(prev => ({ ...prev, productId: e.target.value }))}
                    style={{ 
                      width: '100%', padding: '16px 20px', borderRadius: 18, border: '2px solid #f1f5f9', 
                      background: '#f8fafc', fontSize: 15, fontWeight: 600, outline: 'none', appearance: 'none',
                      cursor: 'pointer', color: manualSale.productId ? '#0f172a' : '#94a3b8',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                  >
                    <option value="">Buscar producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.sku ? `[${p.sku}] ` : ''}{p.name} — Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                  <ChevronRight size={18} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', color: '#64748b' }} />
                </div>
                {loadingProducts && <p style={{ fontSize: 12, color: '#6366f1', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} className="animate-spin" /> Cargando catálogo...</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 10 }}>Cantidad</label>
                  <input 
                    type="number" min="1" required
                    value={manualSale.quantity}
                    onChange={(e) => setManualSale(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '16px', borderRadius: 18, border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: 15, fontWeight: 700, textAlign: 'center', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 10 }}>Fecha estimada de entrega</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" placeholder="Ej: Hoy / Lunes 20"
                      value={manualSale.estimatedDelivery}
                      onChange={(e) => setManualSale(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                      style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 18, border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: 15, fontWeight: 600, outline: 'none' }}
                    />
                    <Clock size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 10 }}>Nombre del Cliente</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" placeholder="¿Para quién es el pedido?"
                    value={manualSale.buyerName}
                    onChange={(e) => setManualSale(prev => ({ ...prev, buyerName: e.target.value }))}
                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 18, border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: 15, fontWeight: 600, outline: 'none' }}
                  />
                  <User size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                </div>
              </div>

              <button 
                type="submit"
                disabled={submittingSale || !manualSale.productId}
                style={{ 
                  marginTop: 8, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 20, 
                  padding: '18px', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
                  opacity: (submittingSale || !manualSale.productId) ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {submittingSale ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                Confirmar Venta y Bajar Stock
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

/* Componentes de apoyo para limpieza de código */

const StatCard = ({ icon, title, value, subtitle, color, onClick }: any) => (
  <div 
    onClick={onClick}
    style={{ 
      background: 'white', padding: '28px', borderRadius: 28, border: '1px solid #f1f5f9', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative', overflow: 'hidden'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-6px)'
      e.currentTarget.style.boxShadow = `0 20px 40px ${color}15`
      e.currentTarget.style.borderColor = color
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'
      e.currentTarget.style.borderColor = '#f1f5f9'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div style={{ padding: 10, background: `${color}10`, borderRadius: 14, color: color }}>{icon}</div>
      <ArrowRight size={18} color="#cbd5e1" />
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>{value}</div>
    <div style={{ fontSize: 13, color: color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
      {subtitle}
    </div>
  </div>
)

const OrderCard = ({ order, updatingId, onUpdateDate }: any) => {
  const [localDate, setLocalDate] = useState(order.estimated_delivery || '')
  
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '24px', background: '#f8fafc', borderRadius: 24, border: '1px solid #f1f5f9',
      transition: 'all 0.2s'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
            <User size={18} color="#6366f1" />
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{order.buyer_name || 'Cliente'}</span>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>ID: #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {order.items?.map((item: any, i: number) => (
            <div key={i} style={{ 
              fontSize: 12, color: '#4f46e5', fontWeight: 700, 
              background: '#eef2ff', padding: '6px 12px', borderRadius: 10, 
              display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e0e7ff'
            }}>
              <Hash size={12} />
              {item.product?.sku && <span style={{ color: '#6366f1', background: 'white', padding: '1px 4px', borderRadius: 4, fontSize: 10 }}>{item.product.sku}</span>}
              {item.product_name_snapshot} ({item.quantity} ud)
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', padding: '8px 16px', borderRadius: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Fecha de Entrega</span>
            <input 
              type="text" 
              placeholder="Pendiente..."
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              onBlur={() => onUpdateDate(order.id, localDate)}
              style={{ 
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, fontWeight: 700, color: '#0f172a', width: 120
              }}
            />
          </div>
          {updatingId === order.id ? <Loader2 size={16} className="animate-spin" color="#6366f1" /> : <Calendar size={18} color="#cbd5e1" />}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Monto: ${order.total_amount.toLocaleString('es-CO')}</div>
      </div>
    </div>
  )
}

const X = ({ size, color }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)
