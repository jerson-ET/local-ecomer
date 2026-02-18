'use client'

import { useState } from 'react'
import {
    ShoppingBag,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    MoreHorizontal,
    Eye,
    Filter,
    DollarSign,
    Package
} from 'lucide-react'
import { OrderRow, OrderStatus } from '@/lib/types/database'

// Mock Data para Simulación de Base de Datos
const MOCK_ORDERS: OrderRow[] = [
    {
        id: 'ord-001',
        buyer_id: 'user-123',
        store_id: 'store-abc',
        status: 'pending',
        total_amount: 154000,
        payment_method: 'nequi',
        shipping_address: 'Calle 123 #45-67, Bogotá',
        shipping_cost: 12000,
        notes: 'Dejar en portería',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // hace 30 min
        updated_at: new Date().toISOString()
    },
    {
        id: 'ord-002',
        buyer_id: 'user-456',
        store_id: 'store-abc',
        status: 'paid',
        total_amount: 89900,
        payment_method: 'credit_card',
        shipping_address: 'Carrera 7 #10-20, Medellín',
        shipping_cost: 0,
        notes: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // hace 2 horas
        updated_at: new Date().toISOString()
    },
    {
        id: 'ord-003',
        buyer_id: 'user-789',
        store_id: 'store-abc',
        status: 'shipped',
        total_amount: 245000,
        payment_method: 'daviplata',
        shipping_address: 'Av. Siempre Viva 123',
        shipping_cost: 15000,
        notes: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // ayer
        updated_at: new Date().toISOString()
    },
    {
        id: 'ord-004',
        buyer_id: 'user-101',
        store_id: 'store-abc',
        status: 'delivered',
        total_amount: 45000,
        payment_method: 'cash_on_delivery',
        shipping_address: 'Transversal 5 #33-22',
        shipping_cost: 8000,
        notes: 'Llamar antes de llegar',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // hace 2 días
        updated_at: new Date().toISOString()
    }
]

const STATUS_CONFIG: Record<OrderStatus, { label: string, color: string, icon: typeof Clock }> = {
    'pending': { label: 'Pendiente', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
    'paid': { label: 'Pagado', color: 'text-blue-400 bg-blue-400/10', icon: DollarSign },
    'processing': { label: 'Procesando', color: 'text-indigo-400 bg-indigo-400/10', icon: Package },
    'shipped': { label: 'Enviado', color: 'text-purple-400 bg-purple-400/10', icon: Truck },
    'delivered': { label: 'Entregado', color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
    'cancelled': { label: 'Cancelado', color: 'text-red-400 bg-red-400/10', icon: XCircle },
    'returned': { label: 'Devuelto', color: 'text-gray-400 bg-gray-400/10', icon: XCircle },
}

export default function OrdersDashboard() {
    const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
    const [orders] = useState(MOCK_ORDERS)

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter)

    // Estadísticas rápidas
    const stats = {
        totalRevenue: orders.reduce((acc, curr) => acc + curr.total_amount, 0),
        pendingCount: orders.filter(o => o.status === 'pending').length,
        completedCount: orders.filter(o => o.status === 'delivered').length,
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
                    {(['pending', 'paid', 'shipped', 'delivered'] as OrderStatus[]).map(status => (
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
                        filteredOrders.map(order => {
                            const StatusIcon = STATUS_CONFIG[order.status].icon
                            return (
                                <div key={order.id} className="group hover:bg-gray-50 transition-colors">
                                    {/* Mobile View */}
                                    <div className="md:hidden p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs text-emerald-600 font-mono">#{order.id.slice(-6)}</span>
                                                <h4 className="text-gray-900 font-medium">{new Date(order.created_at).toLocaleDateString()}</h4>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${STATUS_CONFIG[order.status].color}`}>
                                                <StatusIcon size={12} />
                                                {STATUS_CONFIG[order.status].label}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">{order.shipping_address.split(',')[0]}</span>
                                            <span className="text-gray-900 font-bold text-lg">${order.total_amount.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="pt-2 flex gap-2">
                                            <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 text-sm font-medium transition-colors">Ver Detalle</button>
                                        </div>
                                    </div>

                                    {/* Desktop View */}
                                    <div className="hidden md:grid grid-cols-6 gap-4 p-4 items-center text-sm">
                                        <div className="col-span-1 font-mono text-emerald-600">#{order.id.slice(-8)}</div>
                                        <div className="col-span-1 text-gray-600">Cliente #{order.buyer_id.slice(-4)}</div>
                                        <div className="col-span-1">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[order.status].color}`}>
                                                <StatusIcon size={12} />
                                                {STATUS_CONFIG[order.status].label}
                                            </span>
                                        </div>
                                        <div className="col-span-1 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                                        <div className="col-span-1 text-right font-bold text-gray-900">${order.total_amount.toLocaleString('es-CO')}</div>
                                        <div className="col-span-1 flex justify-center gap-2">
                                            <button className="p-2 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors" title="Ver Detalles">
                                                <Eye size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
