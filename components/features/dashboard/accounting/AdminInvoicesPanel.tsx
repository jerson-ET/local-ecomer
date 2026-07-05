'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FileText,
  Download,
  Crown,
  Search,
  RefreshCw,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*      PANEL DE FACTURAS PAGADAS - VISTA SUPER ADMIN                       */
/*  Muestra todas las facturas de todos los usuarios, filtrables por mes    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Invoice {
  id: string
  number: string
  amount: number
  date: string
  url: string
  type: string
}

interface UserWithInvoices {
  id: string
  email: string
  name: string
  documentNumber: string | null
  documentType: string | null
  whatsapp: string | null
  city: string | null
  country: string | null
  paidUntil: string | null
  invoices: Invoice[]
}

export default function AdminInvoicesPanel() {
  const [users, setUsers] = useState<UserWithInvoices[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const usersData = (data.users || [])
          .filter((u: any) => u.invoices && u.invoices.length > 0)
          .map((u: any) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            documentNumber: u.documentNumber,
            documentType: u.documentType,
            whatsapp: u.whatsapp,
            city: u.city,
            country: u.country,
            paidUntil: u.paidUntil,
            invoices: u.invoices,
          }))
        setUsers(usersData)
      }
    } catch (e) {
      console.error('Error cargando facturas:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtrar facturas por mes/año
  const filterInvoice = (inv: Invoice) => {
    const d = new Date(inv.date)
    const yearMatch = d.getFullYear().toString() === filterYear
    const monthMatch = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth
    return yearMatch && monthMatch
  }

  // Usuarios con facturas filtradas
  const filteredUsers = users
    .map((u) => ({
      ...u,
      invoices: u.invoices.filter(filterInvoice),
    }))
    .filter(
      (u) =>
        u.invoices.length > 0 &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

  // Totales globales
  const allFilteredInvoices = filteredUsers.flatMap((u) => u.invoices)
  const totalRevenue = allFilteredInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const totalInvoices = allFilteredInvoices.length
  const totalUsersWithInvoices = filteredUsers.length

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#f9fafb', padding: '0 0 120px' }}>
      <style>{`
        .inv-header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); color: white; padding: 32px 24px; border-radius: 0 0 32px 32px; margin-bottom: 28px; }
        .inv-header h1 { font-size: 24px; font-weight: 900; margin: 0 0 6px; display: flex; align-items: center; gap: 12px; }
        .inv-header p { margin: 0; opacity: 0.6; font-size: 13px; }
        .inv-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px; }
        .inv-stat { background: rgba(255,255,255,0.08); backdrop-filter: blur(10px); padding: 16px 20px; border-radius: 18px; }
        .inv-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5; font-weight: 800; }
        .inv-stat-value { font-size: 24px; font-weight: 900; margin-top: 4px; display: block; }
        .inv-stat-sub { font-size: 10px; opacity: 0.4; margin-top: 2px; }
        .inv-controls { padding: 0 24px; margin-bottom: 24px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .inv-search { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 16px; }
        .inv-search input { border: none; outline: none; flex: 1; font-size: 14px; color: #0f172a; background: transparent; }
        .inv-filter-group { display: flex; gap: 8px; align-items: center; }
        .inv-select { padding: 10px 14px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; background: #fff; color: #475569; outline: none; cursor: pointer; }
        .inv-btn-refresh { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 700; color: #475569; font-size: 13px; transition: all 0.2s; }
        .inv-btn-refresh:hover { background: #e2e8f0; }
        .inv-list { padding: 0 24px; display: flex; flex-direction: column; gap: 14px; }
        .inv-user-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .inv-user-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
        .inv-user-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; cursor: pointer; gap: 14px; }
        .inv-user-info { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
        .inv-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #FF5A26, #f97316); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 16px; flex-shrink: 0; }
        .inv-user-name { font-weight: 800; font-size: 15px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-user-email { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; }
        .inv-user-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .inv-badge { padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; white-space: nowrap; }
        .inv-details { border-top: 1px solid #f1f5f9; padding: 20px 22px; background: #fafbfc; }
        .inv-invoice-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #fff; border-radius: 14px; border: 1px solid #f1f5f9; margin-bottom: 10px; transition: all 0.15s; }
        .inv-invoice-row:hover { border-color: #FF5A26; box-shadow: 0 2px 12px rgba(255,90,38,0.06); }
        .inv-invoice-icon { width: 40px; height: 40px; background: #fff7ed; color: #FF5A26; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .inv-empty { text-align: center; padding: 80px 24px; color: #94a3b8; }
        .inv-empty h3 { color: #64748b; margin: 20px 0 8px; font-size: 18px; }
        @media (max-width: 640px) {
          .inv-stats { grid-template-columns: 1fr; }
          .inv-controls { padding: 0 16px; }
          .inv-list { padding: 0 16px; }
          .inv-user-header { flex-wrap: wrap; padding: 14px 16px; }
          .inv-user-meta { margin-top: 6px; }
        }
      `}</style>

      {/* Header */}
      <div className="inv-header">
        <h1>
          <Crown size={26} color="#fbbf24" /> Facturas Pagadas
        </h1>
        <p>Control contable de todas las facturas emitidas por la plataforma · Registro DIAN</p>
        <div className="inv-stats">
          <div className="inv-stat">
            <span className="inv-stat-label">Ingresos</span>
            <span className="inv-stat-value">
              ${totalRevenue.toLocaleString('es-CO')}
            </span>
            <span className="inv-stat-sub">COP en el periodo</span>
          </div>
          <div className="inv-stat">
            <span className="inv-stat-label">Facturas</span>
            <span className="inv-stat-value">{totalInvoices}</span>
            <span className="inv-stat-sub">emitidas</span>
          </div>
          <div className="inv-stat">
            <span className="inv-stat-label">Clientes</span>
            <span className="inv-stat-value">{totalUsersWithInvoices}</span>
            <span className="inv-stat-sub">con pagos</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="inv-controls">
        <div className="inv-search">
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="inv-filter-group">
          <Filter size={14} color="#94a3b8" />
          <select className="inv-select" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="all">Todos los meses</option>
            {monthNames.map((m, i) => (
              <option key={i + 1} value={(i + 1).toString()}>
                {m}
              </option>
            ))}
          </select>
          <select className="inv-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
        <button className="inv-btn-refresh" onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Summary bar */}
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: 18,
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={18} color="#FF5A26" />
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.7 }}>
              Recaudo Total Filtrado
            </span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 900 }}>
            $ {totalRevenue.toLocaleString('es-CO')} <span style={{ fontSize: 12, opacity: 0.5 }}>COP</span>
          </span>
        </div>
      </div>

      {/* Lista de Usuarios con Facturas */}
      <div className="inv-list">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: 0,
            }}
          >
            <Users size={20} /> Usuarios con Facturas ({filteredUsers.length})
          </h2>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: 2,
              background: '#f1f5f9',
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            Soporte DIAN
          </span>
        </div>

        {loading && (
          <div className="inv-empty">
            <RefreshCw size={40} className="spinning" color="#FF5A26" />
            <h3>Cargando facturas...</h3>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="inv-empty">
            <div
              style={{
                width: 80,
                height: 80,
                background: '#f8fafc',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <FileText size={36} color="#cbd5e1" />
            </div>
            <h3>No hay facturas en este periodo</h3>
            <p style={{ fontSize: 13, maxWidth: 320, margin: '0 auto' }}>
              Ajusta los filtros o extiende el plan de un usuario para generar la primera factura.
            </p>
          </div>
        )}

        {filteredUsers.map((user) => {
          const isExpanded = expandedUser === user.id
          const initials = user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
          const userTotal = user.invoices.reduce((sum, inv) => sum + inv.amount, 0)

          return (
            <div key={user.id} className="inv-user-card">
              <div className="inv-user-header" onClick={() => setExpandedUser(isExpanded ? null : user.id)}>
                <div className="inv-user-info">
                  <div className="inv-avatar">{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="inv-user-name">{user.name}</div>
                    <div className="inv-user-email">{user.email}</div>
                  </div>
                </div>
                <div className="inv-user-meta">
                  <span
                    className="inv-badge"
                    style={{ background: '#fff7ed', color: '#FF5A26' }}
                  >
                    <DollarSign size={10} style={{ display: 'inline', marginRight: 2 }} />
                    ${userTotal.toLocaleString('es-CO')}
                  </span>
                  <span
                    className="inv-badge"
                    style={{ background: '#f0fdf4', color: '#16a34a' }}
                  >
                    <FileText size={10} style={{ display: 'inline', marginRight: 2 }} />
                    {user.invoices.length} factura{user.invoices.length > 1 ? 's' : ''}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={18} color="#94a3b8" />
                ) : (
                  <ChevronDown size={18} color="#94a3b8" />
                )}
              </div>

              {isExpanded && (
                <div className="inv-details">
                  {/* Datos del usuario */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 12,
                      marginBottom: 20,
                      padding: 14,
                      background: '#f8fafc',
                      borderRadius: 14,
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Documento
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                        {user.documentType || 'CC'} {user.documentNumber || 'No registrado'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Ubicación
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                        {user.city || 'N/A'}, {user.country || 'Colombia'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                        WhatsApp
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                        {user.whatsapp || 'No registrado'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Plan Vence
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                        {user.paidUntil
                          ? new Date(user.paidUntil).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Sin plan'}
                      </div>
                    </div>
                  </div>

                  {/* Lista de facturas */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 14,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Calendar size={16} color="#FF5A26" /> Facturas Emitidas
                    </h4>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: '#FF5A26',
                        background: '#fff7ed',
                        padding: '4px 12px',
                        borderRadius: 20,
                      }}
                    >
                      Total: ${userTotal.toLocaleString('es-CO')}
                    </span>
                  </div>

                  {user.invoices.map((inv) => (
                    <div key={inv.id} className="inv-invoice-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="inv-invoice-icon">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 13, color: '#0f172a' }}>
                            {inv.number}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>
                            {new Date(inv.date).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                            $ {inv.amount.toLocaleString('es-CO')}
                          </div>
                          <div
                            style={{
                              fontSize: 8,
                              color: '#16a34a',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                            }}
                          >
                            Pagada ✓
                          </div>
                        </div>
                          <a
                            href={`/api/invoice/download?userId=${user.id}&invoiceId=${inv.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 14px',
                              background: '#FF5A26',
                              color: '#fff',
                              borderRadius: 10,
                              fontWeight: 800,
                              fontSize: 10,
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              textDecoration: 'none',
                              boxShadow: '0 2px 8px rgba(255,90,38,0.2)',
                              transition: 'all 0.15s',
                            }}
                          >
                            <Download size={14} /> Descargar PDF
                          </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Nota Legal */}
      {!loading && filteredUsers.length > 0 && (
        <div style={{ padding: '30px 24px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: 18,
              background: '#eff6ff',
              borderRadius: 18,
              border: '1px solid #dbeafe',
            }}
          >
            <div
              style={{
                background: '#3b82f6',
                color: '#fff',
                padding: 6,
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              <FileText size={14} />
            </div>
            <p
              style={{
                fontSize: 11,
                color: '#1e40af',
                lineHeight: 1.7,
                margin: 0,
                fontWeight: 500,
              }}
            >
              <strong>Soporte Contable DIAN:</strong> Todas las facturas generadas cumplen con el
              estándar de cuenta de cobro / factura electrónica. Guarda estos documentos PDF como
              soporte para tus declaraciones ante la DIAN, Cámara de Comercio y contabilidad general
              de la plataforma LocalEcomer.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
