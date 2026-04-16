'use client'

import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Package, 
  TrendingUp, 
  Clock, 
  Calendar,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface Stats {
  activeProducts: number
  soldUnits: number
  pendingOrdersCount: number
}

interface PendingOrder {
  id: string
  buyer_name: string
  total_amount: number
  status: string
  created_at: string
  estimated_delivery: string | null
}

interface Product {
  id: string
  name: string
  price: number
  discount_price: number | null
  stock: number
  images: any[]
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
      // Intentamos obtener el storeId de los stats o de una tienda del usuario
      const storeRes = await fetch('/api/user/stores') // Necesitamos un endpoint para esto o sacarlo de los stats
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
        fetchStats() // Recargar estadísticas y pedidos
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Loader2 className="animate-spin" size={32} color="#10b981" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)' }}>
            <BookOpen size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Cuaderno de Contabilidad</h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Estadísticas y gestión de entregas</p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenModal}
          style={{ 
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', 
            borderRadius: 16, padding: '12px 24px', fontSize: 14, fontWeight: 800, 
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.2)', transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <TrendingUp size={18} />
          Registrar Venta Manual
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {/* Productos Card */}
        <div 
          onClick={() => window.location.hash = '#productos'} // O abrir un modal de stock
          style={{ 
            background: 'white', padding: '24px', borderRadius: 24, border: '1px solid #e2e8f0', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.2s',
            position: 'relative', overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = '#10b981'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = '#e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 8, background: '#ecfdf5', borderRadius: 10 }}><Package size={20} color="#10b981" /></div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Productos Activos</span>
            </div>
            <button style={{ fontSize: 10, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '2px 8px', fontWeight: 800 }}>AJUSTAR</button>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{stats?.activeProducts || 0}</div>
          <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>Gestionar inventario</div>
        </div>

        {/* Ventas Card */}
        <div 
          onClick={handleOpenModal}
          style={{ 
            background: 'white', padding: '24px', borderRadius: 24, border: '1px solid #e2e8f0', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = '#6366f1'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = '#e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 8, background: '#eff6ff', borderRadius: 10 }}><TrendingUp size={20} color="#3b82f6" /></div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Unidades Vendidas</span>
            </div>
            <button style={{ fontSize: 10, background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, padding: '2px 8px', fontWeight: 800 }}>AÑADIR</button>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{stats?.soldUnits || 0}</div>
          <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginTop: 4 }}>Registrar venta manual</div>
        </div>

        {/* Entregas Card */}
        <div 
          onClick={() => {
            const el = document.getElementById('gestion-entregas')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          style={{ 
            background: 'white', padding: '24px', borderRadius: 24, border: '1px solid #e2e8f0', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = '#f59e0b'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = '#e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 8, background: '#fff7ed', borderRadius: 10 }}><Clock size={20} color="#f59e0b" /></div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Pendientes por Entregar</span>
            </div>
            <button style={{ fontSize: 10, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, padding: '2px 8px', fontWeight: 800 }}>VER</button>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{stats?.pendingOrdersCount || 0}</div>
          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>Gestionar tiempos</div>
        </div>
      </div>

      {/* Pending Orders Section */}
      <div id="gestion-entregas" style={{ background: 'white', borderRadius: 28, border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Calendar size={22} color="#10b981" />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Gestión de Entregas Pendientes</h3>
        </div>

        {pendingOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', background: '#f8fafc', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>No tienes entregas pendientes por ahora.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {pendingOrders.map((order) => (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{order.buyer_name || 'Cliente'}</span>
                    <span style={{ fontSize: 10, background: '#e2e8f0', padding: '2px 8px', borderRadius: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{order.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Pedido: #{order.id.slice(0, 8)} · ${order.total_amount.toLocaleString('es-CO')}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Fecha de Entrega:</span>
                    <input 
                      type="text" 
                      placeholder="Ej: Lunes 20"
                      value={order.estimated_delivery || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setPendingOrders(prev => prev.map(o => o.id === order.id ? { ...o, estimated_delivery: val } : o))
                      }}
                      onBlur={(e) => updateDeliveryDate(order.id, e.target.value)}
                      style={{ 
                        background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 12px', 
                        fontSize: 13, fontWeight: 600, color: '#0f172a', width: 140,
                        outline: 'none', transition: 'border-color 0.2s'
                      }}
                    />
                    {updatingId === order.id && <Loader2 size={16} className="animate-spin" color="#10b981" />}
                  </div>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>El cliente verá este día en su detalle de pedido</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Tip */}
      <div style={{ marginTop: 24, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <AlertCircle size={20} color="#3b82f6" />
        <p style={{ fontSize: 12, color: '#1e40af', margin: 0, lineHeight: 1.5 }}>
          <strong>Nota:</strong> Al asignar una fecha de entrega, tus clientes podrán verla desde su panel de compras, lo que reduce la incertidumbre y mejora tu calificación.
        </p>
      </div>

      {/* Manual Sale Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 500, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 24, right: 24, border: 'none', background: '#f1f5f9', borderRadius: 12, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <AlertCircle size={18} color="#64748b" style={{ transform: 'rotate(45deg)' }} />
            </button>

            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Registrar Venta Manual</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Los cambios actualizarán tu stock y estadísticas automáticamente.</p>

            <form onSubmit={handleManualSaleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Producto</label>
                <select 
                  required
                  value={manualSale.productId}
                  onChange={(e) => setManualSale(prev => ({ ...prev, productId: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14, fontWeight: 600, outline: 'none' }}
                >
                  <option value="">Selecciona un producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - Stock: {p.stock} - ${((p.discount_price || p.price) / 100).toLocaleString()}</option>
                  ))}
                </select>
                {loadingProducts && <p style={{ fontSize: 11, color: '#6366f1', marginTop: 4 }}>Cargando tus productos...</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Cantidad</label>
                  <input 
                    type="number" 
                    min="1" 
                    required
                    value={manualSale.quantity}
                    onChange={(e) => setManualSale(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14, fontWeight: 600, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Fecha Entrega</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Hoy / Lunes"
                    value={manualSale.estimatedDelivery}
                    onChange={(e) => setManualSale(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14, fontWeight: 600, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Nombre del Cliente (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Nombre del comprador"
                  value={manualSale.buyerName}
                  onChange={(e) => setManualSale(prev => ({ ...prev, buyerName: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14, fontWeight: 600, outline: 'none' }}
                />
              </div>

              <button 
                type="submit"
                disabled={submittingSale || !manualSale.productId}
                style={{ 
                  marginTop: 8, background: '#10b981', color: 'white', border: 'none', borderRadius: 16, 
                  padding: '16px', fontSize: 15, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: (submittingSale || !manualSale.productId) ? 0.6 : 1
                }}
              >
                {submittingSale ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                Confirmar Venta y Actualizar Stock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
