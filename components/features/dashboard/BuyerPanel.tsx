'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingBag,
  MapPin,
  Package,
  ChevronRight,
  User,
  Settings,
  Bell,
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'
import { createClient } from '@/lib/supabase/client'

export default function BuyerPanel() {
  const [activeTab, setActiveTab] = useState<'inicio' | 'pedidos' | 'ubicacion'>('inicio')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/buyer/dashboard')
      if (!res.ok) throw new Error('Debes iniciar sesión para ver tus compras.')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDashboardData(data)
    } catch (err: any) {
      setLoadError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'bg-blue-100 text-blue-700'
      case 'delivered': return 'bg-emerald-100 text-emerald-700'
      case 'pending': return 'bg-amber-100 text-amber-700'
      case 'cancelled': return 'bg-rose-100 text-rose-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'shipped': return <Truck size={14} />
      case 'delivered': return <CheckCircle2 size={14} />
      case 'cancelled': return <XCircle size={14} />
      default: return <Package size={14} />
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex items-center justify-center gap-3 text-gray-600 font-bold max-w-4xl mx-auto mt-8">
        <Loader2 className="animate-spin" size={24} />
        Cargando tu panel...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4 max-w-lg mx-auto mt-8 text-center">
        <AlertCircle className="text-rose-500" size={48} />
        <div>
          <div className="font-black text-gray-900 text-xl">No se pudo cargar tu panel</div>
          <div className="text-sm text-gray-600 mt-2">{loadError}</div>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold mt-4"
        >
          Volver al Inicio
        </button>
      </div>
    )
  }

  const { profile, stats, orders } = dashboardData
  const displayName = profile?.name || profile?.email?.split('@')[0] || 'Usuario'
  const initials = (displayName[0] || 'U').toUpperCase()

  return (
    <div className="buyer-panel p-4 max-w-4xl mx-auto space-y-6">
      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">¡Hola, {displayName}!</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {stats.activeOrders > 0 ? `${stats.activeOrders} pedido(s) en curso` : 'Sin pedidos en curso'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none p-3 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center">
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} className="flex-1 sm:flex-none p-3 bg-rose-50 rounded-2xl text-rose-600 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 font-bold text-sm">
            <LogOut size={16} /> <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'inicio', label: 'Resumen', icon: <User size={16} /> },
          { id: 'pedidos', label: 'Historial', icon: <ShoppingBag size={16} /> },
          { id: 'ubicacion', label: 'Ubicación', icon: <MapPin size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="space-y-4 pb-20">
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Total Gastado</div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{formatCOP(stats.totalSpent)}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Pedidos</div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{stats.orderCount}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Suscripciones</div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{stats.storesFollowed}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">En curso</div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{stats.activeOrders}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-indigo-500" /> Pedidos Recientes
              </h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold">Aún no tienes pedidos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order: any) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-black text-sm text-gray-900">{order.stores?.name}</div>
                        <div className="text-xs text-gray-500 font-medium">
                          {new Date(order.created_at).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-gray-900">{formatCOP(order.total_amount)}</div>
                        <div className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg mt-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {orders.length > 3 && (
                    <button 
                      onClick={() => setActiveTab('pedidos')}
                      className="w-full py-3 text-sm font-black text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-center"
                    >
                      Ver todos los pedidos
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <span className="font-black text-xs text-gray-400 uppercase tracking-widest">Historial Completo</span>
              <span className="text-xs font-black text-gray-900">{orders.length} pedidos</span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {orders.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                  <p className="font-bold">Aún no has realizado compras.</p>
                </div>
              )}
              {orders.map((order: any) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-black text-gray-900 text-sm">{order.stores?.name}</h5>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      {order.order_items?.length || 0} productos • {new Date(order.created_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <div className="font-black text-gray-900 sm:text-right mt-2 sm:mt-0 flex items-center justify-between sm:block">
                    <span className="sm:hidden text-xs text-gray-500">Total:</span>
                    {formatCOP(order.total_amount)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ubicacion' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
            <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-black text-gray-900 mb-2">Direcciones de Entrega</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Actualmente solicitamos tu dirección en cada compra para mayor seguridad. Muy pronto podrás guardar múltiples direcciones aquí.
            </p>
          </div>
        )}
      </div>

      {/* Modal Detalle Pedido */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedOrderId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {(() => {
              const order = orders.find((o: any) => o.id === selectedOrderId)
              if (!order) return null
              
              return (
                <>
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                    <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido en {order.stores?.name}</div>
                      <div className="font-black text-gray-900 text-sm">#{order.id.slice(0, 8)}</div>
                    </div>
                    <button className="p-2 bg-white rounded-xl text-gray-500 hover:bg-gray-100" onClick={() => setSelectedOrderId(null)}>
                      <XCircle size={20} />
                    </button>
                  </div>
                  
                  <div className="p-5 overflow-y-auto space-y-6">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black uppercase ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        {new Date(order.created_at).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Productos</div>
                      <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-start gap-4">
                            <div>
                              <div className="font-bold text-gray-900 text-sm leading-tight">{item.product_name_snapshot}</div>
                              <div className="text-xs text-gray-500 mt-0.5">Cant: {item.quantity}</div>
                              {item.metadata?.selectedColors && item.metadata.selectedColors.length > 0 && (
                                <div className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-md inline-block mt-1 text-gray-600 font-medium">
                                  Color: {item.metadata.selectedColors.join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="font-black text-gray-900 text-sm">{formatCOP(item.total_price)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500 font-bold">Total Pagado</div>
                      <div className="text-2xl font-black text-gray-900">{formatCOP(order.total_amount)}</div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-6 right-6 z-40 flex justify-center pointer-events-none">
        <button
          className="bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all pointer-events-auto"
          onClick={() => window.location.href = '/'}
        >
          <Search size={18} /> Explorar Tiendas
        </button>
      </div>
    </div>
  )
}
