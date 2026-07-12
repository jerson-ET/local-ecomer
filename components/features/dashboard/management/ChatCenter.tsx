'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Mail, Phone, MessageCircle, Shield, Loader2 } from 'lucide-react'

interface Advisor {
  id: string
  nombre: string | null
  email: string | null
  telefono: string | null
  avatar_url: string | null
  role: string
}

export default function ChatCenter() {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        // Consultar perfiles con rol 'sales' (asesores) o 'admin'/'superadmin'
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nombre, email, telefono, avatar_url, role')
          .in('role', ['sales', 'admin', 'superadmin'])
          .order('nombre', { ascending: true })

        if (error) throw error
        setAdvisors(data || [])
      } catch (err) {
        console.error('Error cargando asesores de soporte:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdvisors()
  }, [])

  const filteredAdvisors = advisors.filter(advisor => {
    const name = advisor.nombre?.toLowerCase() || ''
    const email = advisor.email?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    return name.includes(search) || email.includes(search)
  })

  // Limpiar número de teléfono para WhatsApp (ej: eliminar caracteres no numéricos)
  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return '#'
    // Eliminar caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '')
    // Si no empieza con código de país, asumir Colombia (57) por defecto
    const fullPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone
    
    const message = `Hola, te contacto desde el panel de LocalEcomer. Mi nombre es comerciante.`
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
  }

  return (
    <div style={{ padding: '32px 24px', minHeight: 'calc(100vh - 140px)', background: '#f8fafc', borderRadius: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          📞 Soporte Comercial LocalEcomer
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '600px', margin: '0 auto 24px', fontWeight: 500, lineHeight: 1.6 }}>
          ¿Tienes alguna duda, necesitas reportar un pago o quieres ayuda con tu catálogo? Contacta a cualquiera de nuestros asesores oficiales directamente por WhatsApp.
        </p>

        {/* Buscador */}
        <div style={{ maxWidth: '440px', margin: '0 auto', position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar asesor por nombre..." 
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
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Cargando asesores de soporte...</p>
        </div>
      ) : filteredAdvisors.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <Shield size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontWeight: 700, fontSize: '15px', margin: 0 }}>No se encontraron asesores activos</p>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px', margin: 0 }}>Por favor intenta de nuevo más tarde o verifica el nombre buscado.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {filteredAdvisors.map((advisor) => {
            const hasPhone = !!advisor.telefono
            return (
              <div 
                key={advisor.id}
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
                className="advisor-card"
              >
                {/* Badge Rol */}
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: '20px',
                  background: advisor.role === 'sales' ? '#eef2ff' : '#fff7ed',
                  color: advisor.role === 'sales' ? '#4f46e5' : '#ea580c',
                  letterSpacing: '0.5px'
                }}>
                  {advisor.role === 'sales' ? 'Asesor Oficial' : 'Administrador'}
                </span>

                {/* Avatar */}
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.15)',
                  border: '3px solid #fff'
                }}>
                  {advisor.nombre?.charAt(0).toUpperCase() || '?'}
                </div>

                {/* Info */}
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  {advisor.nombre || 'Asesor de Ventas'}
                </h3>
                
                {/* Estado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disponible</span>
                </div>

                <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', padding: '16px 0 20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                    <Mail size={14} />
                    <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{advisor.email || 'soporte@localecomer.app'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                    <Phone size={14} />
                    <span style={{ fontWeight: 500 }}>{advisor.telefono || 'Sin teléfono registrado'}</span>
                  </div>
                </div>

                {/* Acción WhatsApp */}
                <a
                  href={hasPhone ? formatWhatsAppLink(advisor.telefono) : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!hasPhone) {
                      e.preventDefault()
                      alert('Este asesor no tiene un número de celular configurado para WhatsApp.')
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
        .advisor-card:hover {
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
