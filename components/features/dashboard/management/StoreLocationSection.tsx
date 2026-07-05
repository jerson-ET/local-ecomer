'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Navigation, Globe, TrendingUp, Users, Zap, Radio, Save, Loader2, Eye, LocateFixed } from 'lucide-react'

/* ── Departamentos de Colombia ── */
const DEPARTMENTS = [
  { id: 'bogota', name: 'Bogotá D.C.', lat: 4.711, lng: -74.072 },
  { id: 'antioquia', name: 'Antioquia', lat: 6.244, lng: -75.574 },
  { id: 'valle', name: 'Valle del Cauca', lat: 3.451, lng: -76.532 },
  { id: 'atlantico', name: 'Atlántico', lat: 10.963, lng: -74.796 },
  { id: 'santander', name: 'Santander', lat: 7.13, lng: -73.126 },
  { id: 'cundinamarca', name: 'Cundinamarca', lat: 5.026, lng: -74.03 },
  { id: 'bolivar', name: 'Bolívar', lat: 10.399, lng: -75.514 },
  { id: 'narino', name: 'Nariño', lat: 1.214, lng: -77.281 },
  { id: 'cesar', name: 'César', lat: 10.473, lng: -73.253 },
  { id: 'tolima', name: 'Tolima', lat: 4.439, lng: -75.232 },
  { id: 'cauca', name: 'Cauca', lat: 2.484, lng: -76.561 },
  { id: 'cordoba', name: 'Córdoba', lat: 8.752, lng: -75.881 },
  { id: 'meta', name: 'Meta', lat: 4.153, lng: -73.636 },
  { id: 'magdalena', name: 'Magdalena', lat: 11.241, lng: -74.199 },
  { id: 'boyaca', name: 'Boyacá', lat: 5.533, lng: -73.362 },
  { id: 'huila', name: 'Huila', lat: 2.927, lng: -75.281 },
  { id: 'risaralda', name: 'Risaralda', lat: 4.814, lng: -75.696 },
  { id: 'caldas', name: 'Caldas', lat: 5.065, lng: -75.517 },
  { id: 'quindio', name: 'Quindío', lat: 4.534, lng: -75.681 },
  { id: 'norte_santander', name: 'N. Santander', lat: 7.893, lng: -72.503 },
  { id: 'sucre', name: 'Sucre', lat: 9.305, lng: -75.397 },
  { id: 'guajira', name: 'La Guajira', lat: 11.544, lng: -72.907 },
  { id: 'choco', name: 'Chocó', lat: 5.693, lng: -76.661 },
  { id: 'arauca', name: 'Arauca', lat: 7.091, lng: -70.762 },
  { id: 'casanare', name: 'Casanare', lat: 5.337, lng: -72.394 },
  { id: 'putumayo', name: 'Putumayo', lat: 1.152, lng: -76.649 },
  { id: 'caqueta', name: 'Caquetá', lat: 1.614, lng: -75.606 },
  { id: 'amazonas', name: 'Amazonas', lat: -1.028, lng: -71.939 },
  { id: 'guaviare', name: 'Guaviare', lat: 2.573, lng: -72.645 },
  { id: 'vaupes', name: 'Vaupés', lat: 1.199, lng: -70.178 },
  { id: 'vichada', name: 'Vichada', lat: 4.423, lng: -69.287 },
  { id: 'guainia', name: 'Guainía', lat: 3.866, lng: -67.924 },
  { id: 'san_andres', name: 'San Andrés', lat: 12.584, lng: -81.701 },
]

const CITIES = [
  'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Cúcuta', 'Pereira', 'Manizales', 'Santa Marta',
  'Ibagué', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
  'Montería', 'Sincelejo', 'Valledupar', 'Popayán', 'Tunja',
]

declare global {
  interface Window { L: any }
}

