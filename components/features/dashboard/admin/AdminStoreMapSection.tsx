'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Loader2, Eye, LocateFixed, Search, Store } from 'lucide-react'

interface UserStore {
  id: string
  name: string
  slug: string
  isActive: boolean
  bannerUrl?: string | null
}

interface AdminUser {
  id: string
  email: string
  name: string
  whatsapp: string | null
  city: string | null
  stores: UserStore[]
}

interface AdminStoreMapSectionProps {
  users: AdminUser[]
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'bogota': { lat: 4.711, lng: -74.072 },
  'bogotá': { lat: 4.711, lng: -74.072 },
  'medellin': { lat: 6.244, lng: -75.574 },
  'medellín': { lat: 6.244, lng: -75.574 },
  'cali': { lat: 3.451, lng: -76.532 },
  'barranquilla': { lat: 10.963, lng: -74.796 },
  'cartagena': { lat: 10.399, lng: -75.514 },
  'bucaramanga': { lat: 7.13, lng: -73.126 },
  'cucuta': { lat: 7.893, lng: -72.503 },
  'cúcuta': { lat: 7.893, lng: -72.503 },
  'pereira': { lat: 4.814, lng: -75.696 },
  'manizales': { lat: 5.065, lng: -75.517 },
  'santa marta': { lat: 11.241, lng: -74.199 },
  'ibague': { lat: 4.439, lng: -75.232 },
  'ibagué': { lat: 4.439, lng: -75.232 },
  'villavicencio': { lat: 4.153, lng: -73.636 },
  'pasto': { lat: 1.214, lng: -77.281 },
  'neiva': { lat: 2.927, lng: -75.281 },
  'armenia': { lat: 4.534, lng: -75.681 },
  'monteria': { lat: 8.752, lng: -75.881 },
  'montería': { lat: 8.752, lng: -75.881 },
  'sincelejo': { lat: 9.305, lng: -75.397 },
  'valledupar': { lat: 10.473, lng: -73.253 },
  'popayan': { lat: 2.484, lng: -76.561 },
  'popayán': { lat: 2.484, lng: -76.561 },
  'tunja': { lat: 5.533, lng: -73.362 },
  'quibdo': { lat: 5.693, lng: -76.661 },
  'quibdó': { lat: 5.693, lng: -76.661 },
  'riohacha': { lat: 11.544, lng: -72.907 },
  'florencia': { lat: 1.614, lng: -75.606 },
  'yopal': { lat: 5.337, lng: -72.394 },
  'mocoa': { lat: 1.152, lng: -76.649 },
  'arauca': { lat: 7.091, lng: -70.762 },
  'san andres': { lat: 12.584, lng: -81.701 },
  'san andrés': { lat: 12.584, lng: -81.701 },
}

function getCoordsForLocation(locText: string, index: number) {
  const normalized = locText.toLowerCase()
  for (const key in CITY_COORDS) {
    if (normalized.includes(key)) {
      const coord = CITY_COORDS[key]
      if (coord) {
        // Agregar un pequeño offset pseudo-aleatorio para evitar encimar tiendas en la misma ciudad
        const angle = (index * 137.5) * (Math.PI / 180)
        const r = 0.015 * Math.sqrt(Math.random())
        return { 
          lat: coord.lat + r * Math.sin(angle), 
          lng: coord.lng + r * Math.cos(angle) 
        }
      }
    }
  }
  // Offset pseudo-aleatorio cerca de Bogotá
  const angle = (index * 137.5) * (Math.PI / 180)
  const r = 0.12 * Math.sqrt(Math.random())
  return { 
    lat: 4.711 + r * Math.sin(angle), 
    lng: -74.072 + r * Math.cos(angle) 
  }
}

