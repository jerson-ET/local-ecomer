'use client'

import { useState, useEffect } from 'react'
import { Send, Users, MessageCircle, Loader2, Megaphone, Smartphone, ExternalLink, ShieldCheck } from 'lucide-react'

export default function AdminTelegramPanel() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; msg: string }>({ type: '', msg: '' })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('telegram_bot_users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcast = async () => {
    if (!message.trim()) return alert('El mensaje no puede estar vacío.')
    if (users.length === 0) return alert('No hay usuarios registrados en el bot.')
    
    if (!confirm(`¿Estás seguro de enviar este mensaje a ${users.length} usuarios?`)) return

    setSending(true)
    setStatus({ type: '', msg: '' })
    
    try {
      let successCount = 0
      
      // Sending messages (In a real app this should be a backend serverless function, 
      // but for MVP admin we use the bot token directly. This panel is only for superadmins)
      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '8658622051:AAGcRrw9lk4LnOeSf77fOeaZ7rqRQiQToVo'
      
      for (const user of users) {
        if (!user.chat_id) continue
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.chat_id,
            text: message,
            parse_mode: 'HTML'
          })
        })
        if (res.ok) successCount++
      }

      setStatus({ 
        type: 'success', 
        msg: `Mensaje enviado exitosamente a ${successCount} de ${users.length} usuarios.` 
      })
      setMessage('')
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Hubo un error al enviar los mensajes.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <MessageCircle className="text-blue-500" size={28} />
            Gestor de Telegram
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra los usuarios del bot @Localecomerbot y envía difusiones masivas.
          </p>
        </div>
        
        <a 
          href="https://web.telegram.org/k/#@Localecomerbot" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 font-bold flex items-center gap-2 transition-all active:scale-95"
        >
          <ExternalLink size={18} />
          Abrir Web Telegram
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL DE DIFUSIÓN (BROADCAST) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm sticky top-24">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <Megaphone className="text-purple-500" />
              Mensaje Masivo
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Envía una notificación push por Telegram a todos los usuarios que han iniciado el bot.
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hola a todos! Tenemos una nueva actualización..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all h-32 mb-4"
            ></textarea>

            {status.msg && (
              <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${
                status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {status.msg}
              </div>
            )}

            <button
              onClick={handleBroadcast}
              disabled={sending || loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {sending ? 'ENVIANDO...' : 'ENVIAR A TODOS'}
            </button>
          </div>
        </div>

        {/* LISTA DE USUARIOS TELEGRAM */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm min-h-[500px]">
             <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Users className="text-blue-500" />
                    Usuarios Registrados
                  </h2>
                </div>
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black">
                  {users.length} TOTAL
                </div>
             </div>

             {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <Loader2 className="animate-spin text-blue-500" size={30} />
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando Usuarios...</span>
                </div>
             ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                  <Smartphone size={40} className="opacity-20" />
                  <p className="font-medium text-sm">Nadie ha iniciado el bot todavía.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((u) => (
                    <div key={u.telegram_id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                        <span className="text-blue-600 font-black text-lg">
                          {(u.first_name || u.username || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 truncate">{u.first_name || 'Sin Nombre'}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {u.username && <span className="text-xs text-blue-500 font-medium truncate">@{u.username}</span>}
                          {u.is_verified && <ShieldCheck className="text-green-500" size={12} />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Inició: {new Date(u.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
