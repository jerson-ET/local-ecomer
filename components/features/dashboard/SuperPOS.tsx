'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Monitor, 
  Search, 
  ShoppingCart, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  User, 
  Plus, 
  Minus,
  X,
  Zap,
  CreditCard,
  Banknote,
  Scan,
  Settings,
  ChevronRight
} from 'lucide-react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface Product {
  id: string
  name: string
  price: number
  discount_price: number | null
  stock: number
  images: any[]
  sku: string | null
}

interface CartItem extends Product {
  cartQuantity: number
}

export const SuperPOS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [skuMap, setSkuMap] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanInput, setScanInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [processing, setProcessing] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'other'>('cash')
  const [isMobile, setIsMobile] = useState(false)
  const [showCartMobile, setShowCartMobile] = useState(false)
  const [isConfiguringSKUs, setIsConfiguringSKUs] = useState(false)
  const [tempSkus, setTempSkus] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)
  const translatorObserverRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    fetchProducts()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchProducts = async () => {
    try {
      const storeRes = await fetch('/api/user/stores')
      if (storeRes.ok) {
        const stores = await storeRes.json()
        if (stores.length > 0) {
          const res = await fetch(`/api/products?storeId=${stores[0].id}`)
          if (res.ok) {
            const data = await res.json()
            const allProducts = data.products || []
            setProducts(allProducts)
            
            const map: Record<string, Product> = {}
            const skuObj: Record<string, string> = {}
            allProducts.forEach((p: Product) => {
              if (p.sku) {
                map[p.sku.toLowerCase()] = p
                skuObj[p.id] = p.sku
              }
              map[p.id] = p
            })
            setSkuMap(map)
            setTempSkus(skuObj)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.1)
    } catch (e) {
      console.warn('Audio feedback failed', e)
    }
  }

  // Mapa de traducciones: inglés → español
  const SCANNER_TRANSLATIONS: Record<string, string> = {
    'Scanning': 'Escaneando',
    'Stop Scanning': 'Detener escáner',
    'Start Scanning': 'Iniciar escáner',
    'Switch On Torch': 'Encender linterna',
    'Switch Off Torch': 'Apagar linterna',
    'Zoom': 'Zoom',
    'Select Camera': 'Seleccionar cámara',
    'Request Camera Permissions': 'Solicitar permisos de cámara',
    'Tap to grant permissions': 'Toca aquí para dar permiso',
    'Permission denied. Please grant camera permissions.': 'Permiso denegado. Activa los permisos de cámara.',
    'Camera not found': 'Cámara no encontrada',
    'Camera access denied': 'Acceso a la cámara denegado',
    'No cameras found': 'No se encontraron cámaras',
    'Last Match:': 'Último escaneado:',
    'Code scanned = ': 'Código = ',
    'Scan type:': 'Tipo:',
    'Scanning paused': 'Escáner pausado',
    'Scanning in progress': 'Escaneando...',
    'Requesting camera...': 'Activando cámara...',
    'Loading': 'Cargando',
    'Tap here to grant permissions': 'Toca aquí para dar permisos',
    'File based scan': 'Escanear imagen',
    'Or drop an image to scan': 'O suelta una imagen para escanear',
    'Select Image': 'Seleccionar imagen',
    'Scanning...': 'Escaneando...',
    'Launching Camera...': 'Iniciando cámara...',
    'Environment': 'Trasera',
    'User': 'Delantera',
    'environment': 'Trasera',
    'user': 'Delantera',
  }

  const translateScannerUI = () => {
    const readerEl = document.getElementById('reader')
    if (!readerEl) return

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        for (const [en, es] of Object.entries(SCANNER_TRANSLATIONS)) {
          if (node.textContent.includes(en)) {
            node.textContent = node.textContent.replace(en, es)
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        // Traducir placeholder y title de inputs/botones
        if (el.hasAttribute('placeholder')) {
          const ph = el.getAttribute('placeholder') || ''
          for (const [en, es] of Object.entries(SCANNER_TRANSLATIONS)) {
            if (ph.includes(en)) el.setAttribute('placeholder', ph.replace(en, es))
          }
        }
        if (el.hasAttribute('title')) {
          const t = el.getAttribute('title') || ''
          for (const [en, es] of Object.entries(SCANNER_TRANSLATIONS)) {
            if (t.includes(en)) el.setAttribute('title', t.replace(en, es))
          }
        }
        el.childNodes.forEach(translateNode)
      }
    }

    // Traducción inicial
    translateNode(readerEl)

    // Observer para traducir cambios dinámicos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach(translateNode)
        if (m.type === 'characterData' && m.target) translateNode(m.target)
      })
    })
    observer.observe(readerEl, { childList: true, subtree: true, characterData: true })
    translatorObserverRef.current = observer
  }

  const startScanner = () => {
    setIsScanning(true)
    setTimeout(() => {
      // Enfocar el input de código manual al abrir el escáner
      scanInputRef.current?.focus()

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ]

      const config = { 
        fps: 20, 
        qrbox: { width: 250, height: 120 },
        aspectRatio: 1.0,
        videoConstraints: { facingMode: "environment" },
        formatsToSupport,
      }
      
      const scanner = new Html5QrcodeScanner("reader", config, false)
      
      scanner.render((decodedText) => {
        const now = Date.now()
        if (lastScannedRef.current?.code === decodedText && now - lastScannedRef.current.time < 1500) {
          return
        }
        lastScannedRef.current = { code: decodedText, time: now }
        handleScan(decodedText)
        // Mantener foco en el input manual después de escanear
        setTimeout(() => scanInputRef.current?.focus(), 200)
      }, (_err) => {})
      
      scannerRef.current = scanner

      // Iniciar traducción de la UI del escáner al español
      setTimeout(translateScannerUI, 300)
    }, 100)
  }

  const stopScanner = () => {
    // Detener observer de traducción
    if (translatorObserverRef.current) {
      translatorObserverRef.current.disconnect()
      translatorObserverRef.current = null
    }
    if (scannerRef.current) {
      try { scannerRef.current.clear() } catch (e) {}
      scannerRef.current = null
    }
    setIsScanning(false)
    setScanInput('')
  }

  const handleScan = (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return
    // Buscar por SKU (lowercase) o por product ID (UUID original)
    const product = skuMap[trimmed.toLowerCase()] || skuMap[trimmed]
    if (product) {
      playBeep()
      addToCart(product)
    }
  }

  const handleManualCodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleScan(scanInput)
      setScanInput('')
    }
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        )
      }
      return [...prev, { ...product, cartQuantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.cartQuantity + delta)
        return { ...item, cartQuantity: newQty }
      }
      return item
    }))
  }

  const totalAmount = cart.reduce((acc, item) => {
    const price = item.discount_price || item.price
    return acc + (price * item.cartQuantity)
  }, 0)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setProcessing(true)
    try {
      const paymentLabel = paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'transfer' ? 'Transferencia' : 'Otro'
      const cartSummary = cart.map(i => `${i.name} x${i.cartQuantity}`).join(', ')
      const notesText = `POS-Caja | Pago: ${paymentLabel} | Productos: ${cartSummary}`

      const errors: string[] = []

      for (const item of cart) {
        const res = await fetch('/api/accounting/manual-sale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.id,
            quantity: item.cartQuantity,
            buyerName: buyerName || 'Cliente de Caja',
            estimatedDelivery: 'Entregado en tienda',
            status: 'delivered',
            notes: notesText,
            source: 'pos',
          })
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const msg = data?.error || `Error al guardar "${item.name}"`
          errors.push(`${item.name}: ${msg}`)
        }
      }

      if (errors.length > 0) {
        showToast(`⚠️ ${errors.join(' | ')}`, 'error')
      } else {
        showToast(`✅ Venta registrada · ${paymentLabel} · $${totalAmount.toLocaleString('es-CO')}`, 'success')
        setCart([])
        setBuyerName('')
        setShowCartMobile(false)
      }

      fetchProducts()
    } catch (_err) {
      showToast('⚠️ Error de red. Revisa tu conexión.', 'error')
    } finally {
      setProcessing(false)
    }
  }



  const saveSkus = async () => {
    setProcessing(true)
    try {
      const storeRes = await fetch('/api/user/stores')
      const stores = await storeRes.json()
      const storeId = stores[0]?.id

      for (const [id, sku] of Object.entries(tempSkus)) {
        const p = products.find(prod => prod.id === id)
        if (p && p.sku !== sku) {
          await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id, storeId, sku })
          })
        }
      }
      alert('Configuración de IDs guardada.')
      setIsConfiguringSKUs(false)
      fetchProducts()
    } catch (e) {
      alert('Error al guardar configuración.')
    } finally {
      setProcessing(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: 16 }}>
        <Loader2 size={48} className="animate-spin" color="#6366f1" />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Iniciando Sistema POS...</span>
      </div>
    )
  }

  return (
    <div style={{ 
      display: isMobile ? 'block' : 'grid', 
      gridTemplateColumns: isMobile ? 'none' : '1fr 380px', 
      height: 'calc(100vh - 65px)', 
      background: '#0f172a', 
      color: 'white', 
      overflow: 'hidden',
      position: 'relative',
      paddingBottom: isMobile ? '80px' : '0' 
    }}>
      {/* Toast de notificación */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, maxWidth: '90vw', width: 'max-content',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', borderRadius: 14, padding: '12px 20px',
          fontSize: 14, fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          animation: 'fadeInDown 0.3s ease',
          textAlign: 'center', lineHeight: 1.5,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Configuration Modal */}
      {isConfiguringSKUs && (

        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Configurar IDs (SKU)</h3>
              <button onClick={() => setIsConfiguringSKUs(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><X size={24} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {products.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0f172a', padding: 10, borderRadius: 12 }}>
                  <img src={p.images?.[0]?.thumbnail} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                  <input 
                    type="text" 
                    placeholder="Nuevo ID" 
                    value={tempSkus[p.id] || ''}
                    onChange={(e) => setTempSkus(prev => ({ ...prev, [p.id]: e.target.value }))}
                    style={{ width: 100, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: 'white', fontSize: 12, padding: '6px 10px' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={saveSkus} disabled={processing} style={{ width: '100%', padding: 14, background: '#6366f1', color: 'white', border: 'none', borderRadius: 12, fontWeight: 900 }}>
                {processing ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div style={{ 
        padding: isMobile ? '16px' : '24px', 
        height: '100%',
        overflowY: 'auto', 
        borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
        display: (isMobile && showCartMobile) ? 'none' : 'block'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)', flexShrink: 0 }}>
              <Monitor size={20} color="white" />
            </div>
            {!isMobile && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Sistema POS</h2>
                <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>Cámara trasera activada</p>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setIsConfiguringSKUs(true)}
              style={{ background: '#334155', color: 'white', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer' }}
              title="Configurar SKUs"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={isScanning ? stopScanner : startScanner}
              style={{ 
                background: isScanning ? '#ef4444' : '#10b981', 
                color: 'white', border: 'none', borderRadius: 10, padding: isMobile ? '8px 12px' : '10px 18px', 
                fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                boxShadow: isScanning ? '0 0 15px rgba(239, 68, 68, 0.3)' : '0 0 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isScanning ? <X size={18} /> : <Scan size={18} />} 
              {isScanning ? 'Cerrar' : isMobile ? 'Cámara' : 'Escanear ID'}
            </button>
          </div>
        </div>

        {isScanning && (
          <div style={{ marginBottom: 24, borderRadius: 20, overflow: 'hidden', border: '2px solid #10b981', background: '#0f172a' }}>
            {/* Cámara para QR y barcodes */}
            <div id="reader" style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}></div>

            {/* Entrada manual para códigos alfanuméricos */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: 8, 
                background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                <Scan size={16} color="white" />
              </div>
              <input
                ref={scanInputRef}
                type="text"
                placeholder="Escribe el código (ej: tt4546) y pulsa Enter"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={handleManualCodeSubmit}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  flex: 1,
                  background: '#1e293b',
                  border: '1.5px solid #6366f1',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '9px 14px',
                  outline: 'none',
                  letterSpacing: 1,
                }}
              />
              <button
                onClick={() => { handleScan(scanInput); setScanInput('') }}
                style={{
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 14px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                OK
              </button>
            </div>
            <p style={{ margin: 0, padding: '4px 16px 12px', fontSize: 11, color: '#64748b', textAlign: 'center' }}>
              La cámara detecta QR y barcodes. El campo de texto acepta cualquier código (ej: <strong style={{color:'#94a3b8'}}>tt4546</strong>, <strong style={{color:'#94a3b8'}}>762LM</strong>)
            </p>
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
          <input 
            type="text" 
            placeholder="Buscar producto o ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 44px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 500 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#1e293b',
                borderRadius: 10,
                padding: '7px 10px',
                cursor: 'pointer',
                border: '1px solid transparent',
                transition: 'background 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#263548')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1e293b')}
            >
              {/* Imagen pequeña */}
              {product.images?.[0]?.thumbnail ? (
                <img
                  src={product.images[0].thumbnail}
                  alt={product.name}
                  style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 42, height: 42, borderRadius: 8, background: '#334155', flexShrink: 0 }} />
              )}

              {/* Nombre */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 1 }}>
                  ID: {product.sku || '—'}
                </div>
              </div>

              {/* Precio */}
              <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981', flexShrink: 0 }}>
                ${(product.discount_price || product.price).toLocaleString('es-CO')}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Cart Column */}
      <div style={{ 
        background: '#1e293b', 
        display: (isMobile && !showCartMobile) ? 'none' : 'flex', 
        flexDirection: 'column',
        height: '100%',
        position: isMobile ? 'fixed' : 'relative',
        top: 0, left: 0, width: '100%', zIndex: 150
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingCart size={20} color="#6366f1" />
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Caja</h3>
            <span style={{ background: '#334155', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{cart.length}</span>
          </div>
          {isMobile && (
            <button onClick={() => setShowCartMobile(false)} style={{ background: 'transparent', border: 'none', color: 'white', padding: 4 }}><X size={24} /></button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
              <ShoppingCart size={40} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>Caja vacía</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 10, background: '#0f172a', padding: 10, borderRadius: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>${((item.discount_price || item.price) * item.cartQuantity).toLocaleString('es-CO')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ background: '#334155', border: 'none', color: 'white', width: 22, height: 22, borderRadius: 6, cursor: 'pointer' }}><Minus size={12} /></button>
                  <span style={{ fontSize: 13, fontWeight: 900, minWidth: 16, textAlign: 'center' }}>{item.cartQuantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ background: '#334155', border: 'none', color: 'white', width: 22, height: 22, borderRadius: 6, cursor: 'pointer' }}><Plus size={12} /></button>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: 2 }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '20px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <User size={16} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Nombre del Cliente" 
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid #334155', color: 'white', fontSize: 13, padding: '4px 0' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {['cash', 'transfer', 'other'].map(method => (
                <button 
                  key={method}
                  onClick={() => setPaymentMethod(method as any)} 
                  style={{ 
                    padding: '6px', borderRadius: 8, border: '1px solid', 
                    borderColor: paymentMethod === method ? (method === 'cash' ? '#10b981' : method === 'transfer' ? '#6366f1' : '#a855f7') : '#334155', 
                    background: paymentMethod === method ? 'rgba(255,255,255,0.05)' : 'transparent', 
                    color: paymentMethod === method ? 'white' : '#94a3b8', 
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 
                  }}
                >
                  {method === 'cash' ? <Banknote size={14} /> : method === 'transfer' ? <Zap size={14} /> : <CreditCard size={14} />}
                  {method === 'cash' ? 'Efectivo' : method === 'transfer' ? 'Transf.' : 'Otro'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>TOTAL</span>
            <span style={{ fontSize: 24, fontWeight: 950, color: '#10b981' }}>${totalAmount.toLocaleString('es-CO')}</span>
          </div>

          <button 
            disabled={cart.length === 0 || processing}
            onClick={handleCheckout}
            style={{ 
              width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 12, 
              fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)', opacity: (cart.length === 0 || processing) ? 0.5 : 1
            }}
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
            {processing ? 'PROCESANDO...' : 'FINALIZAR VENTA'}
          </button>
        </div>
      </div>

      {/* Fixed Bottom Cart Bar for Mobile */}
      {isMobile && !showCartMobile && cart.length > 0 && (
        <div 
          onClick={() => setShowCartMobile(true)}
          style={{ 
            position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1e293b', 
            padding: '12px 20px', borderTop: '2px solid #6366f1', display: 'flex', 
            alignItems: 'center', justifyContent: 'space-between', zIndex: 140,
            boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#6366f1', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>
              {cart.length}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>VER CARRITO</div>
              <div style={{ fontSize: 16, fontWeight: 950, color: '#10b981' }}>${totalAmount.toLocaleString('es-CO')}</div>
            </div>
          </div>
          <button style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 800 }}>
            COBRAR <ChevronRight size={14} style={{ marginLeft: 4 }} />
          </button>
        </div>
      )}
    </div>
  )
}
