'use client'

import { useState } from 'react'
import { DollarSign, Clock, CheckCircle2, XCircle, CreditCard, ChevronRight } from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'

interface Commission {
  id: string
  orderId: string
  productName: string
  date: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  resellerName: string
}

export default function CommissionsDashboard() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  const commissions: Commission[] = [
    {
      id: 'c1',
      orderId: 'ORD-10293',
      productName: 'Chaqueta de Cuero Urbana',
      date: '2023-11-20',
      amount: 15000,
      status: 'pending',
      resellerName: 'Juan Perez',
    },
    {
      id: 'c2',
      orderId: 'ORD-10294',
      productName: 'Tenis Running Pro',
      date: '2023-11-19',
      amount: 8500,
      status: 'paid',
      resellerName: 'Maria Lopez',
    },
    {
      id: 'c3',
      orderId: 'ORD-10295',
      productName: 'Reloj Inteligente Ultra',
      date: '2023-11-18',
      amount: 12000,
      status: 'cancelled',
      resellerName: 'Carlos Ruiz',
    },
  ]

  const filtered = commissions.filter((c) => filter === 'all' || c.status === filter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 size={16} color="#2ecc71" />
      case 'pending':
        return <Clock size={16} color="#f1c40f" />
      case 'cancelled':
        return <XCircle size={16} color="#e74c3c" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Desconocido'
    }
  }

  return (
    <div
      className="commissions-dashboard"
      style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#f0f2f5' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'rgba(46, 204, 113, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2ecc71',
          }}
        >
          <DollarSign size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Comisiones y Pagos</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#8693a4' }}>
            Historial de ganancias por red de dropshipping
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            background: '#17212b',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: filter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: filter === 'all' ? '#fff' : '#8693a4',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: filter === 'all' ? 'bold' : 'normal',
            }}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: filter === 'pending' ? 'rgba(241, 196, 15, 0.1)' : 'transparent',
              color: filter === 'pending' ? '#f1c40f' : '#8693a4',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: filter === 'pending' ? 'bold' : 'normal',
            }}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('paid')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: filter === 'paid' ? 'rgba(46, 204, 113, 0.1)' : 'transparent',
              color: filter === 'paid' ? '#2ecc71' : '#8693a4',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: filter === 'paid' ? 'bold' : 'normal',
            }}
          >
            Pagados
          </button>
        </div>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#5e6afa',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          <CreditCard size={16} /> Solicitar Pago
        </button>
      </div>

      <div
        style={{
          background: '#17212b',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8693a4' }}>
            <DollarSign size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
            <p>No hay comisiones en este estado.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: '#8693a4',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '16px 20px', fontWeight: 'bold' }}>Pedido / Producto</th>
                  <th style={{ padding: '16px 20px', fontWeight: 'bold' }}>Estado</th>
                  <th style={{ padding: '16px 20px', fontWeight: 'bold', textAlign: 'right' }}>
                    Comisión
                  </th>
                  <th style={{ padding: '16px 20px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                        {c.productName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8693a4' }}>
                        Ref: {c.orderId} • {c.date}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                        }}
                      >
                        {getStatusIcon(c.status)} {getStatusLabel(c.status)}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color:
                          c.status === 'paid'
                            ? '#2ecc71'
                            : c.status === 'cancelled'
                              ? '#e74c3c'
                              : '#fff',
                      }}
                    >
                      {c.status === 'cancelled' ? '-' : formatCOP(c.amount)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#8693a4',
                          cursor: 'pointer',
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