export default function AdminStoreMapSection({ users }: AdminStoreMapSectionProps) {
  const [mapReady, setMapReady] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<any>(null)

  // Extraer y estructurar tiendas
  const stores = useMemo(() => {
    const list: any[] = []
    let index = 0
    users.forEach(u => {
      u.stores.forEach(s => {
        let loc = ''
        try {
          if (s.bannerUrl && s.bannerUrl.startsWith('{')) {
            const parsed = JSON.parse(s.bannerUrl)
            loc = parsed.shippingLocation || ''
          }
        } catch {}
        
        const textLoc = loc || u.city || 'No especificada'
        const coords = getCoordsForLocation(textLoc, index++)
        
        list.push({
          id: s.id,
          name: s.name,
          slug: s.slug,
          isActive: s.isActive,
          ownerName: u.name,
          ownerEmail: u.email,
          ownerPhone: u.whatsapp,
          locationText: textLoc,
          lat: coords.lat,
          lng: coords.lng,
        })
      })
    })
    return list
  }, [users])

  // Filtrar tiendas por buscador
  const filteredStores = useMemo(() => {
    return stores.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.locationText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [stores, searchTerm])

  // Cargar Leaflet via CDN
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

  // Inicializar mapa
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

    // Capa de mapa (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      layerGroupRef.current = null
    }
  }, [mapReady])

  // Re-dibujar marcadores cuando cambia la lista de tiendas
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || !mapReady) return
    const L = window.L
    
    // Limpiar marcadores anteriores
    layerGroupRef.current.clearLayers()

    filteredStores.forEach(s => {
      const color = s.isActive ? '#10b981' : '#ef4444' // Verde si activa, rojo si inactiva
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 8,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(layerGroupRef.current)

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; min-width: 200px; padding: 6px 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></div>
            <strong style="font-size: 14px; color: #0f172a;">${s.name}</strong>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 12px; display: flex; items-center: center; gap: 3px;">
            📍 <span>${s.locationText}</span>
          </div>
          <div style="font-size: 11px; color: #334155; margin-bottom: 12px; background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #f1f5f9;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">Vendedor:</div>
            <div>${s.ownerName}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">${s.ownerEmail}</div>
            ${s.ownerPhone ? `<div style="font-size: 10px; color: #64748b; margin-top: 1px;">WA: ${s.ownerPhone}</div>` : ''}
          </div>
          <a href="/tienda/${s.slug}" target="_blank" rel="noopener noreferrer" 
            style="display: block; width: 100%; text-align: center; background: #6366f1; color: white; padding: 8px 0; border-radius: 8px; font-weight: 700; font-size: 11px; text-decoration: none; box-shadow: 0 4px 10px rgba(99,102,241,0.25); text-transform: uppercase; letter-spacing: 0.5px;">
            Ver Catálogo
          </a>
        </div>
      `, {
        closeButton: false,
      })

      // Evento click para seleccionar en la lista
      marker.on('click', () => {
        setSelectedStoreId(s.id)
      })
    })
  }, [filteredStores, mapReady])

  const flyTo = useCallback((lat: number, lng: number, zoom = 12) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, { duration: 1.5 })
    }
  }, [])

  const handleSelectStore = (s: any) => {
    setSelectedStoreId(s.id)
    flyTo(s.lat, s.lng, 13)
  }

  return (
    <div style={{ padding: 0, minHeight: '650px', background: '#ffffff', color: '#1e293b', fontFamily: "'Inter', sans-serif", border: '1px solid #f1f5f9', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <div className="loc-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0, height: 600 }}>
        
        {/* MAP CONTAINER */}
        <div style={{ position: 'relative', height: '100%' }}>
          {!mapReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', zIndex: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <Loader2 size={32} color="#6366f1" className="animate-spin" />
                <p style={{ color: '#64748b', fontSize: 13, marginTop: 12, fontWeight: 600 }}>Cargando mapa interactivo...</p>
              </div>
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
          
          {/* Map Title overlay */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Eye size={14} color="#6366f1" />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', letterSpacing: '1px', textTransform: 'uppercase' }}>Ubicación de Tiendas</span>
          </div>

          {/* Reset view to Colombia */}
          <button onClick={() => flyTo(4.5, -74.0, 6)} style={{ position: 'absolute', bottom: 80, right: 12, zIndex: 1000, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', color: '#6366f1', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <LocateFixed size={14} /> Reestablecer Vista
          </button>
        </div>

        {/* SIDEBAR */}
        <div style={{ background: '#f8fafc', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          
          {/* Search bar */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0' }}>
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar tienda, ciudad, dueño..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, width: '100%', color: '#1e293b' }}
              />
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mostrando {filteredStores.length} de {stores.length} tiendas
            </div>
          </div>

          {/* Stores List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scrollbar">
            {filteredStores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <Store size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div style={{ fontSize: 12, fontWeight: 700 }}>No se encontraron tiendas</div>
              </div>
            ) : (
              filteredStores.map(s => {
                const isSelected = selectedStoreId === s.id
                return (
                  <div 
                    key={s.id}
                    onClick={() => handleSelectStore(s)}
                    style={{ 
                      background: 'white', 
                      border: `1.5px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                      borderRadius: '16px',
                      padding: '12px 14px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }} className="truncate max-w-[170px]">{s.name}</span>
                      <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '10px', background: s.isActive ? '#e2fbe8' : '#fde2e2', color: s.isActive ? '#10b981' : '#ef4444' }}>
                        {s.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginBottom: 8 }}>
                      📍 <span className="truncate">{s.locationText}</span>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#475569', fontWeight: 600 }}>
                      <span className="truncate">👤 {s.ownerName}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  )
}
