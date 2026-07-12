'use client'

import React, { useState, useEffect } from 'react'
import { Tag, Save, Trash2, Calendar, Users, Percent, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface StoreDiscountsSectionProps {
  store: {
    id: string
    name: string
    slug: string
    banner_url?: string | null
  } | null
  onUpdateStore: () => void
}

export function StoreDiscountsSection({ store, onUpdateStore }: StoreDiscountsSectionProps) {
  const [code, setCode] = useState('')
  const [percentage, setPercentage] = useState<number>(0)
  const [maxUses, setMaxUses] = useState<string>('')
  const [usedCount, setUsedCount] = useState<number>(0)
  const [expirationDate, setExpirationDate] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  const handleDateChange = (y: string, m: string, d: string) => {
    if (y && m && d) {
      setExpirationDate(`${y}-${m}-${d}`)
    } else {
      setExpirationDate('')
    }
  }

  // Sincronizar fecha desglosada
  useEffect(() => {
    if (expirationDate) {
      const parts = expirationDate.split('-')
      if (parts.length === 3) {
        setSelectedYear(parts[0])
        setSelectedMonth(parts[1])
        setSelectedDay(parts[2])
      }
    } else {
      setSelectedYear('')
      setSelectedMonth('')
      setSelectedDay('')
    }
  }, [expirationDate])
  
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extraer información existente al cargar
  useEffect(() => {
    if (store?.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
      try {
        const config = JSON.parse(store.banner_url)
        setCode(config.discountCode || '')
        setPercentage(Number(config.discountPercentage) || 0)
        setMaxUses(config.discountMaxUses !== undefined && config.discountMaxUses !== null ? String(config.discountMaxUses) : '')
        setUsedCount(Number(config.discountUsedCount) || 0)
        setExpirationDate(config.discountExpirationDate || '')
      } catch (e) {
        console.error('Error parsing store config for discounts:', e)
      }
    }
  }, [store])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return
    setError(null)
    
    // Validar parámetros
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      setError('Por favor, ingresa un código de descuento válido.')
      return
    }
    if (percentage <= 0 || percentage > 100) {
      setError('El porcentaje de descuento debe estar entre 1% y 100%.')
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch('/api/stores/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          discountCode: cleanCode,
          discountPercentage: percentage,
          discountMaxUses: maxUses.trim() !== '' ? Number(maxUses) : null,
          discountExpirationDate: expirationDate.trim() !== '' ? expirationDate : null,
          // Mantener el contador o resetearlo a 0 si es un nuevo código diferente
          discountUsedCount: cleanCode !== ((JSON.parse(store.banner_url || '{}').discountCode) || '').toUpperCase() ? 0 : usedCount
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el cupón')
      }

      setSaveSuccess(true)
      onUpdateStore()
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!store) return
    if (!window.confirm('¿Estás seguro de eliminar este código de descuento? El descuento dejará de estar disponible para todos.')) return
    
    setError(null)
    setIsDeleting(true)

    try {
      const res = await fetch('/api/stores/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          discountCode: null,
          discountPercentage: null,
          discountMaxUses: null,
          discountUsedCount: 0,
          discountExpirationDate: null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar el cupón')
      }

      setCode('')
      setPercentage(0)
      setMaxUses('')
      setUsedCount(0)
      setExpirationDate('')
      
      setDeleteSuccess(true)
      onUpdateStore()
      setTimeout(() => setDeleteSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setIsDeleting(false)
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

  // Evaluar estado del cupón
  const activeCouponCode = (JSON.parse(store.banner_url || '{}').discountCode || '').trim().toUpperCase()
  let couponStatus = 'Inactivo'
  let statusColor = '#64748b'

  if (activeCouponCode) {
    couponStatus = 'Activo'
    statusColor = '#10b981'

    if (expirationDate) {
      const today = new Date().toISOString().split('T')[0]
      if (today > expirationDate) {
        couponStatus = 'Vencido'
        statusColor = '#ef4444'
      }
    }
    
    if (maxUses) {
      if (usedCount >= Number(maxUses)) {
        couponStatus = 'Exhausto'
        statusColor = '#f59e0b'
      }
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
      {/* Premium Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #311042 100%)',
        border: '1px solid #c084fc',
        borderRadius: 12,
        padding: '16px 20px',
        color: '#ffffff',
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(192, 132, 252, 0.12)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(192, 132, 252, 0.12) 0%, transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: 'rgba(192, 132, 252, 0.2)', border: '1px solid #c084fc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Tag size={18} color="#e9d5ff" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Códigos de Descuento</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>
              Crea códigos promocionales para tu tienda. Limita su cantidad de usos o define una fecha de caducidad.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Form Box */}
        <div style={{
          background: '#0a050f',
          border: '1px solid #3c165a',
          borderRadius: 16,
          padding: '24px',
        }}>
          <form onSubmit={handleSave}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#c084fc" />
              Configurar Código Promocional
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Código */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                  CÓDIGO DE DESCUENTO (MAYÚSCULAS)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="Ej: OFERTA20, VERANO10"
                  disabled={isSaving || isDeleting}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#040108',
                    border: '1px solid #3c165a',
                    borderRadius: 10,
                    padding: '12px 14px',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 700,
                    outline: 'none',
                    letterSpacing: '1px',
                  }}
                />
              </div>

              {/* Porcentaje */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                  PORCENTAJE DE DESCUENTO (%)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={percentage || ''}
                    onChange={(e) => setPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    placeholder="Ej: 10, 15, 20"
                    disabled={isSaving || isDeleting}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#040108',
                      border: '1px solid #3c165a',
                      borderRadius: 10,
                      padding: '12px 36px 12px 14px',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                  <Percent size={16} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', right: 14, top: 15 }} />
                </div>
              </div>

              {/* Límites (Grilla de 2 columnas) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Límite de Usos */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                    CANTIDAD MÁXIMA DE USOS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Ej: 50, 100 (Vacío = Sin límite)"
                      disabled={isSaving || isDeleting}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#040108',
                        border: '1px solid #3c165a',
                        borderRadius: 10,
                        padding: '12px 14px 12px 36px',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 700,
                        outline: 'none',
                      }}
                    />
                    <Users size={16} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: 12, top: 15 }} />
                  </div>
                </div>
                {/* Fecha de Vencimiento */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                    FECHA MÁXIMA DE VALIDEZ
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '8px' }}>
                    {/* Día */}
                    <select
                      value={selectedDay}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedDay(val)
                        handleDateChange(selectedYear, selectedMonth, val)
                      }}
                      disabled={isSaving || isDeleting}
                      style={{
                        background: '#040108',
                        border: '1px solid #3c165a',
                        borderRadius: 10,
                        padding: '12px 8px',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <option value="" style={{ background: '#0a050f' }}>Día</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                        <option key={d} value={d} style={{ background: '#0a050f' }}>{d}</option>
                      ))}
                    </select>

                    {/* Mes */}
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedMonth(val)
                        handleDateChange(selectedYear, val, selectedDay)
                      }}
                      disabled={isSaving || isDeleting}
                      style={{
                        background: '#040108',
                        border: '1px solid #3c165a',
                        borderRadius: 10,
                        padding: '12px 8px',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <option value="" style={{ background: '#0a050f' }}>Mes</option>
                      {[
                        { value: '01', label: '01 - Ene' },
                        { value: '02', label: '02 - Feb' },
                        { value: '03', label: '03 - Mar' },
                        { value: '04', label: '04 - Abr' },
                        { value: '05', label: '05 - May' },
                        { value: '06', label: '06 - Jun' },
                        { value: '07', label: '07 - Jul' },
                        { value: '08', label: '08 - Ago' },
                        { value: '09', label: '09 - Sep' },
                        { value: '10', label: '10 - Oct' },
                        { value: '11', label: '11 - Nov' },
                        { value: '12', label: '12 - Dic' },
                      ].map(m => (
                        <option key={m.value} value={m.value} style={{ background: '#0a050f' }}>{m.label}</option>
                      ))}
                    </select>

                    {/* Año */}
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedYear(val)
                        handleDateChange(val, selectedMonth, selectedDay)
                      }}
                      disabled={isSaving || isDeleting}
                      style={{
                        background: '#040108',
                        border: '1px solid #3c165a',
                        borderRadius: 10,
                        padding: '12px 8px',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <option value="" style={{ background: '#0a050f' }}>Año</option>
                      {Array.from({ length: 15 }, (_, i) => String(2026 + i)).map(y => (
                        <option key={y} value={y} style={{ background: '#0a050f' }}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, color: '#ff4d6d', fontSize: 13, fontWeight: 600 }}>
                <AlertTriangle size={15} />
                {error}
              </div>
            )}

            {saveSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, color: '#10b981', fontSize: 13, fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                ¡Código de descuento configurado con éxito!
              </div>
            )}

            {deleteSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, color: '#f43f5e', fontSize: 13, fontWeight: 700 }}>
                <Trash2 size={16} />
                El código de descuento fue eliminado.
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isSaving || isDeleting || !code.trim() || !percentage}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '14px 24px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: (isSaving || isDeleting || !code.trim() || !percentage) ? 0.6 : 1,
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Guardar Código
                  </>
                )}
              </button>

              {activeCouponCode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting}
                  style={{
                    background: 'transparent',
                    border: '1px solid #f43f5e',
                    borderRadius: 10,
                    padding: '0 20px',
                    height: '48px',
                    color: '#f43f5e',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: isDeleting ? 0.6 : 1,
                  }}
                >
                  {isDeleting ? (
                    'Eliminando...'
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Borrar Código
                    </>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Sidebar Info (Only when coupon is active) */}
        {activeCouponCode && (
          <div style={{
            background: '#07030a',
            border: '1px solid #3c165a',
            borderRadius: 16,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Estado del Cupón
            </h3>

            {/* Badge de Estado */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: '12px 16px',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
              <span style={{ fontSize: 14, fontWeight: 900, color: '#ffffff' }}>{activeCouponCode}</span>
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', background: statusColor, color: '#ffffff', padding: '2px 8px', borderRadius: 6, marginLeft: 'auto' }}>
                {couponStatus}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
              {/* Descuento */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Descuento:</span>
                <span style={{ color: '#ffffff', fontWeight: 800 }}>-{percentage}%</span>
              </div>

              {/* Usos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Usos realizados:</span>
                <span style={{ color: '#ffffff', fontWeight: 800 }}>
                  {usedCount} {maxUses ? `/ ${maxUses}` : '(Sin límite)'}
                </span>
              </div>

              {/* Vencimiento */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Vence el:</span>
                <span style={{ color: '#ffffff', fontWeight: 800 }}>
                  {expirationDate || 'Sin límite temporal'}
                </span>
              </div>
            </div>

            {/* Mensajes de advertencia según estado */}
            {couponStatus === 'Vencido' && (
              <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 10, color: '#f43f5e', fontSize: 11, lineHeight: 1.4 }}>
                <strong>Cupón caducado:</strong> La fecha de vigencia del código ha pasado. Edita la fecha de validez o crea otro código para reactivarlo.
              </div>
            )}
            {couponStatus === 'Exhausto' && (
              <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 10, color: '#f59e0b', fontSize: 11, lineHeight: 1.4 }}>
                <strong>Límite alcanzado:</strong> El código ya ha sido reclamado por el número máximo de personas configurado.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
