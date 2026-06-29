'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function StoreDbContent() {
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!userId) {
            setError('No se proporcionó un ID de usuario')
            setLoading(false)
            return
        }

        fetch(`/api/admin/store-database?userId=${userId}`)
            .then(res => res.json())
            .then(res => {
                if (res.error) setError(res.error)
                else setData(res)
                setLoading(false)
            })
            .catch(err => {
                setError('Error de conexión')
                setLoading(false)
            })
    }, [userId])

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>Cargando base de datos...</div>
    if (error) return <div style={{ padding: 40, color: 'red', fontFamily: 'system-ui, sans-serif', fontWeight: 'bold' }}>Error: {error}</div>
    if (!data || !data.stores) return <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>No hay datos disponibles</div>

    const { user, stores } = data

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif", color: '#1e293b' }}>
            {/* Header Global */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Base de Datos del Vendedor</h1>
                    <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 14 }}>{user.name} ({user.email}) - Wa: {user.phone}</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => window.print()} style={{ background: 'white', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Imprimir Reporte</button>
                    <button onClick={() => window.close()} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Cerrar Pestaña</button>
                </div>
            </div>

            <div style={{ padding: '40px' }}>
                {stores.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16 }}>Este usuario no tiene tiendas creadas.</div>
                ) : stores.map((store: any) => {
                    
                    // Cálculos de Resumen
                    const totalProducts = store.products.length
                    const activeProducts = store.products.filter((p: any) => p.is_active).length
                    
                    const completedOrders = store.orders.filter((o: any) => o.status === 'completed' || o.status === 'delivered')
                    const totalSales = completedOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
                    
                    // Clientes
                    const clientsMap: Record<string, { name: string, email: string, totalSpent: number, ordersCount: number, lastOrder: string }> = {}
                    
                    store.orders.forEach((o: any) => {
                        // Ignoramos cancelados para el gasto total, pero los contamos para el registro si queremos (aquí solo contamos completados para gastos)
                        const isCompleted = o.status === 'completed' || o.status === 'delivered'
                        
                        const key = o.buyer_email || o.buyer_name || 'Desconocido'
                        if (!clientsMap[key]) {
                            clientsMap[key] = {
                                name: o.buyer_name || 'Sin nombre',
                                email: o.buyer_email || 'Sin correo',
                                totalSpent: 0,
                                ordersCount: 0,
                                lastOrder: o.created_at
                            }
                        }
                        
                        if (isCompleted) {
                            clientsMap[key].totalSpent += (Number(o.total_amount) || 0)
                        }
                        clientsMap[key].ordersCount += 1
                        
                        if (new Date(o.created_at) > new Date(clientsMap[key].lastOrder)) {
                            clientsMap[key].lastOrder = o.created_at
                        }
                    })

                    const clientsList = Object.values(clientsMap).sort((a, b) => b.totalSpent - a.totalSpent)

                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localecomer.store'
                    const storeUrl = `${baseUrl}/tienda/${store.slug}`

                    return (
                        <div key={store.id} style={{ marginBottom: 60, background: 'white', borderRadius: 24, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                            {/* Store Header */}
                            <div style={{ padding: 30, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#1e293b' }}>{store.name}</h2>
                                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', background: store.is_active ? '#dcfce7' : '#fee2e2', color: store.is_active ? '#16a34a' : '#ef4444' }}>
                                            {store.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: 16 }}>
                                        <a href={storeUrl} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>{storeUrl}</a>
                                    </p>
                                    <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: 14 }}>Creada el: {new Date(store.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div style={{ textAlign: 'center', background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8 }}>QR de la tienda</div>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(storeUrl)}`} alt="QR Code" style={{ borderRadius: 8 }} />
                                </div>
                            </div>

                            {/* Resumen */}
                            <div style={{ padding: 30, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, background: '#f8fafc' }}>
                                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Total Productos</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{totalProducts}</div>
                                </div>
                                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Productos Activos</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a' }}>{activeProducts}</div>
                                </div>
                                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Total Ventas (Completadas)</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#6366f1' }}>${totalSales.toLocaleString('es-CO')}</div>
                                </div>
                                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Clientes Únicos</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#eab308' }}>{clientsList.length}</div>
                                </div>
                            </div>

                            {/* Productos */}
                            <div style={{ padding: 30, borderTop: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 900, color: '#1e293b', borderLeft: '4px solid #6366f1', paddingLeft: 12 }}>📦 Base de Datos de Productos</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Imagen</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Nombre</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Categoría</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>SKU</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Precio</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Stock</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Estado</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Fecha Creación</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.products.length === 0 ? (
                                                <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No hay productos</td></tr>
                                            ) : store.products.map((p: any, idx: number) => {
                                                const img = Array.isArray(p.images) && p.images.length > 0 ? (p.images[0].thumbnail || p.images[0].full) : null
                                                return (
                                                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            {img ? <img src={img} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} alt={p.name} /> : <div style={{ width: 40, height: 40, background: '#e2e8f0', borderRadius: 8 }}></div>}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#334155' }}>{p.name}</td>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{p.category_id || 'N/A'}</td>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14, fontFamily: 'monospace' }}>{p.sku || 'N/A'}</td>
                                                        <td style={{ padding: '12px 16px', fontWeight: 900, color: '#6366f1' }}>${(Number(p.price) || 0).toLocaleString('es-CO')}</td>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{p.stock ?? 'N/A'}</td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 12, background: p.is_active ? '#dcfce7' : '#fee2e2', color: p.is_active ? '#16a34a' : '#ef4444' }}>
                                                                {p.is_active ? 'ACTIVO' : 'INACTIVO'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{new Date(p.created_at).toLocaleDateString('es-CO')}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Ventas */}
                            <div style={{ padding: 30, borderTop: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 900, color: '#1e293b', borderLeft: '4px solid #10b981', paddingLeft: 12 }}>💰 Base de Datos de Pedidos / Ventas</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1000 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Fecha</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Cliente</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Contacto</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Artículos</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Total</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.orders.length === 0 ? (
                                                <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No hay pedidos</td></tr>
                                            ) : store.orders.map((o: any, idx: number) => {
                                                const itemsList = o.items.map((i: any) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ')
                                                return (
                                                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{new Date(o.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#334155' }}>{o.buyer_name || 'N/A'}</td>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{o.buyer_email || 'N/A'}<br/>{o.shipping_address?.phone || ''}</td>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={itemsList}>{itemsList || 'Sin items'}</td>
                                                        <td style={{ padding: '12px 16px', fontWeight: 900, color: '#10b981' }}>${(Number(o.total_amount) || 0).toLocaleString('es-CO')}</td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 12, background: o.status === 'completed' || o.status === 'delivered' ? '#dcfce7' : o.status === 'cancelled' ? '#fee2e2' : '#fef3c7', color: o.status === 'completed' || o.status === 'delivered' ? '#16a34a' : o.status === 'cancelled' ? '#ef4444' : '#d97706' }}>
                                                                {o.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Clientes */}
                            <div style={{ padding: 30, borderTop: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 900, color: '#1e293b', borderLeft: '4px solid #f59e0b', paddingLeft: 12 }}>👥 Base de Datos de Clientes</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Cliente</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Email</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Total Pedidos</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Total Gastado</th>
                                                <th style={{ padding: '12px 16px', fontWeight: 900 }}>Última Compra</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientsList.length === 0 ? (
                                                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No hay clientes registrados</td></tr>
                                            ) : clientsList.map((c: any, idx: number) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#334155' }}>{c.name}</td>
                                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{c.email}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 900, color: '#f59e0b' }}>{c.ordersCount} pedidos</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 900, color: '#10b981' }}>${c.totalSpent.toLocaleString('es-CO')}</td>
                                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{new Date(c.lastOrder).toLocaleDateString('es-CO')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function StoreDbPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>Cargando página...</div>}>
            <StoreDbContent />
        </Suspense>
    )
}
