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
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
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
  pending_verification?: boolean
  last_receipt_url?: string
  payoutInfo?: {
    fullName: string
    accountType: string
    accountNumber: string
    documentId: string
    updatedAt: string
  } | null
}

export default function MasterAdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [activeTab, setActiveTab] = useState<'users' | 'recommendations' | 'audit'>('users')
  const [viewReceipt, setViewReceipt] = useState<string | null>(null)
  const [quickCode, setQuickCode] = useState('')

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
  const [quickUser, setQuickUser] = useState({ email: '', password: '' })

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
    const labels: any = { buyer: '🛒 Comprador', seller: '💼 Vendedor', admin: '👑 Administrador', super_admin: '💎 Super Admin' }
    return labels[role] || role
  }



  const pendingUsers = users.filter(u => u.pending_verification)

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
          
             <div className="flex gap-4 mt-8 overflow-x-auto pb-4 no-scrollbar">
               <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>👥 Lista Usuarios</button>
               <button onClick={() => setActiveTab('audit')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap relative ${activeTab === 'audit' ? 'bg-white text-indigo-600 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  📑 Auditoría
                  {pendingUsers.length > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] animate-bounce">{pendingUsers.length}</span>}
               </button>
             </div>

          {/* Banner de alerta para auditoría */}
          {pendingUsers.length > 0 && activeTab !== 'audit' && (
            <div 
              onClick={() => setActiveTab('audit')}
              className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-6 mb-8 flex items-center justify-between cursor-pointer hover:bg-rose-100 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-black text-rose-600 text-sm uppercase tracking-wider">¡Atención Super Admin!</h3>
                  <p className="text-rose-400 text-xs font-bold">Tienes {pendingUsers.length} comprobantes de pago por validar.</p>
                </div>
              </div>
              <div className="bg-rose-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase group-hover:scale-105 transition-transform">
                Ir a Auditoría
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
               <div className="flex flex-col gap-4">

                 <div className="flex gap-4 items-center">
                    <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                      <Search size={20} className="text-gray-300" />
                      <input placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none w-full font-bold text-sm" />
                    </div>
                    <button onClick={() => setCreateUserModal(true)} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:bg-slate-900 transition-all"><UserPlus size={20} /> CREAR</button>
                 </div>
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
                               <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                  <span className="text-[10px] font-black text-emerald-600/70 uppercase block mb-1">Datos de Cobro</span>
                                  {user.payoutInfo ? (
                                      <div className="-mt-1">
                                        <div className="font-black text-emerald-700 text-base">{user.payoutInfo.accountNumber}</div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <span className="text-[9px] font-black text-emerald-800 uppercase bg-emerald-200 px-1.5 py-0.5 rounded">{user.payoutInfo.accountType}</span>
                                          <span className="text-[10px] font-bold text-emerald-900 border-l border-emerald-200 pl-2 max-w-[120px] truncate">{user.payoutInfo.fullName}</span>
                                          <span className="text-[9px] font-bold text-emerald-600 uppercase border-l border-emerald-200 pl-2">CC: {user.payoutInfo.documentId}</span>
                                        </div>
                                      </div>
                                  ) : (
                                      <div className="font-bold text-emerald-600/60 text-sm">No configurado</div>
                                  )}
                               </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                               <button onClick={() => setEditDaysModal({ userId: user.id, userName: user.name, actionFlag: 'extend_plan' })} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-100 flex items-center gap-1">Activar Pro 👑 (30 Días)</button>
                               <button onClick={() => setPasswordModal({ userId: user.id, userName: user.name, currentPassword: user.passwordPlain })} className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase hover:bg-gray-50">Contraseña</button>
                               <button onClick={() => setEditUserModal({...user, userId: user.id} as any)} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase hover:bg-indigo-100">Editar Perfil</button>
                               <button onClick={() => askDeleteUser(user.id, user.name)} className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl font-bold text-[10px] uppercase hover:bg-rose-100">Borrar</button>
                            </div>


                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          )}



          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] mb-6">
                  <h2 className="text-lg font-black text-indigo-600">Auditoría de Pagos</h2>
                  <p className="text-xs text-indigo-400 font-bold uppercase">Valida los comprobantes subidos por los vendedores.</p>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <CheckCircle2 size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No hay pagos pendientes por auditar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingUsers.map(user => (
                    <div key={user.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:border-indigo-100 transition-all">
                       <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">
                                {user.name?.[0]?.toUpperCase()}
                             </div>
                             <div>
                                <div className="font-black text-slate-800 text-base">{user.name}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-2 mt-1">
                                   <span>{user.email}</span>
                                   <span className="w-1 h-1 bg-gray-100 rounded-full" />
                                   <span>Wa: {user.whatsapp}</span>
                                </div>
                                {user.paidUntil && (
                                  <div className="text-[9px] font-bold text-rose-400 uppercase mt-2">Venció: {new Date(user.paidUntil).toLocaleDateString()}</div>
                                )}
                             </div>
                          </div>

                          <div className="flex items-center gap-3">
                             {user.last_receipt_url && (
                               <button 
                                 onClick={() => setViewReceipt(user.last_receipt_url || null)}
                                 className="bg-white border border-gray-200 text-slate-600 px-4 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-gray-50"
                               >
                                  <Eye size={16} /> Ver Comprobante
                               </button>
                             )}
                             <button 
                               onClick={() => handleUserAction(user.id, 'extend_plan', { days: 30, approve_verification: true })}
                               className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-600 transition-all"
                             >
                                <CheckCircle2 size={16} /> Aprobar (+30 días)
                             </button>
                             <button 
                               onClick={() => handleUserAction(user.id, 'reject_verification')}
                               className="bg-white border border-rose-100 text-rose-500 px-4 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-rose-50"
                             >
                                <XCircle size={16} /> Rechazar
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Visor de Comprobante */}
              {viewReceipt && (
                <div className="mad-modal-overlay" onClick={() => setViewReceipt(null)} style={{ background: 'rgba(0,0,0,0.9)', zIndex: 10000 }}>
                  <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => setViewReceipt(null)}
                      className="absolute -top-12 right-0 text-white opacity-60 hover:opacity-100 flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                    >
                      Cerrar <XCircle size={24} />
                    </button>
                    <img 
                      src={viewReceipt} 
                      alt="Comprobante de Pago" 
                      className="w-full h-auto rounded-3xl shadow-2xl border-4 border-white/10"
                      style={{ maxHeight: '85vh', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modales */}
          {resultMessage && (
            <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest border-2 ${resultMessage.isError ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`} onClick={() => setResultMessage(null)}>
               {resultMessage.text}
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
                          {/* Opción de reseller eliminada */}
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
            .mad-modal label { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.5px; }
            .mad-modal input { width: 100%; padding: 16px; border: 2px solid #f1f5f9; border-radius: 16px; margin-bottom: 16px; outline: none; font-weight: bold; transition: border-color 0.2s; }
            .mad-modal input:focus { border-color: #6366f1; }
            .mad-modal-actions { display: flex; gap: 12px; margin-top: 24px; }
            .mad-modal-actions button { flex: 1; padding: 16px; border-radius: 16px; font-weight: 900; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      </div>
    </div>
  )
}