export function StoreLocationSection() {
  const [storeCity, setStoreCity] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mapReady, setMapReady] = useState(false)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])

  // Simulated customer data
  const [customerData] = useState(() => {
    return DEPARTMENTS.map(d => {
      const isHot = ['bogota', 'antioquia', 'valle', 'atlantico', 'santander'].includes(d.id)
      return {
        ...d,
        pop: isHot ? Math.floor(Math.random() * 200 + 80) : Math.floor(Math.random() * 50),
        revenue: isHot ? Math.floor(Math.random() * 2000000 + 500000) : Math.floor(Math.random() * 500000),
      }
    })
  })

  const totalCustomers = customerData.reduce((a, d) => a + d.pop, 0)
  const totalRevenue = customerData.reduce((a, d) => a + d.revenue, 0)
  const topDepts = [...customerData].sort((a, b) => b.pop - a.pop).slice(0, 5)
  const maxPop = Math.max(...customerData.map(d => d.pop), 1)

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Load Leaflet via CDN
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.L) { setMapReady(true); return }

    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setMapReady(true)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(css)
      document.head.removeChild(script)
    }
  }, [])

  // Init map once Leaflet is ready
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapRef.current) return
    const L = window.L

    const map = L.map(mapContainerRef.current, {
      center: [4.5, -74.0],
      zoom: 6,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    })

    // Light theme tile layer (Voyager / Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
    }).addTo(map)

    // Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapRef.current = map

    // Add customer markers
    customerData.forEach(dept => {
      const ratio = dept.pop / maxPop
      const radius = 3 + ratio * 10
      const color = ratio > 0.6 ? '#0052cc' : ratio > 0.3 ? '#0088ff' : '#4ba3e3'

      const marker = L.circleMarker([dept.lat, dept.lng], {
        radius,
        fillColor: '#0066ff',
        color: color,
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map)

      // Pulse effect for hot zones
      if (ratio > 0.4) {
        const pulse = L.circleMarker([dept.lat, dept.lng], {
          radius: radius * 1.8,
          fillColor: '#00ccff',
          color: '#0066ff',
          weight: 1,
          opacity: 0.3,
          fillOpacity: 0.15,
          className: 'leaflet-pulse-marker',
        }).addTo(map)
        markersRef.current.push(pulse)
      }

      marker.bindPopup(`
        <div style="background:#ffffff;border:1px solid #0052cc;border-radius:12px;padding:14px 16px;min-width:180px;font-family:Inter,sans-serif;color:#1e293b;">
          <div style="font-size:14px;font-weight:800;color:#0052cc;margin-bottom:8px;">${dept.name}</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:4px;">
            <span>📊 Compras:</span><span style="color:#0088ff;font-weight:700;">${dept.pop}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;">
            <span>💰 Ingresos:</span><span style="color:#10b981;font-weight:700;">$${dept.revenue.toLocaleString()}</span>
          </div>
        </div>
      `, {
        className: 'light-popup',
        closeButton: false,
      })

      marker.on('mouseover', () => marker.openPopup())
      markersRef.current.push(marker)
    })

    // Connection lines between top 5 departments
    const topCoords = [...customerData].sort((a, b) => b.pop - a.pop).slice(0, 5)
    for (let i = 0; i < topCoords.length - 1; i++) {
      const line = L.polyline(
        [[topCoords[i].lat, topCoords[i].lng], [topCoords[i + 1].lat, topCoords[i + 1].lng]],
        { color: '#0066ff', weight: 1.5, opacity: 0.3, dashArray: '6 4' }
      ).addTo(map)
      markersRef.current.push(line)
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [mapReady])

  const flyTo = useCallback((lat: number, lng: number, zoom = 10) => {
    if (mapRef.current) mapRef.current.flyTo([lat, lng], zoom, { duration: 1.5 })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const getNodeColor = (pop: number) => {
    const ratio = pop / maxPop
    if (ratio > 0.6) return '#0052cc'
    if (ratio > 0.3) return '#0088ff'
    return '#4ba3e3'
  }

  return (
    <div style={{ padding: 0, minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0', padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(0,100,255,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0052cc, #0088ff)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,82,204,0.15)' }}>
              <Globe size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: '#0f172a' }}>
                Ubicación de Negocios
              </h1>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Centro de Geolocalización y Ventas</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,82,204,0.05)', border: '1px solid rgba(0,82,204,0.1)', borderRadius: 10, padding: '8px 14px' }}>
            <Radio size={14} color="#0052cc" className="animate-pulse" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0052cc', fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString('es-CO', { hour12: false })} COT
            </span>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="loc-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
        {[
          { icon: <Users size={18} />, label: 'Clientes Rastreados', value: totalCustomers.toLocaleString(), color: '#0052cc' },
          { icon: <TrendingUp size={18} />, label: 'Ingresos Mapeados', value: `$${(totalRevenue / 1000).toFixed(0)}K`, color: '#10b981' },
          { icon: <MapPin size={18} />, label: 'Departamentos Activos', value: customerData.filter(d => d.pop > 0).length.toString(), color: '#f59e0b' },
          { icon: <Zap size={18} />, label: 'Zona Más Activa', value: topDepts[0]?.name || '—', color: '#ec4899' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="loc-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0, minHeight: 550, background: '#ffffff' }}>

        {/* MAP AREA */}
        <div style={{ position: 'relative', borderRight: '1px solid #e2e8f0' }}>
          {!mapReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', zIndex: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <Loader2 size={32} color="#0052cc" className="animate-spin" />
                <p style={{ color: '#64748b', fontSize: 13, marginTop: 12, fontWeight: 600 }}>Cargando mapa mundial...</p>
              </div>
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: 550, background: '#f1f5f9' }} />
          {/* Map overlay title */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Eye size={14} color="#0052cc" />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#0052cc', letterSpacing: '1px', textTransform: 'uppercase' }}>Mapa Mundial de Compras</span>
          </div>
          {/* Fly to Colombia button */}
          <button onClick={() => flyTo(4.5, -74.0, 6)} style={{ position: 'absolute', bottom: 80, right: 12, zIndex: 1000, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', color: '#0052cc', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <LocateFixed size={14} /> Colombia
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: 550 }}>

          {/* Store Location Form */}
          <div style={{ padding: 20, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <MapPin size={16} color="#0052cc" />
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mi Ubicación</h3>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ciudad</label>
              <select value={storeCity} onChange={e => setStoreCity(e.target.value)}
                style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none', appearance: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <option value="">Seleccionar ciudad...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección del Negocio</label>
              <input type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="Ej: Cra 7 #45-12, Centro"
                style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} />
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', background: saving ? '#64748b' : saved ? '#10b981' : 'linear-gradient(135deg, #0052cc, #0088ff)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: saved ? '0 4px 12px rgba(16,185,129,0.2)' : '0 4px 12px rgba(0,82,204,0.2)', transition: 'all 0.3s' }}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : saved ? <><Save size={16} /> ¡Guardado!</> : <><Navigation size={16} /> Guardar Ubicación</>}
            </button>
          </div>

          {/* Top Departments Ranking */}
          <div style={{ padding: 20, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={16} color="#10b981" />
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Zonas</h3>
            </div>
            {topDepts.map((dept, i) => (
              <div key={dept.id}
                onClick={() => { setSelectedDept(dept.id); flyTo(dept.lat, dept.lng, 9) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '10px 12px', background: selectedDept === dept.id ? 'rgba(0,82,204,0.08)' : '#ffffff', border: `1px solid ${selectedDept === dept.id ? '#0052cc' : '#e2e8f0'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: i === 0 ? '#0052cc' : i === 1 ? '#0088ff' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: i < 2 ? '#ffffff' : '#64748b', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{dept.name}</div>
                  <div style={{ height: 4, borderRadius: 2, background: '#f1f5f9', marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, #0052cc, ${getNodeColor(dept.pop)})`, width: `${(dept.pop / maxPop) * 100}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0052cc' }}>{dept.pop}</div>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>compras</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom styles for Leaflet popups */}
      <style>{`
        .light-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .light-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .light-popup .leaflet-popup-tip {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: none !important;
        }
        .leaflet-control-zoom a {
          background: #ffffff !important;
          color: #0052cc !important;
          border-color: #cbd5e1 !important;
          font-weight: 800 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f1f5f9 !important;
          color: #0052cc !important;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .leaflet-pulse-marker {
          animation: pulse-ring 2s ease-out infinite;
        }
        @media (max-width: 900px) {
          .loc-main-grid {
            grid-template-columns: 1fr !important;
          }
          .loc-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .loc-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
