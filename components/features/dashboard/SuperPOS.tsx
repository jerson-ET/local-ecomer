'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Monitor, 
  Search, 
  ShoppingCart, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Package, 
  User, 
  Plus, 
  Minus,
  X,
  Zap,
  CreditCard,
  Banknote,
  Smartphone,
  Scan
} from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [processing, setProcessing] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'other'>('cash')
  const [isMobile, setIsMobile] = useState(false)
  const [showCartMobile, setShowCartMobile] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null)

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
            
            // Create a fast lookup map for SKUs
            const map: Record<string, Product> = {}
            allProducts.forEach((p: Product) => {
              if (p.sku) map[p.sku.toLowerCase()] = p
              map[p.id] = p // Also by ID
            })
            setSkuMap(map)
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
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.1)
    } catch (e) {
      console.warn('Audio feedback failed', e)
    }
  }

  const startScanner = () => {
    setIsScanning(true)
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 20, // Increased FPS for faster recognition
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      )
      
      scanner.render((decodedText) => {
        // Debounce to avoid multiple scans of same item in milliseconds
        const now = Date.now()
        if (lastScannedRef.current?.code === decodedText && now - lastScannedRef.current.time < 1500) {
          return
        }
        lastScannedRef.current = { code: decodedText, time: now }
        
        handleScan(decodedText)
      }, (error) => {
        // quiet error
      })
      
      scannerRef.current = scanner
    }, 100)
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch (e) {
        console.error('Error clearing scanner', e)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const handleScan = (code: string) => {
    const product = skuMap[code.toLowerCase()]
    if (product) {
      playBeep()
      addToCart(product)
    }
    // We don't alert error here to keep continuous flow smooth
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 } 
            : item
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

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setProcessing(true)
    
    try {
      for (const item of cart) {
        await fetch('/api/accounting/manual-sale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.id,
            quantity: item.cartQuantity,
            buyerName: buyerName || 'Cliente de Caja',
            estimatedDelivery: 'Entregado en tienda',
            status: 'delivered'
          })
        })
      }
      
      alert('Venta realizada con éxito.')
      setCart([])
      setBuyerName('')
      setShowCartMobile(false)
      fetchProducts()
    } catch (error) {
      console.error('Error in checkout:', error)
      alert('Hubo un error al procesar la venta.')
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
      position: 'relative'
    }}>
      {/* Left Column: Product Selection & Search */}
      <div style={{ 
        padding: isMobile ? '16px' : '24px', 
        height: isMobile ? '100%' : 'auto',
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
                <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>Escaneo continuo activado</p>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
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
              {isScanning ? 'Cerrar' : isMobile ? 'Escanear' : 'Escanear ID'}
            </button>
            
            {isMobile && cart.length > 0 && (
              <button 
                onClick={() => setShowCartMobile(true)}
                style={{ 
                  background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, padding: '8px 12px', 
                  fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                }}
              >
                <ShoppingCart size={18} /> ({cart.length})
              </button>
            )}
          </div>
        </div>

        {isScanning && (
          <div style={{ marginBottom: 24, position: 'relative', borderRadius: 20, overflow: 'hidden', border: '2px solid #10b981', background: 'black' }}>
            <div id="reader" style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '2px solid rgba(16, 185, 129, 0.5)', width: '180px', height: '180px', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: -2, left: -2, width: 15, height: 15, borderTop: '3px solid #10b981', borderLeft: '3px solid #10b981' }} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 15, height: 15, borderTop: '3px solid #10b981', borderRight: '3px solid #10b981' }} />
              <div style={{ position: 'absolute', bottom: -2, left: -2, width: 15, height: 15, borderBottom: '3px solid #10b981', borderLeft: '3px solid #10b981' }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 15, height: 15, borderBottom: '3px solid #10b981', borderRight: '3px solid #10b981' }} />
            </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              style={{ background: '#1e293b', borderRadius: 16, padding: 12, cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s', position: 'relative' }}
            >
              {product.images?.[0]?.thumbnail && (
                <img src={product.images[0].thumbnail} alt={product.name} style={{ width: '100%', height: isMobile ? 100 : 120, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
              )}
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>${(product.discount_price || product.price).toLocaleString('es-CO')}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>ID: {product.sku || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Cart & Checkout (Desktop sidebar or Mobile full screen) */}
      <div style={{ 
        background: '#1e293b', 
        display: (isMobile && !showCartMobile) ? 'none' : 'flex', 
        flexDirection: 'column',
        height: '100%',
        position: isMobile ? 'absolute' : 'relative',
        top: 0, left: 0, width: '100%', zIndex: 50
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
    </div>
  )
}
