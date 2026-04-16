'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  DollarSign,
  Package,
  Loader2,
} from 'lucide-react'
import { OrderRow, OrderStatus } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  paid: { label: 'Pagado', color: 'text-blue-400 bg-blue-400/10', icon: DollarSign },
  processing: { label: 'Procesando', color: 'text-indigo-400 bg-indigo-400/10', icon: Package },
  shipped: { label: 'Enviado', color: 'text-purple-400 bg-purple-400/10', icon: Truck },
  delivered: { label: 'Entregado', color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-400 bg-red-400/10', icon: XCircle },
  returned: { label: 'Devuelto', color: 'text-gray-400 bg-gray-400/10', icon: XCircle },
}
export default function OrdersDashboard({ storeId }: { storeId?: string }) {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)

  useEffect(() => {
    let isMounted = true
    async function fetchOrders() {
      try {
        const supabase = createClient()
        // Si hay un storeId específico consultamos esas, sino Supabase nos filtrará
        // automáticamente gracias a las políticas RLS.

        let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
        if (storeId) {
          query = query.eq('store_id', storeId)
        }

        const { data } = await query
        if (data && isMounted) {
          setOrders(data)
          if (data.length > 0) {

          }
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchOrders()
    return () => {
      isMounted = false
    }
  }, [storeId])

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  // Estadísticas rápidas
  const stats = {
    totalRevenue: orders.reduce((acc, curr) => acc + curr.total_amount, 0),
    pendingCount: orders.filter((o) => o.status === 'pending').length,
    completedCount: orders.filter((o) => o.status === 'delivered').length,
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-emerald-500">
        <Loader2 size={32} className="animate-spin" />
        <span className="ml-3 font-medium">Cargando pedidos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ingresos Totales</p>
            <h3 className="text-2xl font-bold text-gray-900">
              ${stats.totalRevenue.toLocaleString('es-CO')}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pedidos Pendientes</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Completados</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Controles y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-emerald-500" />
          Gestión de Pedidos
        </h2>

        <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Todos
          </button>
          {(['pending', 'paid', 'shipped', 'delivered'] as OrderStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap capitalize ${filter === status ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Pedidos (Mobile Cards / Desktop Table) */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-6 gap-4 p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
          <div className="col-span-1">ID Pedido</div>
          <div className="col-span-1">Cliente</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1">Fecha</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1 text-center">Acciones</div>
        </div>

        {/* Lista de Items */}
        <div className="divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Filter size={48} className="mx-auto mb-4 opacity-20" />
              <p>No se encontraron pedidos con este filtro.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = STATUS_CONFIG[order.status].icon

              return (
                <div key={order.id} className="group hover:bg-gray-50 transition-colors">
                  {/* Mobile View */}
                  <div className="md:hidden p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-emerald-600 font-mono">
                          #{order.id.slice(-6)}
                        </span>
                        <h4 className="text-gray-900 font-medium">
                          {new Date(order.created_at).toLocaleDateString()}
                        </h4>

                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${STATUS_CONFIG[order.status].color}`}
                      >
                        <StatusIcon size={12} />
                        {STATUS_CONFIG[order.status].label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{order.shipping_address.split(',')[0]}</span>
                      <span className="text-gray-900 font-bold text-lg">
                        ${order.total_amount.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 text-sm font-medium transition-colors"
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-6 gap-4 p-4 items-center text-sm">
                    <div className="col-span-1 font-mono text-emerald-600">
                      #{order.id.slice(-8)}
                    </div>
                    <div className="col-span-1 text-gray-600">
                      Cliente #{order.buyer_id.slice(-4)}

                    </div>
                    <div className="col-span-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[order.status].color}`}
                      >
                        <StatusIcon size={12} />
                        {STATUS_CONFIG[order.status].label}
                      </span>
                    </div>
                    <div className="col-span-1 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div className="col-span-1 text-right font-bold text-gray-900">
                      ${order.total_amount.toLocaleString('es-CO')}
                    </div>
                    <div className="col-span-1 flex justify-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                        title="Ver Detalles"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal de Detalle de Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-emerald-500" size={20} />
                Pedido #{selectedOrder.id.slice(-8)}
              </h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Fecha</span>
                  <strong className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Estado</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[selectedOrder.status].color}`}>
                    {STATUS_CONFIG[selectedOrder.status].label}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block mb-1">Cliente</span>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-sm text-gray-900">
                    <div className="font-bold">{selectedOrder.buyer_name || 'Sin nombre'}</div>
                    <div className="text-xs text-gray-600 font-bold">
                      {selectedOrder.buyer_phone ? `Tel: ${selectedOrder.buyer_phone}` : 'Sin teléfono'}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block mb-1">Cliente ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{selectedOrder.buyer_id}</code>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block mb-1">Dirección de Envío</span>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">{selectedOrder.shipping_address}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block mb-1">Notas del cliente</span>
                    <p className="text-gray-700 italic bg-yellow-50 p-2 rounded-lg border border-yellow-100 text-xs">"{selectedOrder.notes}"</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                <span className="text-gray-500">Total pagado</span>
                <span className="text-2xl font-black text-gray-900">${selectedOrder.total_amount.toLocaleString('es-CO')}</span>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 font-medium transition-colors"
              >
                Cerrar
              </button>
              <button 
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-medium transition-colors flex justify-center items-center gap-2"
                onClick={() => alert("Función para cambiar estado en desarrollo")}
              >
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
