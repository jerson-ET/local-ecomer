'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus,
  Users,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  Store,
  Crown,
  AlertCircle,
  Search,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Loader2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import SalesChatCenter from './SalesChatCenter'

interface SalesStat {
  totalCreated: number
  activeSellers: number
  pendingPayment: number
  totalCommissions: number
}

interface CreatedSeller {
  id: string
  name: string
  email: string
  whatsapp: string | null
  city: string | null
  paidUntil: string | null
  createdAt: string
  isActive: boolean
}

export default function SalesPanel({ initialActiveTab, onTabChange }: { initialActiveTab?: string, onTabChange?: (tab: string) => void }) {
  const [activeTab, setActiveTab] = useState<'create' | 'my-sellers' | 'stats' | 'messages'>(() => {
    if (initialActiveTab === 'sales-messages') return 'messages';
    if (initialActiveTab === 'sales-panel') return 'create';
    if (initialActiveTab === 'my-sellers') return 'my-sellers';
    if (initialActiveTab === 'sales-stats') return 'stats';
    return 'create';
  });

  useEffect(() => {
    if (initialActiveTab === 'sales-messages') {
      setActiveTab('messages')
    } else if (initialActiveTab === 'sales-panel') {
      setActiveTab('create')
    } else if (initialActiveTab === 'my-sellers') {
      setActiveTab('my-sellers')
    } else if (initialActiveTab === 'sales-stats') {
      setActiveTab('stats')
    }
  }, [initialActiveTab])

  const handleTabChange = (tab: 'create' | 'my-sellers' | 'stats' | 'messages') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  }
  const [stats, setStats] = useState<SalesStat>({ totalCreated: 0, activeSellers: 0, pendingPayment: 0, totalCommissions: 0 })
  const [sellers, setSellers] = useState<CreatedSeller[]>([])
  const [loading, setLoading] = useState(false)
  const [resultMsg, setResultMsg] = useState<{ text: string; isError: boolean } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [createdUserInfo, setCreatedUserInfo] = useState<{ name: string; email: string; password: string } | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp: '',
    city: '',
    docType: 'CC',
    docNumber: '',
    storeCategory: '',
    country: 'Colombia',
    paymentStatus: ''
  })
  const [creating, setCreating] = useState(false)

  const fetchSellers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const allUsers: any[] = data.users || []
        // Only show sellers (filter role: seller)
        const mySellers = allUsers.filter((u: any) => u.role === 'seller')
        setSellers(mySellers.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          whatsapp: u.whatsapp,
          city: u.city,
          paidUntil: u.paidUntil,
          createdAt: u.createdAt,
          isActive: u.isActive,
        })))
        const active = mySellers.filter((u: any) => {
          if (!u.paidUntil) return false
          return new Date(u.paidUntil) > new Date()
        }).length
        const pending = mySellers.filter((u: any) => u.pending_verification).length
        setStats({
          totalCreated: mySellers.length,
          activeSellers: active,
          pendingPayment: pending,
          totalCommissions: active * 25000
        })
      }
    } catch (e) {
      console.error('Error cargando vendedores:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSellers()
  }, [fetchSellers])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setResultMsg({ text: 'Nombre, correo y contraseña son obligatorios', isError: true })
      return
    }
    if (form.password.length < 6) {
      setResultMsg({ text: 'La contraseña debe tener mínimo 6 caracteres', isError: true })
      return
    }
    if (!form.paymentStatus) {
      setResultMsg({ text: 'Debes seleccionar si se realizó el pago o está pendiente', isError: true })
      return
    }
    setCreating(true)
    setResultMsg(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'seller' })
      })
      const data = await res.json()
      if (res.ok) {
        setCreatedUserInfo({ name: form.name, email: form.email, password: form.password })
        setResultMsg({ text: `✅ Cuenta de tienda creada para ${form.name}`, isError: false })
        setForm({ name: '', email: '', password: '', whatsapp: '', city: '', docType: 'CC', docNumber: '', storeCategory: '', country: 'Colombia', paymentStatus: '' })
        fetchSellers()
      } else {
        setResultMsg({ text: data.error || 'Error al crear la cuenta', isError: true })
      }
    } catch {
      setResultMsg({ text: 'Error de conexión', isError: true })
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const filteredSellers = sellers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '32px 24px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 10, display: 'flex' }}>
              <Store size={24} color="#818cf8" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Área de Ventas</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 600 }}>Registro de Nuevos Comerciantes</p>
            </div>
          </div>

          {/* Stats Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 24 }}>
            {[
              { label: 'Registrados', value: stats.totalCreated, icon: '👥', color: '#818cf8' },
              { label: 'Activos', value: stats.activeSellers, icon: '✅', color: '#34d399' },
              { label: 'Pendientes', value: stats.pendingPayment, icon: '⏳', color: '#fbbf24' },
              { label: 'Comisiones', value: `$${(stats.totalCommissions).toLocaleString('es-CO')}`, icon: '💰', color: '#f472b6' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 4 }}>
          {([
            { id: 'create', label: '➕ Crear Cuenta', icon: UserPlus },
            { id: 'my-sellers', label: '🏪 Mis Vendedores', icon: Users },
            { id: 'stats', label: '💰 Comisiones', icon: DollarSign },
            { id: 'messages', label: '💬 Mensajes', icon: MessageSquare },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'transparent',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #6366f1' : '3px solid transparent',
                color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'messages' ? (
        <div style={{ padding: 0 }}>
          <SalesChatCenter />
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px' }}>
        
        {/* Toast */}
        {resultMsg && (
          <div style={{
            padding: '14px 20px', borderRadius: 14, marginBottom: 20, fontWeight: 700, fontSize: 13,
            background: resultMsg.isError ? '#fef2f2' : '#f0fdf4',
            color: resultMsg.isError ? '#ef4444' : '#16a34a',
            border: `1px solid ${resultMsg.isError ? '#fecaca' : '#bbf7d0'}`,
            display: 'flex', alignItems: 'center', gap: 8
          }} onClick={() => setResultMsg(null)}>
            {resultMsg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {resultMsg.text}
          </div>
        )}

        {/* Credentials Card */}
        {createdUserInfo && (
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 20, padding: 24, marginBottom: 24, border: '1px solid rgba(99,102,241,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Crown size={20} color="#fbbf24" />
              <span style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>Cuenta creada — Comparte estas credenciales con el comerciante</span>
            </div>
            {[{ label: 'Nombre', val: createdUserInfo.name }, { label: 'Correo', val: createdUserInfo.email }, { label: 'Contraseña', val: createdUserInfo.password }].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{item.val}</div>
                </div>
                <button onClick={() => copyToClipboard(item.val)} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}>
                  <Copy size={12} /> Copiar
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const msg = `🏪 *Tu cuenta de LocalEcomer*\n\n👤 Usuario: ${createdUserInfo.name}\n📧 Correo: ${createdUserInfo.email}\n🔑 Contraseña: ${createdUserInfo.password}\n\n🔗 Ingresa en: https://localecomer.store/login\n\n_Guarda estos datos en un lugar seguro._`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              style={{ marginTop: 12, width: '100%', background: '#25d366', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 900, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar por WhatsApp
            </button>
            <button onClick={() => setCreatedUserInfo(null)} style={{ marginTop: 8, width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: '10px 0', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cerrar</button>
          </div>
        )}

        {/* CREATE TAB */}
        {activeTab === 'create' && (
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>Registrar Nuevo Comerciante</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>Solo crea la cuenta después de confirmar que el cliente ya realizó el pago. Recuerda que el cliente te paga a ti y tú le reportas al área administrativa.</p>
            </div>

            {/* Important note */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#92400e' }}>⚠️ Importante — Solo crear si hay pago</div>
                <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Crea la cuenta únicamente si el comerciante ya te entregó el dinero ($50.000 COP). De ese valor, $25.000 son tu comisión y $25.000 los reportas al administrador.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nombre Completo del Comerciante *</label>
                <input style={inputStyle} placeholder="ej: Carlos Rodríguez" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Correo Electrónico *</label>
                <input style={inputStyle} type="email" placeholder="carlos@correo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: 44 }} type={showPassword ? 'text' : 'password'} placeholder="Mín. 6 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', marginTop: -8 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button onClick={() => setForm({...form, password: generatePassword()})} style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>⚡ Generar contraseña segura</button>
              </div>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input style={inputStyle} placeholder="3001234567" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input style={inputStyle} placeholder="Bogotá, Medellín..." value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Tipo de Documento</label>
                <select style={selectStyle} value={form.docType} onChange={e => setForm({...form, docType: e.target.value})}>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">Cédula Extranjería</option>
                  <option value="PAS">Pasaporte</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Número de Documento</label>
                <input style={inputStyle} placeholder="1234567890" value={form.docNumber} onChange={e => setForm({...form, docNumber: e.target.value})} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Categoría del Negocio</label>
                <input style={inputStyle} placeholder="ej: Moda, Tecnología, Alimentos, Hogar..." value={form.storeCategory} onChange={e => setForm({...form, storeCategory: e.target.value})} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Estado de Pago *</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <button 
                    type="button"
                    onClick={() => setForm({...form, paymentStatus: 'paid'})}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: `2px solid ${form.paymentStatus === 'paid' ? '#10b981' : '#e5e7eb'}`,
                      backgroundColor: form.paymentStatus === 'paid' ? '#d1fae5' : '#ffffff',
                      color: form.paymentStatus === 'paid' ? '#065f46' : '#4b5563',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    ✅ Realizó el Pago
                  </button>
                  <button 
                    type="button"
                    onClick={() => setForm({...form, paymentStatus: 'pending'})}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: `2px solid ${form.paymentStatus === 'pending' ? '#f59e0b' : '#e5e7eb'}`,
                      backgroundColor: form.paymentStatus === 'pending' ? '#fffbeb' : '#ffffff',
                      color: form.paymentStatus === 'pending' ? '#92400e' : '#4b5563',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    ⏳ Pago Pendiente
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                marginTop: 28, width: '100%', background: creating ? '#c7d2fe' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', border: 'none', borderRadius: 16, padding: '16px 0',
                fontWeight: 900, fontSize: 16, cursor: creating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: creating ? 'none' : '0 8px 25px rgba(79,70,229,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {creating ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={20} />}
              {creating ? 'Creando cuenta...' : 'Crear Cuenta de Tienda'}
            </button>
          </div>
        )}

        {/* MY SELLERS TAB */}
        {activeTab === 'my-sellers' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Search size={16} color="#cbd5e1" />
                <input placeholder="Buscar comerciante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', outline: 'none', fontWeight: 600, fontSize: 13, width: '100%', background: 'transparent' }} />
              </div>
              <button onClick={fetchSellers} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <RefreshCw size={16} color="#6366f1" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>

            {filteredSellers.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '60px 24px', textAlign: 'center' }}>
                <Users size={40} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 13 }}>No has registrado comerciantes aún</p>
                <p style={{ color: '#e2e8f0', fontSize: 12, marginTop: 4 }}>Empieza creando tu primera cuenta en la pestaña "Crear Cuenta"</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredSellers.map(s => {
                  const daysLeft = s.paidUntil ? Math.ceil((new Date(s.paidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
                  const isExpired = daysLeft !== null && daysLeft <= 0
                  return (
                    <div key={s.id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>{s.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
                            {s.email && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} />{s.email}</span>}
                            {s.whatsapp && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={11} />{s.whatsapp}</span>}
                            {s.city && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{s.city}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {!s.paidUntil ? (
                            <span style={{ fontSize: 10, fontWeight: 900, background: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>Sin plan</span>
                          ) : isExpired ? (
                            <span style={{ fontSize: 10, fontWeight: 900, background: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>⛔ Vencido</span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 900, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>✅ {daysLeft}d activo</span>
                          )}
                          <div style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600, marginTop: 4 }}>Registrado: {new Date(s.createdAt).toLocaleDateString('es-CO')}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>Mis Comisiones</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px', fontWeight: 500 }}>Ganas $25.000 COP por cada comerciante activo que hayas registrado.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Total Registrados', value: stats.totalCreated, color: '#6366f1', bg: '#eef2ff', unit: 'comerciantes' },
                { label: 'Con Plan Activo', value: stats.activeSellers, color: '#16a34a', bg: '#f0fdf4', unit: 'activos' },
                { label: 'Comisiones Estimadas', value: `$${stats.totalCommissions.toLocaleString('es-CO')}`, color: '#d97706', bg: '#fffbeb', unit: 'COP' },
                { label: 'Tasa de Conversión', value: stats.totalCreated > 0 ? `${Math.round((stats.activeSellers / stats.totalCreated) * 100)}%` : '0%', color: '#7c3aed', bg: '#faf5ff', unit: 'activaron' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 20, padding: '20px', border: `1px solid ${s.bg}` }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color, opacity: 0.7, marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: s.color, opacity: 0.5, marginTop: 1 }}>{s.unit}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 20, padding: '24px', color: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>💡 Cómo funciona</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                Cada comerciante te paga <strong style={{ color: '#fbbf24' }}>$50.000 COP</strong> directamente.<br/>
                <strong style={{ color: '#34d399' }}>$25.000</strong> son tu comisión por venta.<br/>
                <strong style={{ color: '#f472b6' }}>$25.000</strong> los reportas al área administrativa.<br/>
                Las comisiones aplican mientras el comerciante tenga su plan activo.
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
  color: '#94a3b8', marginBottom: 6, letterSpacing: '0.5px'
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', border: '2px solid #f1f5f9', borderRadius: 14,
  fontWeight: 600, fontSize: 14, outline: 'none', background: '#fafafa',
  transition: 'border-color 0.2s', boxSizing: 'border-box', marginBottom: 0
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', border: '2px solid #f1f5f9', borderRadius: 14,
  fontWeight: 600, fontSize: 14, outline: 'none', background: '#fafafa', cursor: 'pointer'
}
