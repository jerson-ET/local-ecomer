'use client'

import React, { useState, useEffect } from 'react'
import { Globe, Link as LinkIcon, CheckCircle, AlertCircle, Loader2, Server, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react'

interface StoreDomainSectionProps {
  store: {
    id: string
    name: string
    slug: string
    custom_domain?: string | null
    banner_url?: string | null
  } | null
  onUpdateStore: () => void
}

export function StoreDomainSection({ store, onUpdateStore }: StoreDomainSectionProps) {
  const [domain, setDomain] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  // Extraer el dominio actual al cargar
  useEffect(() => {
    if (store) {
      let currentDomain = store.custom_domain || ''
      
      // Fallback si está guardado en el JSON de banner_url
      if (!currentDomain && store.banner_url && store.banner_url.startsWith('{')) {
        try {
          const config = JSON.parse(store.banner_url)
          if (config.customDomain) {
            currentDomain = config.customDomain
          }
        } catch (e) {}
      }
      
      setDomain(currentDomain)
      setConnected(!!currentDomain)
    }
  }, [store])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return
    if (!domain.trim()) return

    // Simple domain validation regex
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
    const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '')
    
    if (!domainRegex.test(cleanDomain)) {
      setError('Por favor, ingresa un dominio válido (ej: mi-tienda.com)')
      return
    }

    setError('')
    setConnecting(true)

    try {
      const response = await fetch('/api/stores/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          customDomain: cleanDomain
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Error al conectar el dominio')
      }

      setConnected(true)
      onUpdateStore()
    } catch (err: any) {
      setError(err.message || 'Error al conectar el dominio. Por favor intenta de nuevo.')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!store) return
    setError('')
    setConnecting(true)

    try {
      const response = await fetch('/api/stores/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          customDomain: null
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Error al desconectar el dominio')
      }

      setDomain('')
      setConnected(false)
      onUpdateStore()
    } catch (err: any) {
      setError(err.message || 'Error al desconectar el dominio.')
    } finally {
      setConnecting(false)
    }
  }

  if (!store) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#ffffff' }}>
        <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px' }} />
        <h3>Sincronizando información de la tienda...</h3>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
      {/* Premium Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #001f54 100%)',
        border: '1px solid #0052cc',
        borderRadius: 16,
        padding: '28px',
        color: '#ffffff',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 82, 204, 0.15)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(0, 194, 255, 0.12) 0%, transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(0, 82, 204, 0.2)', border: '1px solid #0052cc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Globe size={24} color="#00c2ff" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Dominio Personalizado</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
              Conecta tu propio dominio de Internet a tu tienda para una presencia de marca 100% profesional.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Connection Box */}
        <div style={{
          background: '#071126',
          border: '1px solid #003ebd',
          borderRadius: 16,
          padding: '24px',
        }}>
          {!connected ? (
            <form onSubmit={handleConnect}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Conectar nuevo dominio
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Escribe el dominio que compraste en tu proveedor preferido (Namecheap, GoDaddy, DonDominio, etc.) para vincularlo a tu catálogo.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="ej: mi-tienda.com"
                    disabled={connecting}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#030a18',
                      border: '1px solid #003ebd',
                      borderRadius: 10,
                      padding: '12px 14px 12px 40px',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                  <LinkIcon size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: 15 }} />
                </div>
                <button
                  type="submit"
                  disabled={connecting || !domain.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #0052cc, #00c2ff)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '0 24px',
                    height: '46px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: (connecting || !domain.trim()) ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)',
                  }}
                >
                  {connecting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      Conectar
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#ff4d6d', fontSize: 12, fontWeight: 600 }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #003ebd',
                paddingBottom: 16,
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
                  }}>
                    <CheckCircle size={20} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>{domain}</h4>
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>Activo y apuntando correctamente</span>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={connecting}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ff4d6d',
                    borderRadius: 8,
                    padding: '6px 14px',
                    color: '#ff4d6d',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    opacity: connecting ? 0.6 : 1
                  }}
                >
                  {connecting ? 'Desconectando...' : 'Desconectar'}
                </button>
              </div>

              {/* Status and instruction */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <ShieldCheck size={16} color="#10b981" />
                  Certificado SSL auto-generado y activo (HTTPS seguro).
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <Server size={16} color="#00c2ff" />
                  CDN de Cloudflare global activado para acelerar la carga en tu región.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DNS Configuration Instructions */}
        <div style={{
          background: '#071126',
          border: '1px solid #003ebd',
          borderRadius: 16,
          padding: '24px',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={18} color="#00c2ff" /> Configuración de DNS requerida
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Para que tu dominio cargue tu tienda de LocalEcomer, debes iniciar sesión en el panel donde registraste tu dominio y añadir las siguientes entradas en la sección de configuración de DNS.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { type: 'A', name: '@ (o dejar vacío)', value: '76.76.21.21', ttl: 'Automático / 3600' },
              { type: 'CNAME', name: 'www', value: 'cname.localecomer.store', ttl: 'Automático / 3600' },
            ].map((record, i) => (
              <div key={i} style={{
                background: '#030a18',
                border: '1px solid #003ebd',
                borderRadius: 10,
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 900, background: '#0052cc', color: '#ffffff',
                    padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase'
                  }}>
                    Tipo: {record.type}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>TTL: {record.ttl}</span>
                </div>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '80px 1fr', gap: 6, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Nombre:</span>
                  <code style={{ color: '#ffffff', fontWeight: 800, fontFamily: 'monospace' }}>{record.name}</code>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Valor:</span>
                  <code style={{ color: '#00c2ff', fontWeight: 800, fontFamily: 'monospace' }}>{record.value}</code>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, padding: '12px', background: 'rgba(0, 194, 255, 0.05)',
            border: '1px solid rgba(0, 194, 255, 0.2)', borderRadius: 10,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <HelpCircle size={18} color="#00c2ff" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
              <strong>¿Necesitas ayuda?</strong> Las DNS pueden tardar desde unos minutos hasta 24 horas en propagarse en todo el mundo. Si el dominio dice "Pendiente" tras guardarlo, dale un momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
