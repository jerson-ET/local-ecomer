'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Crown,
  ChevronDown,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  Monitor,
  UserPlus,
} from 'lucide-react'

// Subcomponente para cuenta regresiva en vivo
export const CountdownTimer = ({ expiryDate }: { expiryDate: string | Date }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null)

  useEffect(() => {
    const calcTimer = () => {
      const diff = new Date(expiryDate).getTime() - new Date().getTime()
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        })
      }
    }
    calcTimer()
    const intv = setInterval(calcTimer, 1000)
    return () => clearInterval(intv)
  }, [expiryDate])

  if (!timeLeft) return <span>Calculando...</span>
  if (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0) return <span className="text-rose-500 font-bold">VENCIDO</span>

  return (
    <span style={{ fontFamily: 'monospace', letterSpacing: '-0.5px' }} className="text-indigo-600 font-bold">
      {timeLeft.d}d {timeLeft.h}h {timeLeft.m}m {timeLeft.s}s
    </span>
  )
}

interface UserProduct {
  id: string
  name: string
  price: number
  storeId: string
  image: string | null
  isActive: boolean
}

interface UserStore {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface UserSanction {
  reason: string
  expiresAt: string
  days: number
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  documentType: string | null
  documentNumber: string | null
  country: string | null
  city: string | null
  whatsapp: string | null
  storeCategory: string | null
  createdAt: string
  lastSeen: string | null
  stores: UserStore[]
  storeCount: number
  products: UserProduct[]
  productCount: number
  earnings: {
    id: string
    category: 'referral' | 'product_sale'
    amount: number
    description: string
    createdAt: string
  }[]
  sanction: UserSanction | null
  passwordPlain: string | null
  paidUntil: string | null
  invoices: any[]
  isActive: boolean
  referralCode: string | null
  nequiNumber: string | null
  affiliateProspects: {
    id: string
    name: string
    whatsapp: string
    cedula?: string
    location?: string
    status: 'pending' | 'active'
    createdAt: string
  }[]
}

export default function MasterAdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [activeTab, setActiveTab] = useState<'users' | 'recommendations'>('users')

