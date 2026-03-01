'use client'

import { useState } from 'react'
import { Share2, Link as LinkIcon, DollarSign, TrendingUp, Users, ExternalLink } from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'

interface ResellerData {
  clicks: number
  sales: number
  earnings: number
  pending: number
}

export default function AffiliateNetworkDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'links'>('overview')

  const stats: ResellerData = {
    clicks: 1250,
    sales: 45,
    earnings: 285000,
    pending: 45000,
  }

  const generatedLinks = [
    {
      id: '1',
      productName: 'Chaqueta de Cuero Urbana',
      storeName: 'Urban Style BOG',
      clicks: 345,
      conversions: 12,
      commission: 15,
      url: 'https://localecomer.vercel.app/store/urban-style?product=1&ref=req_1234',
    },
    {
      id: '2',
      productName: 'Tenis Running Pro',
      storeName: 'Deportes Extremos',
      clicks: 890,
      conversions: 33,
      commission: 10,
      url: 'https://localecomer.vercel.app/store/deportes-extremos?product=2&ref=req_1234',
    },
  ]

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    // podria mostrar un toast aqui
  }

  return (
    <div
      className="network-dashboard"
      style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#f0f2f5' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'rgba(94, 106, 250, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5e6afa',
          }}
        >
          <Share2 size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Mi Red de Afiliados</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#8693a4' }}>
            Monitorea tu rendimiento como revendedor dropshipping
          </p>
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '12px',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'overview' ? '#5e6afa' : '#8693a4',
            fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <TrendingUp size={16} /> Resumen
        </button>
        <button
          onClick={() => setActiveTab('links')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'links' ? '#5e6afa' : '#8693a4',
            fontWeight: activeTab === 'links' ? 'bold' : 'normal',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <LinkIcon size={16} /> Mis Enlaces
        </button>
      </div>

      {activeTab === 'overview' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: '#17212b',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                color: '#8693a4',
                fontSize: '12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Share2 size={14} /> Clicks Totales
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.clicks}</div>
          </div>
          <div
            style={{
              background: '#17212b',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                color: '#8693a4',
                fontSize: '12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Users size={14} /> Ventas (Conversiones)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.sales}</div>
          </div>
          <div
            style={{
              background: 'rgba(46, 204, 113, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(46, 204, 113, 0.2)',
            }}
          >
            <div
              style={{
                color: '#2ecc71',
                fontSize: '12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <DollarSign size={14} /> Ganancias Pagadas
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>
              {formatCOP(stats.earnings)}
            </div>
          </div>
          <div
            style={{
              background: '#17212b',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                color: '#8693a4',
                fontSize: '12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <TrendingUp size={14} /> Comisiones Pendientes
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCOP(stats.pending)}</div>
          </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              Enlaces Generados ({generatedLinks.length})
            </h3>
            <button
              style={{
                background: '#5e6afa',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => (window.location.href = '/community')}
            >
              Explorar más productos
            </button>
          </div>

          {generatedLinks.map((link) => (
            <div
              key={link.id}
              style={{
                background: '#17212b',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>{link.productName}</h4>
                  <span style={{ fontSize: '12px', color: '#8693a4' }}>
                    De: {link.storeName} • {link.commission}% Comisión
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2ecc71' }}>
                    {link.conversions} Ventas
                  </div>
                  <div style={{ fontSize: '11px', color: '#8693a4' }}>{link.clicks} Clicks</div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: '#8693a4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginRight: '16px',
                  }}
                >
                  {link.url}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => copyLink(link.url)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <LinkIcon size={12} /> Copiar
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#5e6afa',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
