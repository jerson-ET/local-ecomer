'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ShoppingBag,
  Heart,
  MapPin,
  Package,
  ChevronRight,
  Clock,
  TrendingUp,
  User,
  Settings,
  CreditCard,
  Bell,
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'
import { createClient } from '@/lib/supabase/client'

interface BuyerOrder {
  id: string
  storeName: string
  storeSlug: string | null
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: number
  date: string
  createdAt: string
}

type ProfileRow = {
  id: string
  email: string
  name: string | null
  nombre?: string | null
}

export default function BuyerPanel() {
  const [activeTab, setActiveTab] = useState<'perfil' | 'pedidos' | 'historial'>('perfil')
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [orderDetail, setOrderDetail] = useState<{
    id: string
    status: BuyerOrder['status']
    total_amount: number
    created_at: string
    shipping_address: string
    notes: string | null
    storeName: string
  } | null>(null)
  const [orderItems, setOrderItems] = useState<
    { id: string; product_name_snapshot: string; quantity: number; total_price: number }[]
  >([])
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function load() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          if (!isMounted) return
          setProfile(null)
          setOrders([])
          setLoadError('Debes iniciar sesión para ver tus compras.')
          setIsLoading(false)
          return
        }

        const [{ data: profileData, error: profileError }, { data: ordersData, error: ordersError }] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('id, nombre')
              .eq('id', user.id)
              .maybeSingle(),
            supabase
              .from('orders')
              .select('id, status, created_at, store_id, stores(name, slug)')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(30),
          ])

        if (profileError) throw profileError
        if (ordersError) throw ordersError

        const rows = (ordersData || []) as any[]
        
        const mapped: BuyerOrder[] = rows.map((o) => ({
          id: o.id,
          storeName: o.stores?.name || 'Tienda',
          storeSlug: o.stores?.slug || null,
          status: o.status || 'pending',
          total: 0,
          items: 1,
          date: new Date(o.created_at).toLocaleDateString('es-CO'),
          createdAt: o.created_at,
        }))

        if (!isMounted) return
        setProfile((profileData as ProfileRow | null) || null)
        setOrders(mapped)
        setIsLoading(false)
      } catch (e) {
        if (!isMounted) return
        setLoadError(e instanceof Error ? e.message : 'Error cargando datos')
        setIsLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false

    }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadDetail(orderId: string) {
      setIsLoadingDetail(true)
      try {
        const supabase = createClient()
        const { data: orderRow, error: orderError } = await supabase
          .from('orders')
          .select('id, status, created_at, store_id, stores(name)')
          .eq('id', orderId)
          .single()
        if (orderError) throw orderError

        if (!isMounted) return
        const storeName =
          Array.isArray((orderRow as any).stores) ? (orderRow as any).stores?.[0]?.name : (orderRow as any).stores?.name
        setOrderDetail({
          id: orderRow.id,
          status: orderRow.status,
          total_amount: 0,
          created_at: orderRow.created_at,
          shipping_address: 'Por definir con la tienda',
          notes: null,
          storeName: storeName || 'Tienda',
        })
        setOrderItems([])
      } catch (e) {
        if (!isMounted) return
        setOrderDetail(null)
        setOrderItems([])
      } finally {
        if (!isMounted) return
        setIsLoadingDetail(false)
      }
    }

    if (selectedOrderId) {
      loadDetail(selectedOrderId)
    } else {
      setOrderDetail(null)
      setOrderItems([])
    }
    return () => {
      isMounted = false
    }
  }, [selectedOrderId])

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const monthlyOrders = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime()
      return Number.isFinite(t) ? t >= monthStart : true
    })
    const monthlySpending = monthlyOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0)
    const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length
    const favoriteStores = new Set(orders.map((o) => o.storeSlug || o.storeName)).size
    return {
      totalPurchases: orders.length,
      monthlySpending,
      activeOrders,
      favoriteStores,
    }
  }, [orders])

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
      default: return <Clock size={14} />
    }
  }

  const getProgress = (status: BuyerOrder['status']) => {
    switch (status) {
      case 'pending':
        return 20
      case 'processing':
        return 45
      case 'shipped':
        return 75
      case 'delivered':
        return 100
      case 'cancelled':
        return 0
      default:
        return 15
    }
  }

  const displayName =
    profile?.nombre?.trim() ||
    profile?.name?.trim() ||
    profile?.email?.split('@')[0] ||
    'Usuario'
  const initials = (displayName[0] || 'U').toUpperCase()

  return (
    <div className="buyer-panel p-4 max-w-4xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header Profile Section */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-inner">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900 leading-tight">{displayName}</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {stats.activeOrders > 0 ? `${stats.activeOrders} pedido(s) en curso` : 'Sin pedidos en curso'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200 transition-colors">
            <Bell size={20} />
          </button>
          <button className="p-2.5 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex items-center justify-center gap-3 text-gray-600 font-bold">
          <Loader2 className="spinning" size={18} />
          Cargando tus datos...
        </div>
      )}

      {!isLoading && loadError && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-start gap-3">
          <AlertCircle className="text-rose-500 mt-0.5" size={18} />
          <div className="flex-1">
            <div className="font-black text-gray-900">No se pudo cargar tu panel</div>
            <div className="text-sm text-gray-600">{loadError}</div>
          </div>
        </div>
      )}

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group">
          <div className="absolute -right-2 -top-2 bg-indigo-50 w-16 h-16 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <TrendingUp className="text-indigo-500 mb-2" size={20} />
            <div className="text-2xl font-black text-gray-900">{formatCOP(stats.monthlySpending)}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Gasto este mes</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group">
          <div className="absolute -right-2 -top-2 bg-rose-50 w-16 h-16 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <Heart className="text-rose-500 mb-2" size={20} />
            <div className="text-2xl font-black text-gray-900">{stats.favoriteStores}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Tiendas Favoritas</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'perfil', label: 'Mi Perfil', icon: <User size={16} /> },
          { id: 'pedidos', label: 'Seguimiento', icon: <Package size={16} /> },
          { id: 'historial', label: 'Historial', icon: <Clock size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="space-y-4 pb-20">
        {activeTab === 'pedidos' && (
          <>
            <h3 className="font-black text-gray-900 text-lg">Pedidos en curso</h3>
            {orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length ===
              0 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-600">
                <div className="font-black text-gray-900 mb-1">No tienes pedidos en curso</div>
                <div className="text-sm">Explora tiendas y realiza tu primera compra.</div>
              </div>
            )}
            {orders
              .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
              .map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="w-full text-left bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                  <Package size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-black text-gray-900">{order.storeName}</h4>
                    <span className="text-[10px] font-black text-gray-400">
                      #{order.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">{order.date}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${getProgress(order.status)}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="text-gray-300" size={20} />
              </button>
            ))}
          </>
        )}

        {activeTab === 'perfil' && (
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                label: 'Mis Direcciones',
                icon: <MapPin className="text-rose-500" />,
                sub: 'Configura tu dirección de entrega',
              },
              {
                label: 'Métodos de Pago',
                icon: <CreditCard className="text-emerald-500" />,
                sub: 'Pagos se habilitan al final',
              },
              {
                label: 'Mis Compras',
                icon: <ShoppingBag className="text-indigo-500" />,
                sub: `${stats.totalPurchases} pedido(s) en total`,
              },
              {
                label: 'Soporte y Ayuda',
                icon: <Bell className="text-blue-500" />,
                sub: '¿Problemas con un pedido?',
              },
            ].map((item, i) => (
              <button key={i} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors text-left group">
                <div className="bg-gray-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="font-black text-gray-900 text-sm">{item.label}</div>
                  <div className="text-xs text-gray-400 font-medium">{item.sub}</div>
                </div>
                <ChevronRight className="text-gray-300" size={20} />
              </button>
            ))}
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <span className="font-black text-xs text-gray-400 uppercase tracking-widest">Tus Compras</span>
              <button className="text-xs font-black text-indigo-600 hover:underline">
                {orders.length} total
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {orders.length === 0 && (
                <div className="p-10 text-center text-gray-600">
                  <div className="font-black text-gray-900 mb-1">Aún no tienes compras</div>
                  <div className="text-sm">Explora tiendas y agrega productos al carrito.</div>
                </div>
              )}
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                    <ShoppingBag size={24} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-black text-gray-900 text-sm">{order.storeName}</h5>
                    <p className="text-xs font-bold text-gray-400">{order.items} items • {order.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-gray-900 text-sm">{formatCOP(order.total)}</div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">
                      {order.status === 'delivered'
                        ? 'Entregado'
                        : order.status === 'cancelled'
                          ? 'Cancelado'
                          : 'En proceso'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedOrderId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedOrderId(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Pedido
                </div>
                <div className="font-black text-gray-900">
                  #{selectedOrderId.slice(0, 8)} • {orderDetail?.storeName || 'Tienda'}
                </div>
              </div>
              <button
                className="p-2 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                onClick={() => setSelectedOrderId(null)}
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isLoadingDetail && (
                <div className="flex items-center gap-2 text-gray-600 font-bold">
                  <Loader2 className="spinning" size={16} /> Cargando detalle...
                </div>
              )}

              {!isLoadingDetail && orderDetail && (
                <>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(orderDetail.status)}`}
                    >
                      {getStatusIcon(orderDetail.status)} {orderDetail.status}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {new Date(orderDetail.created_at).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="text-xs font-black text-gray-400 uppercase mb-2">
                      Productos
                    </div>
                    <div className="space-y-2">
                      {orderItems.map((i) => (
                        <div key={i.id} className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-black text-gray-900 text-sm">
                              {i.product_name_snapshot}
                            </div>
                            <div className="text-xs text-gray-500 font-bold">
                              Cantidad: {i.quantity}
                            </div>
                          </div>
                          <div className="font-black text-gray-900 text-sm">
                            {formatCOP(i.total_price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="text-xs font-black text-gray-400 uppercase mb-1">Envío</div>
                    <div className="text-sm text-gray-700">{orderDetail.shipping_address}</div>
                    {orderDetail.notes && (
                      <div className="mt-2 text-xs text-gray-600">{orderDetail.notes}</div>
                    )}
                  </div>

                  <div className="flex items-end justify-between pt-2">
                    <div className="text-xs text-gray-500 font-bold">Total</div>
                    <div className="text-2xl font-black text-gray-900">
                      {formatCOP(orderDetail.total_amount)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-6 right-6 z-40 flex justify-center">
        <button
          className="bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          onClick={() => window.location.href = '/'}
        >
          <Search size={18} /> Explorar Tiendas
        </button>
      </div>
    </div>
  )
}