  // Modales
  const [deleteModal, setDeleteModal] = useState<{ type: 'user' | 'product'; id: string; name: string; userId?: string } | null>(null)
  const [resultMessage, setResultMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [createUserModal, setCreateUserModal] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'seller', whatsapp: '', docType: 'CC', docNumber: '', city: '', country: 'Colombia', storeCategory: '' })
  const [creatingUser, setCreatingUser] = useState(false)
  const [passwordModal, setPasswordModal] = useState<{ userId: string; userName: string, currentPassword: string | null } | null>(null)
  
  const [editUserModal, setEditUserModal] = useState<{
    userId: string
    name: string
    docType: string
    docNumber: string
    country: string
    city: string
    whatsapp: string
    storeCategory: string
    referralCode: string
  } | null>(null)
  const [editDaysModal, setEditDaysModal] = useState<{
    userId: string
    userName: string
    actionFlag: 'extend_plan' | 'set_plan'
  } | null>(null)
  const [manualDays, setManualDays] = useState('30')

  // Activar Prospecto (Crear Usuario desde Referido)
  const [quickRegisterModal, setQuickRegisterModal] = useState<{
    prospectId: string
    affiliateId: string
    name: string
    whatsapp: string
    cedula: string
    location: string
  } | null>(null)
  const [quickUser, setQuickUser] = useState({ email: '', password: '', referralCode: '' })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (e) {
      console.error('Error cargando usuarios:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const askDeleteUser = (userId: string, userName: string) => {
    setDeleteModal({ type: 'user', id: userId, name: userName })
  }

  const executeDelete = async () => {
    if (!deleteModal) return
    const { type, id, name } = deleteModal
    setDeleteModal(null)
    setResultMessage(null)

    try {
      const url = type === 'user' ? `/api/admin/users?userId=${id}` : `/api/admin/products?productId=${id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) {
        setResultMessage({ text: `Eliminado correctamente: ${name}`, isError: false })
        fetchUsers()
      } else {
        const data = await res.json().catch(() => ({ error: 'Error' }))
        setResultMessage({ text: data.error || 'Error al eliminar', isError: true })
      }
    } catch (err: any) {
      setResultMessage({ text: err.message || 'Error de red', isError: true })
    }
  }

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...data }),
      })
      const resData = await res.json()
      if (res.ok) {
        setResultMessage({ text: resData.message || 'OK', isError: false })
        if (action === 'update_info') setEditUserModal(null)
        if (action === 'change_password') setPasswordModal(null)
        if (action === 'extend_plan') setEditDaysModal(null)
        if (action === 'activate_prospect_full') setQuickRegisterModal(null)
        fetchUsers()
      } else {
        setResultMessage({ text: resData.error || 'Error', isError: true })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const roleLabel = (role: string) => {
    const labels: any = { buyer: '🛒 Comprador', seller: '💼 Vendedor', reseller: '🚀 Recomendador', admin: '👑 Administrador', super_admin: '💎 Super Admin' }
    return labels[role] || role
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-7xl flex justify-between items-center p-6 bg-white border-b border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] flex items-center gap-3">
             <ShieldAlert className="text-indigo-600" size={28} /> Panel Maestro
          </h1>
          <p className="text-gray-500 text-sm font-medium">LocalEcomer Control</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-1 rounded-2xl flex shadow-inner">
            <button onClick={() => setViewMode('mobile')} className={`p-2 rounded-xl transition-all ${viewMode === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>
               <Smartphone size={20} />
            </button>
            <button onClick={() => setViewMode('desktop')} className={`p-2 rounded-xl transition-all ${viewMode === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>
               <Monitor size={20} />
            </button>
          </div>
          <button onClick={fetchUsers} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={20} className={`${loading ? 'animate-spin' : ''} text-indigo-600`} />
          </button>
        </div>
      </div>

      <div className={`w-full transition-all duration-500 ${viewMode === 'mobile' ? 'max-w-[450px] my-8 rounded-[50px] border-[12px] border-[#1a1a1a] shadow-2xl h-[850px] overflow-hidden' : 'max-w-[1200px] mt-8 bg-white rounded-3xl shadow-lg min-h-[80vh]'}`}>
        <div className="h-full overflow-y-auto no-scrollbar p-6">
          
          <div className="bg-[#0f172a] text-white p-10 rounded-[2.5rem] mb-8 relative overflow-hidden">
             <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12"><Crown size={200} /></div>
             <h2 className="text-3xl font-black mb-2">Administrador Maestro</h2>
             <p className="opacity-60 font-bold uppercase text-[10px] tracking-widest">Total Usuarios: {users.length}</p>
             <div className="flex gap-4 mt-8">
               <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>👥 Lista Usuarios</button>
               <button onClick={() => setActiveTab('recommendations')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'recommendations' ? 'bg-white text-indigo-600 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>🏆 Recomendados</button>
             </div>
          </div>

          {activeTab === 'users' && (
            <div className="space-y-6">
               <div className="flex gap-4 items-center">
                  <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <Search size={20} className="text-gray-300" />
                    <input placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none w-full font-bold text-sm" />
                  </div>
                  <button onClick={() => setCreateUserModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"><UserPlus size={20} /> CREAR</button>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="border border-gray-100 rounded-3xl overflow-hidden hover:border-indigo-100 transition-all">
                       <div className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50/50" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">{user.name[0]?.toUpperCase()}</div>
                             <div>
                                <div className="font-black text-slate-800">{user.name}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">{user.email}</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-[10px] font-black bg-gray-100 text-gray-400 px-3 py-1.5 rounded-full uppercase tracking-wider">{roleLabel(user.role)}</span>
                             <ChevronDown size={20} className={`transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`} />
                          </div>
                       </div>
                       {expandedUser === user.id && (
                         <div className="p-8 bg-gray-50/50 border-t border-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                  <span className="text-[10px] font-black text-gray-300 uppercase block mb-1">WhatsApp / Contacto</span>
                                  <div className="font-bold text-slate-700">{user.whatsapp || 'Sin registrar'}</div>
                               </div>
                               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                  <span className="text-[10px] font-black text-gray-300 uppercase block mb-1">Pago Nequi</span>
                                  <div className="font-bold text-indigo-600">{user.nequiNumber || 'No configurado'}</div>
                               </div>
                               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                  <span className="text-[10px] font-black text-gray-300 uppercase block mb-1">Código Referido</span>
                                  <div className="font-bold text-slate-700">{user.referralCode || 'Pendiente'}</div>
                               </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                               <button onClick={() => setEditDaysModal({ userId: user.id, userName: user.name, actionFlag: 'extend_plan' })} className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase hover:bg-gray-50">+ 30 Días</button>
                               <button onClick={() => setPasswordModal({ userId: user.id, userName: user.name, currentPassword: user.passwordPlain })} className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase hover:bg-gray-50">Contraseña</button>
                               <button onClick={() => setEditUserModal({...user, userId: user.id} as any)} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase hover:bg-indigo-100">Editar Perfil</button>
                               <button onClick={() => askDeleteUser(user.id, user.name)} className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl font-bold text-[10px] uppercase hover:bg-rose-100">Borrar</button>
                            </div>

                            {/* Referidos de este usuario */}
                            <div className="mt-8">
                               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Referidos de este usuario</h3>
                               <div className="space-y-2">
                                  {(user.affiliateProspects || []).map(p => (
                                    <div key={p.id} className="p-4 bg-white border border-gray-50 rounded-2xl flex justify-between items-center shadow-sm">
                                       <div className="text-sm font-bold text-slate-700">{p.name} <span className="text-[10px] text-gray-400 ml-2">Wa: {p.whatsapp}</span></div>
                                       {p.status === 'pending' ? (
                                          <button 
                                            onClick={() => {
                                              setQuickRegisterModal({
                                                prospectId: p.id,
                                                affiliateId: user.id,
                                                name: p.name,
                                                whatsapp: p.whatsapp,
                                                cedula: p.cedula || '',
                                                location: p.location || ''
                                              })
                                              const prefix = user.name.substring(0,2).toUpperCase() || 'LC'
                                              setQuickUser({ 
                                                email: '', 
                                                password: Math.random().toString(36).slice(-8), 
                                                referralCode: `${prefix}${user.referralCode || '00000'}` 
                                              })
                                            }}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-lg shadow-indigo-100"
                                          >
                                            Activar/Crear Cuenta
                                          </button>
                                       ) : (
                                          <div className="flex items-center gap-4">
                                             <span className="text-emerald-500 font-bold text-[9px] uppercase">ACTIVO OK</span>
                                             <button 
                                                onClick={() => {
                                                  setQuickRegisterModal({
                                                    prospectId: p.id,
                                                    affiliateId: user.id,
                                                    name: p.name,
                                                    whatsapp: p.whatsapp,
                                                    cedula: p.cedula || '',
                                                    location: p.location || ''
                                                  })
                                                  const prefix = user.name.substring(0,2).toUpperCase() || 'LC'
                                                  setQuickUser({ 
                                                    email: '', 
                                                    password: Math.random().toString(36).slice(-8), 
                                                    referralCode: `${prefix}${user.referralCode || '00000'}` 
                                                  })
                                                }}
                                                className="text-[9px] font-black text-indigo-400 underline"
                                             >
                                                Crear otro Acceso
                                             </button>
                                          </div>
                                       )}
                                    </div>
                                  ))}
                                  {(!user.affiliateProspects || user.affiliateProspects.length === 0) && <div className="text-center py-4 text-gray-300 text-[10px] font-bold uppercase">Sin referidos</div>}
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
               <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] mb-6">
                  <h2 className="text-lg font-black text-indigo-600">Red de Recomendados</h2>
                  <p className="text-xs text-indigo-400 font-bold uppercase">Solicitudes de activación para nuevos vendedores.</p>
               </div>
               <div className="space-y-4">
                  {users.flatMap(u => (u.affiliateProspects || []).map(p => ({ ...p, referrerId: u.id, referrerName: u.name, referrerEmail: u.email, referrerCode: u.referralCode }))).sort((a) => a.status === 'pending' ? -1 : 1).map((prospect, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${prospect.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                             {prospect.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                             <div className="font-black text-slate-800 text-base">{prospect.name}</div>
                             <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-2 mt-1">
                                <span>WhatsApp: {prospect.whatsapp}</span>
                                <span className="w-1 h-1 bg-gray-100 rounded-full" />
                                <span>ID: {prospect.cedula || 'N/A'}</span>
                             </div>
                             <div className="text-[9px] font-bold text-indigo-500 uppercase mt-2">Recomendado por: {prospect.referrerName}</div>
                          </div>
                       </div>
                       {prospect.status === 'pending' ? (
                          <button 
                            onClick={() => {
                              setQuickRegisterModal({
                                prospectId: prospect.id,
                                affiliateId: prospect.referrerId,
                                name: prospect.name,
                                whatsapp: prospect.whatsapp,
                                cedula: prospect.cedula || '',
                                location: prospect.location || ''
                              })
                              const prefix = prospect.referrerName?.substring(0,2).toUpperCase() || 'LC'
                              setQuickUser({ 
                                email: '', 
                                password: Math.random().toString(36).slice(-8), 
                                referralCode: `${prefix}${prospect.referrerCode || '00000'}` 
                              })
                            }}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
                          >
                            Activar y Crear Usuario
                          </button>
                       ) : (
                          <div className="text-emerald-500 bg-emerald-50 border border-emerald-100 px-6 py-2 rounded-full font-black text-[10px] uppercase flex items-center gap-2">
                             <ShieldAlert size={14} /> CUENTA ACTIVADA
                          </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Modales */}
          {resultMessage && (
            <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest border-2 ${resultMessage.isError ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`} onClick={() => setResultMessage(null)}>
               {resultMessage.text}
            </div>
          )}

          {quickRegisterModal && (
            <div className="mad-modal-overlay" onClick={() => setQuickRegisterModal(null)}>
              <div className="mad-modal" onClick={e => e.stopPropagation()}>
                <h3>Activar Nuevo Vendedor</h3>
                <p className="mb-4 text-xs text-gray-500">Crea el acceso ahora para <strong>{quickRegisterModal.name}</strong>.</p>
                
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label>Nombre Completo</label>
                    <input className="mb-0" value={quickRegisterModal.name} onChange={e => setQuickRegisterModal({...quickRegisterModal, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>WhatsApp</label>
                      <input className="mb-0" value={quickRegisterModal.whatsapp} onChange={e => setQuickRegisterModal({...quickRegisterModal, whatsapp: e.target.value})} />
                    </div>
                    <div>
                      <label>Cédula</label>
                      <input className="mb-0" value={quickRegisterModal.cedula} onChange={e => setQuickRegisterModal({...quickRegisterModal, cedula: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label>Ciudad / Ubicación</label>
                    <input className="mb-0" value={quickRegisterModal.location} onChange={e => setQuickRegisterModal({...quickRegisterModal, location: e.target.value})} />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label>Correo Electrónico (Acceso)</label>
                    <input className="mb-0" placeholder="ej: experto@ventas.com" value={quickUser.email} onChange={e => setQuickUser({...quickUser, email: e.target.value})} autoFocus />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><label>Contraseña</label><input className="mb-0" value={quickUser.password} onChange={e => setQuickUser({...quickUser, password: e.target.value})} /></div>
                    <div><label>Código Referido</label><input className="mb-0" value={quickUser.referralCode} onChange={e => setQuickUser({...quickUser, referralCode: e.target.value.toUpperCase()})} /></div>
                  </div>
                </div>

                <div className="mad-modal-actions mt-6">
                   <button onClick={() => setQuickRegisterModal(null)} className="bg-gray-100">CANCELAR</button>
                   <button onClick={() => handleUserAction(quickRegisterModal.affiliateId, 'activate_prospect_full', { 
                      prospectId: quickRegisterModal.prospectId,
                      affiliateId: quickRegisterModal.affiliateId,
                      name: quickRegisterModal.name,
                      whatsapp: quickRegisterModal.whatsapp,
                      docNumber: quickRegisterModal.cedula,
                      city: quickRegisterModal.location,
                      ...quickUser 
                    })} className="bg-indigo-600 text-white">CREAR Y ACTIVAR</button>
                </div>
              </div>
            </div>
          )}

          {deleteModal && (
            <div className="mad-modal-overlay" onClick={() => setDeleteModal(null)}>
               <div className="mad-modal" onClick={e => e.stopPropagation()}>
                  <h3>¿Borrar Usuario?</h3>
                  <p>¿Estás seguro de borrar a <strong>{deleteModal.name}</strong>?</p>
                  <div className="mad-modal-actions">
                     <button onClick={() => setDeleteModal(null)} className="bg-gray-100">CERRAR</button>
                     <button onClick={executeDelete} className="bg-rose-500 text-white">SÍ, BORRAR</button>
                  </div>
               </div>
            </div>
          )}

          {editUserModal && (
            <div className="mad-modal-overlay" onClick={() => setEditUserModal(null)}>
               <div className="mad-modal" onClick={e => e.stopPropagation()}>
                  <h3>Editar Perfil</h3>
                  <label>Nombre</label>
                  <input value={editUserModal.name} onChange={e => setEditUserModal({...editUserModal, name: e.target.value})} />
                  <label>WhatsApp</label>
                  <input value={editUserModal.whatsapp || ''} onChange={e => setEditUserModal({...editUserModal, whatsapp: e.target.value})} />
                  <label>Código Referido</label>
                  <input value={editUserModal.referralCode || ''} onChange={e => setEditUserModal({...editUserModal, referralCode: e.target.value.toUpperCase()})} />
                  <div className="mad-modal-actions">
                     <button onClick={() => setEditUserModal(null)} className="bg-gray-100">CERRAR</button>
                     <button onClick={() => handleUserAction(editUserModal.userId, 'update_info', editUserModal)} className="bg-indigo-600 text-white">GUARDAR</button>
                  </div>
               </div>
            </div>
          )}
          
          {editDaysModal && (
            <div className="mad-modal-overlay" onClick={() => setEditDaysModal(null)}>
               <div className="mad-modal" onClick={e => e.stopPropagation()}>
                  <h3>Sumar Días de Acceso</h3>
                  <label>Días adicionales</label>
                  <input type="number" value={manualDays} onChange={e => setManualDays(e.target.value)} />
                  <div className="mad-modal-actions">
                     <button onClick={() => setEditDaysModal(null)} className="bg-gray-100">CERRAR</button>
                     <button onClick={() => handleUserAction(editDaysModal.userId, 'extend_plan', { days: Number(manualDays) })} className="bg-indigo-600 text-white">ACTUALIZAR</button>
                  </div>
               </div>
            </div>
          )}

          {passwordModal && (
            <div className="mad-modal-overlay" onClick={() => setPasswordModal(null)}>
               <div className="mad-modal" onClick={e => e.stopPropagation()}>
                  <h3>Cambiar Contraseña</h3>
                  <p>Usuario: <strong>{passwordModal.userName}</strong></p>
                  <label>Nueva Contraseña</label>
                  <input value={passwordModal.currentPassword || ''} onChange={e => setPasswordModal({...passwordModal, currentPassword: e.target.value})} />
                  <div className="mad-modal-actions">
                     <button onClick={() => setPasswordModal(null)} className="bg-gray-100">CERRAR</button>
                     <button onClick={() => handleUserAction(passwordModal.userId, 'change_password', { password: passwordModal.currentPassword })} className="bg-indigo-600 text-white">CAMBIAR</button>
                  </div>
               </div>
            </div>
          )}

          {createUserModal && (
            <div className="mad-modal-overlay" onClick={() => setCreateUserModal(false)}>
               <div className="mad-modal" onClick={e => e.stopPropagation()}>
                  <h3>Crear Nuevo Usuario</h3>
                  <p>Crea un usuario directamente sin necesidad de recomendación.</p>
                  
                  <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div>
                      <label>Nombre Completo *</label>
                      <input placeholder="ej: María López" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} autoFocus />
                    </div>

                    <div>
                      <label>Correo Electrónico *</label>
                      <input type="email" placeholder="ej: maria@correo.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label>Contraseña *</label>
                        <input value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Mín. 6 caracteres" />
                      </div>
                      <div>
                        <label>Rol</label>
                        <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', padding: '16px', border: '2px solid #f1f5f9', borderRadius: '16px', fontWeight: 'bold', outline: 'none', background: 'white' }}>
                          <option value="seller">💼 Vendedor</option>
                          <option value="buyer">🛒 Comprador</option>
                          <option value="reseller">🚀 Recomendador</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label>WhatsApp</label>
                        <input placeholder="ej: 3001234567" value={newUser.whatsapp} onChange={e => setNewUser({...newUser, whatsapp: e.target.value})} />
                      </div>
                      <div>
                        <label>Ciudad</label>
                        <input placeholder="ej: Bogotá" value={newUser.city} onChange={e => setNewUser({...newUser, city: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label>Tipo Doc</label>
                        <select value={newUser.docType} onChange={e => setNewUser({...newUser, docType: e.target.value})} style={{ width: '100%', padding: '16px', border: '2px solid #f1f5f9', borderRadius: '16px', fontWeight: 'bold', outline: 'none', background: 'white' }}>
                          <option value="CC">CC</option>
                          <option value="NIT">NIT</option>
                          <option value="CE">CE</option>
                          <option value="PAS">Pasaporte</option>
                        </select>
                      </div>
                      <div>
                        <label>Número Doc</label>
                        <input placeholder="ej: 1234567890" value={newUser.docNumber} onChange={e => setNewUser({...newUser, docNumber: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label>Categoría de Tienda</label>
                      <input placeholder="ej: Moda, Tecnología, Hogar..." value={newUser.storeCategory} onChange={e => setNewUser({...newUser, storeCategory: e.target.value})} />
                    </div>
                  </div>

                  <div className="mad-modal-actions mt-6">
                     <button onClick={() => { setCreateUserModal(false); setNewUser({ name: '', email: '', password: '', role: 'seller', whatsapp: '', docType: 'CC', docNumber: '', city: '', country: 'Colombia', storeCategory: '' }) }} className="bg-gray-100">CANCELAR</button>
                     <button 
                       disabled={creatingUser}
                       onClick={async () => {
                         if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
                           setResultMessage({ text: 'Nombre, correo y contraseña son obligatorios', isError: true })
                           return
                         }
                         if (newUser.password.length < 6) {
                           setResultMessage({ text: 'La contraseña debe tener mínimo 6 caracteres', isError: true })
                           return
                         }
                         setCreatingUser(true)
                         try {
                           const res = await fetch('/api/admin/users', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify(newUser)
                           })
                           const data = await res.json()
                           if (res.ok) {
                             setResultMessage({ text: data.message || 'Usuario creado exitosamente', isError: false })
                             setCreateUserModal(false)
                             setNewUser({ name: '', email: '', password: '', role: 'seller', whatsapp: '', docType: 'CC', docNumber: '', city: '', country: 'Colombia', storeCategory: '' })
                             fetchUsers()
                           } else {
                             setResultMessage({ text: data.error || 'Error al crear usuario', isError: true })
                           }
                         } catch (err) {
                           setResultMessage({ text: 'Error de conexión', isError: true })
                         } finally {
                           setCreatingUser(false)
                         }
                       }} 
                       className="bg-indigo-600 text-white"
                     >
                       {creatingUser ? 'CREANDO...' : 'CREAR USUARIO'}
                     </button>
                  </div>
               </div>
            </div>
          )}

          <style jsx>{`
            .mad-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
            .mad-modal { background: white; padding: 40px; border-radius: 32px; max-width: 500px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
            .mad-modal h3 { font-size: 20px; font-weight: 900; margin-bottom: 8px; }
            .mad-modal p { color: #64748b; font-size: 14px; margin-bottom: 24px; }
            .mad-modal label { display: block; font-[10px] font-black uppercase text-gray-400 mb-2; }
            .mad-modal input { width: 100%; padding: 16px; border: 2px solid #f1f5f9; border-radius: 16px; margin-bottom: 16px; outline: none; font-weight: bold; }
            .mad-modal-actions { display: flex; gap: 12px; margin-top: 24px; }
            .mad-modal-actions button { flex: 1; padding: 16px; border-radius: 16px; font-weight: 900; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; }
          `}</style>

        </div>
      </div>
    </div>
  )
}
