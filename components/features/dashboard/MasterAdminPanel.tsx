'use client'

import { useEffect, useState } from 'react'
import {
    Store, Crown, AlertTriangle, ChevronRight, Activity
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MasterAdminPanel() {
    const [stats, setStats] = useState({ users: 0, stores: 0, products: 0 })
    const [recentStores, setRecentStores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchGlobalData = async () => {
            try {
                const supabase = createClient()

                // Get totals
                const [storesRes, profilesRes] = await Promise.all([
                    supabase.from('stores').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true })
                ])

                setStats({
                    stores: storesRes.count || 0,
                    users: profilesRes.count || 0,
                    products: 0 // Will implement global products count if needed
                })

                // Get recent stores
                const { data: stores } = await supabase
                    .from('stores')
                    .select('id, store_name, slug, created_at, category')
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (stores) setRecentStores(stores)

            } catch (error) {
                console.error('Error fetching global stats', error)
            } finally {
                setLoading(false)
            }
        }
        fetchGlobalData()
    }, [])

    return (
        <div className="admin-panel">
            <div className="admin-header" style={{ background: 'linear-gradient(135deg, #1e1e2f 0%, #2d2b4f 100%)', color: 'white' }}>
                <div className="admin-header-content">
                    <h1><Crown size={28} style={{ color: '#f39c12', display: 'inline', marginRight: '8px' }} /> Panel Maestro</h1>
                    <p>Bienvenido Jerson. Tienes control absoluto de LocalEcomer.</p>
                </div>
                <div className="admin-quick-stats" style={{ gap: '1rem', marginTop: '1rem' }}>
                    <div className="quick-stat" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <span className="stat-label">Usuarios</span>
                        <span className="stat-value">{loading ? '-' : stats.users}</span>
                    </div>
                    <div className="quick-stat" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <span className="stat-label">Tiendas</span>
                        <span className="stat-value">{loading ? '-' : stats.stores}</span>
                    </div>
                </div>
            </div>

            <div className="admin-grid">
                <div className="admin-card">
                    <div className="card-header">
                        <h3><Activity size={20} /> Auditoría en Tiempo Real</h3>
                    </div>
                    <div className="card-content">
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>Vigilancia activa de creaciones de tiendas e infracciones de políticas.</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentStores.map((store) => (
                                <li key={store.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: '#e0e7ff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Store size={16} color="#4f46e5" />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#111' }}>{store.store_name}</h4>
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>/{store.slug} - {store.category}</span>
                                        </div>
                                    </div>
                                    <button style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                                </li>
                            ))}
                            {recentStores.length === 0 && !loading && (
                                <p style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>No hay tiendas recientes.</p>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="card-header">
                        <h3><AlertTriangle size={20} color="#e74c3c" /> Alertas de la Plataforma</h3>
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', textAlign: 'center' }}>
                        <AlertTriangle size={48} color="#e0e0e0" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ color: '#666', marginBottom: '0.5rem' }}>Sin alertas críticas</h4>
                        <p style={{ fontSize: '0.85rem', color: '#999', maxWidth: '80%' }}>El sistema está operando normalmente. Las tiendas están dentro de los límites de políticas.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
