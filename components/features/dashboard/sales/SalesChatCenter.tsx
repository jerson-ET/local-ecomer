'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Mail, Phone, MessageCircle, Store, Loader2, Shield } from 'lucide-react'

interface StoreContact {
  id: string
  name: string
  slug: string
  logo_url: string | null
  sellerName: string
  sellerEmail: string
  sellerPhone: string | null
}

export default function SalesChatCenter() {
  const [stores, setStores] = useState<StoreContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchStores = async () => {
      try {
        // Consultar todas las tiendas y unirlas con el perfil del vendedor
        const { data, error } = await supabase
          .from('stores')
          .select(`
            id,
            name,
            slug,
            logo_url,
            user_id,
            profiles:user_id (
              nombre,
              email,
              telefono
            )
          `)
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (error) throw error

        const mappedStores: StoreContact[] = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          logo_url: s.logo_url,
          sellerName: s.profiles?.nombre || s.profiles?.email?.split('@')[0] || 'Vendedor',
          sellerEmail: s.profiles?.email || '',
          sellerPhone: s.profiles?.telefono || null
        }))

        setStores(mappedStores)
      } catch (err) {
        console.error('Error cargando tiendas en el directorio:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [])

  const filteredStores = stores.filter(store => {
    const name = store.name.toLowerCase()
    const seller = store.sellerName.toLowerCase()
    const search = searchTerm.toLowerCase()
    return name.includes(search) || seller.includes(search)
  })

  // Limpiar número de teléfono para WhatsApp
  const formatWhatsAppLink = (phone: string | null, storeName: string) => {
    if (!phone) return '#'
    const cleanPhone = phone.replace(/\D/g, '')
    const fullPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone
    const message = `Hola, te contacto del área de soporte comercial de LocalEcomer sobre tu tienda "${storeName}".`
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
  }

  return (
    <div style={{ padding: '32px 24px', minHeight: 'calc(100vh - 140px)', background: '#f8fafc', borderRadius: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          🏪 Directorio de Comercios y Ventas
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '600px', margin: '0 auto 24px', fontWeight: 500, lineHeight: 1.6 }}>
          Visualiza todas las tiendas activas registradas en el sistema. Puedes contactar a sus dueños (vendedores) directamente por WhatsApp para brindarles soporte o asesoría.
        </p>

        {/* Buscador */}
        <div style={{ maxWidth: '440px', margin: '0 auto', position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre de tienda o vendedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              outline: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: '#334155',
              background: '#fff',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <Loader2 size={32} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Cargando comercios...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <Store size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontWeight: 700, fontSize: '15px', margin: 0 }}>No se encontraron comercios</p>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px', margin: 0 }}>Por favor verifica los términos ingresados en el buscador.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {filteredStores.map((store) => {
            const hasPhone = !!store.sellerPhone
            return (
              <div 
                key={store.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className="store-card"
              >
                {/* Badge Activo */}
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: '20px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  letterSpacing: '0.5px'
                }}>
                  Tienda Activa
                </span>

                {/* Logo o Icono de Tienda */}
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  background: '#f1f5f9',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.02)',
                  border: '2px solid #e2e8f0',
                  overflow: 'hidden'
                }}>
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Store size={32} />
                  )}
                </div>

                {/* Info de Tienda */}
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                  {store.name}
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '16px', wordBreak: 'break-all' }}>
                  @{store.slug}
                </span>

                <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', padding: '16px 0 20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                    <Shield size={14} color="#6366f1" />
                    <span style={{ fontWeight: 700, color: '#475569' }}>{store.sellerName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                    <Mail size={14} />
                    <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{store.sellerEmail}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                    <Phone size={14} />
                    <span style={{ fontWeight: 500 }}>{store.sellerPhone || 'Sin teléfono'}</span>
                  </div>
                </div>

                {/* Acción WhatsApp */}
                <a
                  href={hasPhone ? formatWhatsAppLink(store.sellerPhone, store.name) : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!hasPhone) {
                      e.preventDefault()
                      alert('Este vendedor no tiene un número de celular configurado para WhatsApp.')
                    }
                  }}
                  style={{
                    width: '100%',
                    background: hasPhone ? '#25d366' : '#cbd5e1',
                    color: '#fff',
                    padding: '12px 0',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: hasPhone ? '0 4px 15px rgba(37, 211, 102, 0.25)' : 'none',
                    cursor: hasPhone ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                  className="whatsapp-btn"
                >
                  <MessageCircle size={18} />
                  Contactar por WhatsApp
                </a>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .store-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.06) !important;
          border-color: #cbd5e1 !important;
        }
        .whatsapp-btn:hover {
          filter: brightness(0.95);
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
