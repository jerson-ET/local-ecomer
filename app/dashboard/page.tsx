'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import {
  Store,
  ChevronDown,
  Menu,
  X,
  BarChart3,
  Users,
  User,
  TrendingUp,
  LogOut,
  Package,
  Settings,
  Sparkles,
  DollarSign,
  ShoppingBag,
  Plus,
  Crown,
  Search,
  Share2,
  Download,
  Image,
  QrCode,
  Heart,
  Loader2,
  Smartphone,
  Monitor,
  FileText,
  CreditCard,
  Zap,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  MessageCircle,
  Gift,
  BookOpen,
} from 'lucide-react'

/* ── Modular Sub-Panels ── */
import { CreateStoreSection, ChangeTemplateSection, StoreCheckoutConfigSection } from '@/components/features/dashboard/StoreManager'
import { ProductUploadSection, ProductListSection } from '@/components/features/dashboard/ProductManager'
import MasterAdminPanel from '@/components/features/dashboard/MasterAdminPanel'
import AdminInvoicesPanel from '@/components/features/dashboard/AdminInvoicesPanel'
import BuyerPanel from '@/components/features/dashboard/BuyerPanel'
import BillingSection from '@/components/features/dashboard/BillingSection'
import OnboardingWizard from '@/components/auth/OnboardingWizard'
import { AccountingBook } from '@/components/features/dashboard/AccountingBook'
import { SuperPOS } from '@/components/features/dashboard/SuperPOS'
import '@/components/features/dashboard/admin-panel.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TIPOS DE MENÚ                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubMenuItem { id: string; label: string; icon: React.ReactNode }
interface MenuItem { id: string; label: string; icon: React.ReactNode; subItems?: SubMenuItem[] }

const masterMenuItems: MenuItem[] = [
  { id: 'panel', label: 'Panel Maestro', icon: <Crown size={20} /> },
  { id: 'global-stores', label: 'Tiendas Global', icon: <Store size={20} /> },
  { id: 'global-users', label: 'Usuarios', icon: <Users size={20} /> },
  { id: 'admin-invoices', label: 'Facturas Pagadas', icon: <FileText size={20} /> },
]

const sellerMenuItems: MenuItem[] = [
  { id: 'admin-store', label: 'Administrar Tienda', icon: <Store size={20} />, subItems: [
    { id: 'view-catalog', label: 'Mi Catálogo', icon: <Share2 size={16} /> },
    { id: 'create-store', label: 'Catálogo', icon: <Sparkles size={16} /> },
    { id: 'all-products', label: 'Productos', icon: <Gift size={16} /> },
    { id: 'accounting-book', label: 'Cuaderno contabilidad', icon: <BookOpen size={16} /> },
  ]},
  { id: 'system', label: 'Sistema POS', icon: <Monitor size={20} />, subItems: [
    { id: 'super-pos', label: 'Ventas de caja', icon: <Smartphone size={16} /> },
  ]},
]

const buyerMenuItems: MenuItem[] = [
  { id: 'panel', label: 'Mi Perfil', icon: <User size={20} /> },
  { id: 'buyer-orders', label: 'Mis Compras', icon: <ShoppingBag size={20} /> },
  { id: 'buyer-favorites', label: 'Favoritos', icon: <Heart size={20} /> },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN DASHBOARD                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardPageWrapper() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>}>
      <DashboardPage />
    </React.Suspense>
  )
}

function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const impersonatedUserId = searchParams.get('impersonate')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>('admin-store')
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'panel')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userStore, setUserStore] = useState<{
    id: string; name: string; slug: string; banner_url?: string; whatsapp_number?: string; payment_methods?: string[]; auto_discount_rules?: unknown
  } | null>(null)
  const [initialTemplate, setInitialTemplate] = useState('minimal')
  const [isLoadingStore, setIsLoadingStore] = useState(true)
  const [userRole, setUserRole] = useState<string>('buyer')
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [globalStats, setGlobalStats] = useState({ users: 0, stores: 0 })
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [paidUntil, setPaidUntil] = useState<string | null>(null)
  const [subscriptionExpired, setSubscriptionExpired] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{days:number, hrs:number, mins:number, secs:number}>({days:0, hrs:0, mins:0, secs:0})
  const [generatingPayment, setGeneratingPayment] = useState(false)

  useEffect(() => {
    const section = searchParams.get('section')
    if (section) {
      setActiveSection(section)
      // Si la sección es billing (Mi Plan), abrimos el acordeón correspondiente
      if (section === 'billing') {
        setExpandedMenu('admin-store')
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (!paidUntil) return;
    const timer = setInterval(() => {
      const diff = new Date(paidUntil).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({days:0, hrs:0, mins:0, secs:0});
        setSubscriptionExpired(true);
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hrs: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / 1000 / 60) % 60),
        secs: Math.floor((diff / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paidUntil]);
  const handleEfipayPayment = async (amount: number) => {
    try {
      setGeneratingPayment(true)
      const res = await fetch('/api/efipay/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, amount })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar pago')
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (e: any) {
      alert(e.message)
      setGeneratingPayment(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadUser = async (retryCount = 0) => {
      console.log("[DASHBOARD] Iniciando carga de usuario...", { impersonatedUserId, retryCount });
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // 1. Obtener el usuario REAL (el que está logueado)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          // Si no hay usuario, esperar un momento y reintentar (la sesión puede no estar lista aún)
          if (retryCount < 3) {
            console.log(`[DASHBOARD] No hay usuario, reintentando en 500ms... (intento ${retryCount + 1}/3)`);
            setTimeout(() => { if (!cancelled) loadUser(retryCount + 1) }, 500)
            return;
          }
          console.log("[DASHBOARD] No hay usuario después de 3 intentos, redirigiendo...");
          router.push('/?auth=required&redirect=/dashboard');
          return;
        }

        setCurrentUserId(user.id);
        setUserEmail(user.email || '');

        // Check subscription status
        const userPaidUntil = user.user_metadata?.paid_until || null;
        setPaidUntil(userPaidUntil);

        // 2. Determinar el rol REAL
        let realRole = 'buyer';
        if (user.user_metadata?.role === 'superadmin' || user.app_metadata?.role === 'superadmin') {
          realRole = 'superadmin';
        } else {
          const { data: profile } = await supabase.from('profiles').select('role, nombre').eq('id', user.id).single();
          if (profile?.role) realRole = profile.role;
          if (profile?.nombre) {
            setUserName(profile.nombre);
          } else if (realRole !== 'superadmin') {
            // Si no tiene nombre y no es superadmin, gatillar onboarding
            setShowOnboarding(true);
          }
        }
        
        console.log("[DASHBOARD] Rol real detectado:", realRole);

        // 3. Lógica de Impersonación (solo si es admin)
        if (impersonatedUserId && (realRole === 'superadmin' || realRole === 'admin')) {
          console.log("[DASHBOARD] Intentando imitar usuario:", impersonatedUserId);
          const { data: targetProfile, error: targetError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', impersonatedUserId)
            .single();

          if (targetProfile) {
            console.log("[DASHBOARD] Perfil de destino encontrado:", targetProfile.nombre);
            setUserName(targetProfile.nombre || '');
            setUserEmail(`[IMITANDO] ${targetProfile.email || 'usuario@local-ecomer.com'}`);
            
            // Forzamos el rol al del usuario destino o 'seller' para ver su panel
            const targetRole = targetProfile.role === 'superadmin' ? 'superadmin' : (targetProfile.role || 'seller');
            setUserRole(targetRole);
            setIsImpersonating(true);

            // Cargar tienda del usuario destino
            const sRes = await fetch(`/api/stores?userId=${impersonatedUserId}`);
            if (sRes.ok) {
              const sData = await sRes.json();
              if (sData.stores?.length > 0) {
                const store = sData.stores[0];
                setUserStore(store);
                try { if (store.banner_url) { const parsed = JSON.parse(store.banner_url); if (parsed.templateId) setInitialTemplate(parsed.templateId) } } catch {}
                setActiveSection('create-store'); // Aseguramos que empiece en el catálogo en vez de Panel Vendedor
              } else { 
                setActiveSection('create-store'); 
              }
            }
            setIsLoadingStore(false);
            return;
          } else {
            console.error("[DASHBOARD] Error buscando perfil destino:", targetError);
          }
        }

        // 4. Lógica Normal (sin impersonación o fallo en la misma)
        setUserRole(realRole);

        // Check if subscription expired for sellers
        if (realRole === 'seller' && userPaidUntil) {
          const daysLeft = Math.ceil((new Date(userPaidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            setSubscriptionExpired(true);
          }
        }

        if (realRole === 'superadmin' || realRole === 'admin') {
          setIsLoadingStore(false);
          fetch('/api/admin/users').then(r => r.json()).then((d: any) => {
            if (d.users) { 
              const totalStores = d.users.reduce((acc: number, u: any) => acc + (u.stores?.length || 0), 0); 
              setGlobalStats({ users: d.total || 0, stores: totalStores });
            }
          }).catch(() => {});
          return;
        }

        // Carga normal para vendedores/compradores
        const res = await fetch('/api/stores');
        if (res.ok) {
          const storeData = await res.json();
          if (storeData.stores?.length > 0) {
            const store = storeData.stores[0];
            setUserStore(store);
            try { if (store.banner_url) { const parsed = JSON.parse(store.banner_url); if (parsed.templateId) setInitialTemplate(parsed.templateId) } } catch {}
            setActiveSection((prev) => prev === 'panel' ? 'all-products' : prev);
          } else { 
            setActiveSection('create-store'); 
          }
        }
      } catch (err) {
        console.error("[DASHBOARD] Error crítico en loadUser:", err);
      } finally { 
        setIsLoadingStore(false);
      }
    }
    loadUser()
  }, [impersonatedUserId]) // Dependemos del ID para re-ejecutar si cambia

  useEffect(() => {
    if (activeSection === 'store-settings' && !isLoadingStore) {
      fetch('/api/stores', { cache: 'no-store' }).then(r => r.json()).then((data) => {
        if (data.stores?.length > 0) {
          const store = data.stores[0]
          setUserStore(store)
          try { if (store.banner_url) { const parsed = JSON.parse(store.banner_url); if (parsed.templateId) setInitialTemplate(parsed.templateId) } } catch {}
        }
      }).catch(console.error)
    }
  }, [activeSection, isLoadingStore])

  const handleLogout = async () => {
    try { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signOut(); router.push('/') } catch { router.push('/') }
  }

  const toggleMenu = (menuId: string) => setExpandedMenu(expandedMenu === menuId ? null : menuId)
  const handleSubItemClick = (subItemId: string) => { setActiveSection(subItemId); setSidebarOpen(false) }

  const renderContent = () => {
    if (userRole === 'superadmin' || userRole === 'admin') {
      switch (activeSection) {
        case 'admin-invoices': return <AdminInvoicesPanel />
        default: return <MasterAdminPanel />
      }
    }
    if (userRole === 'buyer') return <BuyerPanel />


    // Seller flow
    switch (activeSection) {
      case 'create-store':
        return <CreateStoreSection store={userStore} onBack={() => setActiveSection('create-store')} />
      case 'store-settings':
        if (!userStore) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Sincronizando...</h2><button onClick={() => window.location.reload()} className="premium-btn-main" style={{ marginTop: '20px' }}>Recargar</button></div>
        return <ChangeTemplateSection onBack={() => setActiveSection('create-store')} store={userStore} initialTemplate={initialTemplate || 'store-minimal'} onAddProduct={() => setActiveSection('add-product')} />
      case 'store-checkout':
        if (!userStore) return <div>Cargando...</div>
        return <StoreCheckoutConfigSection onBack={() => setActiveSection('create-store')} store={userStore} />
      case 'add-product':
        return <ProductUploadSection onBack={() => setActiveSection('create-store')} onGoToProducts={() => setActiveSection('all-products')} storeId={userStore?.id || null} />
      case 'all-products':
        return <ProductListSection onBack={() => setActiveSection('create-store')} onAddProduct={() => setActiveSection('add-product')} storeId={userStore?.id || null} storeSlug={userStore?.slug || null} />
      case 'accounting-book':
        return <AccountingBook />
      case 'super-pos':
        return <SuperPOS />
      case 'view-catalog': {
        const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/tienda/${userStore?.slug}` : `https://localecomer.store/tienda/${userStore?.slug}`;

        // Obtener primera imagen del banner para el QR
        let firstBannerUrl = '';
        try {
          if (userStore?.banner_url) {
            if (userStore.banner_url.startsWith('{')) {
              const config = JSON.parse(userStore.banner_url);
              if (config.customUrls && config.customUrls.length > 0) firstBannerUrl = config.customUrls[0];
              else if (config.customUrl) firstBannerUrl = config.customUrl;
            } else {
              firstBannerUrl = userStore.banner_url;
            }
          }
        } catch {}

        const handleDownloadQRImage = () => {
          const svg = document.getElementById('store-qr-code');
          if (!svg) return;
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new window.Image();

          // Helper para rectángulos redondeados (compatibilidad)
          const fillRoundedRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
            c.beginPath();
            c.moveTo(x + r, y);
            c.lineTo(x + w - r, y);
            c.quadraticCurveTo(x + w, y, x + w, y + r);
            c.lineTo(x + w, y + h - r);
            c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            c.lineTo(x + r, y + h);
            c.quadraticCurveTo(x, y + h, x, y + h - r);
            c.lineTo(x, y + r);
            c.quadraticCurveTo(x, y, x + r, y);
            c.closePath();
            c.fill();
          };

          const drawFinalCanvas = (bannerImg?: HTMLImageElement) => {
            const padding = 60;
            const bannerHeight = bannerImg ? 200 : 0;
            const headerHeight = 80;
            const footerHeight = 60;
            canvas.width = img.width + padding * 2;
            canvas.height = img.height + padding * 2 + (bannerHeight ? bannerHeight + 20 : 0) + headerHeight + footerHeight;
            if (ctx) {
              // Background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              let currentY = padding;

              // Banner Image
              if (bannerImg) {
                const targetW = canvas.width - padding * 2;
                const targetH = bannerHeight;
                ctx.save();
                ctx.fillStyle = '#f1f5f9'; // Fallback color
                fillRoundedRect(ctx, padding, currentY, targetW, targetH, 20);
                ctx.clip();
                ctx.drawImage(bannerImg, padding, currentY, targetW, targetH);
                ctx.restore();
                currentY += bannerHeight + 20;
              }

              // Header (Nombre de la tienda)
              ctx.fillStyle = '#0f172a';
              ctx.font = 'bold 32px Inter, Arial, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(userStore?.name || 'Mi Tienda', canvas.width / 2, currentY + 36);
              
              ctx.fillStyle = '#6366f1';
              ctx.font = '500 18px Inter, Arial, sans-serif';
              ctx.fillText('Escanea para ver mi catálogo', canvas.width / 2, currentY + 65);
              
              // QR Code
              ctx.drawImage(img, padding, currentY + headerHeight);
              
              // Footer
              ctx.fillStyle = '#94a3b8';
              ctx.font = '14px Inter, Arial, sans-serif';
              ctx.fillText(storeUrl, canvas.width / 2, canvas.height - padding + 10);
              
              ctx.fillStyle = '#a855f7';
              ctx.font = 'bold 12px Inter, Arial, sans-serif';
              ctx.fillText('LocalEcomer.store', canvas.width / 2, canvas.height - padding + 30);
              
              // Descargar
              const link = document.createElement('a');
              link.download = `QR-${userStore?.slug || 'tienda'}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
            }
          };

          img.onload = () => {
            if (firstBannerUrl) {
              const bImg = new window.Image();
              bImg.crossOrigin = 'Anonymous';
              bImg.onload = () => drawFinalCanvas(bImg);
              bImg.onerror = () => drawFinalCanvas();
              // Cache buster para evitar problemas de CORS con imágenes cacheadas
              const separator = firstBannerUrl.includes('?') ? '&' : '?';
              bImg.src = firstBannerUrl + separator + 'cb=' + Date.now();
            } else {
              drawFinalCanvas();
            }
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        };

        const handleDownloadQRPdf = async () => {
          const { jsPDF } = await import('jspdf');
          const svg = document.getElementById('store-qr-code');
          if (!svg) return;
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new window.Image();
          const generatePdf = async (bannerImgData?: string) => {
            const qrDataUrl = canvas.toDataURL('image/png');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();
            
            // Header gradient bar
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 0, pageW, 8, 'F');
            doc.setFillColor(168, 85, 247);
            doc.rect(0, 8, pageW, 3, 'F');

            let currentY = 25;

            // Banner Image in PDF
            if (bannerImgData) {
              const bannerW = pageW - 40;
              const bannerH = 45;
              doc.addImage(bannerImgData, 'JPEG', 20, currentY, bannerW, bannerH, undefined, 'FAST');
              currentY += bannerH + 15;
            }

            // Store name
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.setTextColor(15, 23, 42);
            doc.text(userStore?.name || 'Mi Tienda', pageW / 2, currentY, { align: 'center' });
            
            // Subtitle
            doc.setFontSize(13);
            doc.setTextColor(100, 116, 139);
            doc.text('Escanea el código QR para visitar mi tienda', pageW / 2, currentY + 11, { align: 'center' });
            
            // QR with border
            const qrSize = 100;
            const qrX = (pageW - qrSize) / 2;
            const qrY = currentY + 25;
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.roundedRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 6, 6, 'S');
            doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
            
            // URL below QR
            doc.setFontSize(10);
            doc.setTextColor(99, 102, 241);
            doc.text(storeUrl, pageW / 2, qrY + qrSize + 18, { align: 'center' });
            
            // Instructions box
            const boxY = qrY + qrSize + 30;
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(30, boxY, pageW - 60, 36, 4, 4, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(30, boxY, pageW - 60, 36, 4, 4, 'S');
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text('¿Cómo funciona?', pageW / 2, boxY + 12, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text('1. Abre la cámara de tu celular', pageW / 2, boxY + 21, { align: 'center' });
            doc.text('2. Apunta al código QR', pageW / 2, boxY + 27, { align: 'center' });
            doc.text('3. ¡Listo! Se abrirá la tienda automáticamente', pageW / 2, boxY + 33, { align: 'center' });
            
            // Footer
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 287, pageW, 10, 'F');
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text('Creado con LocalEcomer.store — Tu comercio digital empieza aquí', pageW / 2, 293, { align: 'center' });
            
            doc.save(`QR-${userStore?.slug || 'tienda'}.pdf`);
          };

          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            if (firstBannerUrl) {
              const bImg = new window.Image();
              bImg.crossOrigin = 'Anonymous';
              bImg.onload = () => {
                const bCanvas = document.createElement('canvas');
                bCanvas.width = bImg.width;
                bCanvas.height = bImg.height;
                const bCtx = bCanvas.getContext('2d');
                bCtx?.drawImage(bImg, 0, 0);
                generatePdf(bCanvas.toDataURL('image/jpeg', 0.9));
              };
              bImg.onerror = () => generatePdf();
              const separator = firstBannerUrl.includes('?') ? '&' : '?';
              bImg.src = firstBannerUrl + separator + 'cb=' + Date.now();
            } else {
              generatePdf();
            }
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        };

        return (
          <div style={{ padding: '40px 24px', maxWidth: 600, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(99,102,241,0.3)' }}>
                <Store size={32} color="white" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>{userStore?.name || 'Mi Catálogo'}</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Comparte tu catálogo con tus clientes</p>
            </div>

            {/* Store URL */}
            <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 16, padding: '20px', marginBottom: 16, wordBreak: 'break-all', textAlign: 'center', fontSize: 14, color: '#475569', fontWeight: 500 }}>
              {storeUrl}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
              <button
                onClick={() => window.open(`/tienda/${userStore?.slug}`, '_blank')}
                style={{ flex: 1, background: '#0f172a', color: 'white', padding: '16px', borderRadius: 14, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ExternalLink size={18} /> Ver mi Tienda
              </button>
              <button
                onClick={async () => { const url = storeUrl; try { await navigator.clipboard.writeText(url); alert('¡Enlace copiado!') } catch { window.prompt('Copia este enlace:', url) } }}
                style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', padding: '16px', borderRadius: 14, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
              >
                <Share2 size={18} /> Copiar Enlace
              </button>
            </div>

            {/* QR Code Section */}
            <div style={{ background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', maxWidth: 440, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                <QrCode size={22} color="#6366f1" />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Código QR de tu Tienda</h3>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                Este QR es <strong>único</strong> para tu tienda. Tus clientes lo escanean con la cámara del celular y se abre tu catálogo directamente.
              </p>

              {/* Store Banner Image */}
              {firstBannerUrl && (
                <div style={{ marginBottom: 24, borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <img src={firstBannerUrl} alt="Banner" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                </div>
              )}

              {/* QR Code */}
              <div style={{ background: '#ffffff', display: 'inline-block', padding: 20, borderRadius: 20, border: '3px solid #f1f5f9', marginBottom: 12 }}>
                <QRCode
                  id="store-qr-code"
                  value={storeUrl}
                  size={200}
                  level="H"
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                  style={{ width: 200, height: 200 }}
                />
              </div>

              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 24, fontWeight: 500 }}>
                {userStore?.name} · {storeUrl}
              </p>

              {/* Download Buttons */}
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                <button
                  onClick={handleDownloadQRPdf}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white',
                    padding: '16px', borderRadius: 14, fontWeight: 700, fontSize: 14,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(220,38,38,0.25)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <FileText size={18} /> Descargar QR en PDF
                </button>
                <button
                  onClick={handleDownloadQRImage}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: '#0f172a', color: 'white',
                    padding: '16px', borderRadius: 14, fontWeight: 700, fontSize: 14,
                    border: 'none', cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Download size={18} /> Descargar QR como Imagen
                </button>
              </div>
            </div>

            {/* Tips */}
            <div style={{ marginTop: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: '16px 20px' }}>
              <p style={{ fontSize: 13, color: '#166534', fontWeight: 700, marginBottom: 6 }}>💡 Consejo</p>
              <p style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6, margin: 0 }}>
                Imprime el PDF y colócalo en tu local, tarjetas de presentación o redes sociales. Cada persona que escanee el QR verá <strong>tu tienda directamente</strong>.
              </p>
            </div>
          </div>
        )
      }
      case 'billing':
      case 'my-invoices':
        return <BillingSection />
      default:
        return <CreateStoreSection store={userStore} onBack={() => setActiveSection('create-store')} />
    }
  }

  const getActiveMenuItems = () => {
    let items: MenuItem[] = []
    if (userRole === 'superadmin' || userRole === 'admin') items = masterMenuItems
    else if (userRole === 'buyer') items = buyerMenuItems
    else {
      items = sellerMenuItems.map(item => {
        if (item.subItems) {
          return {
            ...item,
            subItems: item.subItems.map(sub => {
              if (sub.id === 'create-store') {
                return { ...sub, label: userStore ? 'Actualizar Catálogo' : 'Crear Catálogo' }
              }
              return sub
            })
          }
        }
        return item
      })
    }
    return items.map(item => {
      if (item.id === 'global-users' && globalStats.users > 0) return { ...item, label: `${item.label} (${globalStats.users})` }
      if (item.id === 'global-stores' && globalStats.stores > 0) return { ...item, label: `${item.label} (${globalStats.stores})` }
      return item
    })
  }

  const sectionTitles: Record<string, string> = {
    'panel': userName ? `Panel de ${userName.split(' ')[0]}` : 'Panel de Administración',
    'create-store': userStore ? 'Actualizar Catálogo' : 'Crear Catálogo',
    'store-settings': 'Productos',
    'store-checkout': 'Caja y Asistente IA',
    'add-product': 'Subir Producto',
    'all-products': 'Productos',
    'accounting-book': 'Cuaderno Contabilidad',
    'super-pos': 'Sistema POS',
    'view-catalog': 'Ver mi Catálogo',
    'all-orders': 'Gestión de Pedidos',
    'billing': 'Mi Plan',
    'my-invoices': 'Mi Plan',
    'admin-invoices': 'Facturas Pagadas',
    'affiliate-network': 'Mi Red de Recomendados',
    'buyer-orders': 'Mis Compras',
  }

  return (
    <div className="dashboard-layout" suppressHydrationWarning>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon" style={{ display: 'flex', alignItems: 'center' }}>
              {(() => {
                const isPro = paidUntil && typeof window !== 'undefined' 
                  ? Math.ceil((new Date(paidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > 0 
                  : false;
                return isPro ? <Crown size={24} color="#9333ea" fill="#9333ea" /> : '⚡';
              })()}
            </span>
            <span className="brand-text">LocalEcomer</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">MENÚ PRINCIPAL</div>
          {getActiveMenuItems().map((item) => (
            <div key={item.id} className="nav-group">
              <button className={`nav-group-btn ${expandedMenu === item.id ? 'expanded' : ''} ${activeSection === item.id ? 'active' : ''}`} onClick={() => item.subItems ? toggleMenu(item.id) : handleSubItemClick(item.id)}>
                <div className="nav-group-left">{item.icon}<span>{item.label}</span></div>
                {item.subItems && <ChevronDown size={16} className={`nav-chevron ${expandedMenu === item.id ? 'rotated' : ''}`} />}
              </button>
              {item.subItems && expandedMenu === item.id && (
                <div className="nav-subitems">
                  {item.subItems.map((sub) => (
                    <button key={sub.id} className={`nav-subitem ${activeSection === sub.id ? 'active' : ''}`} onClick={() => handleSubItemClick(sub.id)}>
                      {sub.icon}<span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {userEmail && <div style={{ padding: '8px 16px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all' }}>{userEmail}</div>}
          <button className="sidebar-footer-btn" onClick={handleLogout}><LogOut size={18} /><span>Cerrar Sesión</span></button>
        </div>
      </aside>

      <div className="dashboard-main">
        {isImpersonating && (
          <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between z-[60] shrink-0 sticky top-0 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              Imitando panel de: {userName || 'Usuario'}
            </div>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="bg-amber-800 text-white px-3 py-1 rounded-full text-[10px] font-black hover:bg-amber-900 transition-colors shadow-sm"
            >
              SALIR DEL PANEL DIRECTO
            </button>
          </div>
        )}
        <header className="dashboard-topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
          
          <div className="flex-1 flex items-center justify-between px-2 md:px-4">
            <h1 className="topbar-title hidden md:block">{sectionTitles[activeSection] || 'Panel de Administración'}</h1>
            
            {/* Trial & Upgrade UI */}
            {userRole === 'seller' && (
              <div className="flex items-center gap-2 md:gap-4">
                {(() => {
                  const daysRemainingVal = paidUntil ? Math.ceil((new Date(paidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                  const isPro = daysRemainingVal > 21;

                  return (
                    <>
                      <div className="flex items-center gap-1.5 bg-black border border-gray-800 px-3 py-2 rounded-lg shadow-xl">
                        <div className="flex flex-col items-center">
                          <span className="text-[12px] font-[900] text-white uppercase tracking-tighter leading-none mb-2">
                            {isPro ? 'TU PLAN VENCE EN:' : 'TU PRUEBA VENCE EN:'}
                          </span>
                          <div className="flex gap-1">
                            {[
                              { label: 'D', val: timeLeft.days },
                              { label: 'H', val: timeLeft.hrs },
                              { label: 'M', val: timeLeft.mins },
                              { label: 'S', val: timeLeft.secs }
                            ].map((t, i) => (
                              <div key={i} className="flex flex-col items-center">
                                <div className="bg-white text-red-600 w-9 h-10 rounded-md flex items-center justify-center font-[950] text-base shadow-md relative overflow-hidden" 
                                     style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.1), 0 2px 4px rgba(0, 0, 0, 0.3)' }}>
                                  <div className="absolute top-0 w-full h-1/2 bg-black/5 border-b border-black/5" />
                                  {String(t.val).padStart(2, '0')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {isPro ? (
                        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-2xl text-[10px] md:text-xs font-black flex items-center gap-2 cursor-default shadow-sm">
                          <Crown size={16} className="text-indigo-600" /> PLAN PRO ACTIVO
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="bg-[#0f172a] text-white px-2.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-black flex items-center gap-1.5 hover:scale-105 transition-transform active:scale-95 shadow-sm"
                        >
                          <Crown size={22} className="animate-pulse" color="#fbbf24" fill="#fbbf24" /> ADQUIRIR PLAN PRO
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
            {!userRole.includes('seller') && <div className="flex-1" />}
          </div>

          <div className="topbar-right flex items-center gap-4">
          </div>
        </header>

        <div className="dashboard-content flex-1 max-w-full overflow-y-auto w-full flex flex-col items-center bg-[#f9fafb]">
          <div className="w-full h-full max-w-[1600px] transition-all mx-auto">
            {isLoadingStore ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}><Loader2 size={32} className="spinning" color="#6366f1" /></div>
            ) : subscriptionExpired ? (
              /* ══════ PAYWALL: Suscripción expirada ══════ */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ background: 'linear-gradient(135deg, #200040 0%, #3a0070 50%, #5a0090 100%)', borderRadius: 32, padding: '48px 32px', maxWidth: 480, width: '100%', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 60px rgba(32, 0, 64, 0.4)' }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.06 }}>
                    <Zap size={200} strokeWidth={1} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.1)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <AlertTriangle size={36} color="#E6007E" />
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>Tu suscripción ha expirado</h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '0 0 8px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                      Para seguir usando tu tienda, catálogo y todas las herramientas de LocalEcomer, renueva tu plan mensual.
                    </p>
                    {paidUntil && (
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 32px' }}>
                        Venció el {new Date(paidUntil).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}

                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                        <ShieldCheck size={16} color="#E6007E" />
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Pago seguro · 100% protegido</span>
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>$34.000 <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>COP /mes</span></div>
                    </div>

                    <button
                      onClick={() => handleEfipayPayment(34000)}
                      disabled={generatingPayment}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', 
                        background: '#E6007E', color: '#fff', padding: '18px 0', borderRadius: 18, 
                        fontWeight: 900, fontSize: 15, textTransform: 'uppercase', letterSpacing: 2, 
                        border: 'none', cursor: generatingPayment ? 'not-allowed' : 'pointer', 
                        boxShadow: '0 8px 30px rgba(230, 0, 126, 0.5)', transition: 'all 0.2s ease' 
                      }}
                    >
                      {generatingPayment ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />} 
                      {generatingPayment ? 'Generando Pago...' : 'Pagar Suscripción'}
                    </button>

                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 20, lineHeight: 1.6 }}>
                      Después de pagar, tu acceso se reactivará. Si pagaste mediante Efipay, esto toma unos minutos.
                    </p>

                    <button
                      onClick={handleLogout}
                      style={{ marginTop: 16, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '10px 24px', borderRadius: 12, fontWeight: 700, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}
                    >
                      <LogOut size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : renderContent()}
          </div>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingWizard 
          userId={currentUserId}
          userEmail={userEmail}
          onComplete={() => {
            setShowOnboarding(false);
            window.location.reload(); // Recargamos para que todo el estado del dashboard se actualice con la nueva tienda
          }}
        />
      )}

      {/* Modern Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 32,
            maxWidth: 420,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowUpgradeModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none', padding: 8, borderRadius: 12, cursor: 'pointer' }}
            >
              <X size={20} color="#64748b" />
            </button>

            <div style={{ padding: '40px 30px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                width: 64, height: 64, borderRadius: 20, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                marginBottom: 24, boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)' 
              }}>
                <Crown size={32} color="white" />
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.5px' }}>
                Activa tu Plan Pro
              </h2>

              <div style={{ background: '#f3f4f6', border: '2px solid #000000', borderRadius: 20, padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Info size={32} color="#000000" />
                  <div>
                    <h4 style={{ fontSize: 20, fontWeight: 900, color: '#000000', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>Importante</h4>
                    <p style={{ fontSize: 18, color: '#000000', lineHeight: 1.4, margin: 0, fontWeight: 800 }}>
                      Da clic en PAGAR, y una vez que pagues <strong>TOMA UNA CAPTURA</strong> del comprobante. Al final, debes enviarla por WhatsApp para que la validemos.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <button 
                  onClick={() => window.open('https://checkout.nequi.wompi.co/l/rNw9DV', '_blank')}
                  className="premium-btn-main"
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    gap: 12, width: '100%', background: '#0f172a', color: 'white', 
                    padding: '18px 0', borderRadius: 18, fontWeight: 900, 
                    fontSize: 14, textTransform: 'uppercase', letterSpacing: '1px',
                    border: 'none', cursor: 'pointer', 
                    marginBottom: 12, transition: 'all 0.2s ease'
                  }}
                >
                  <ShieldCheck size={18} />
                  Pagar $34.000 con Wompi
                </button>

                <button 
                  onClick={() => {
                    const identifier = `ID ${currentUserId || 'N/A'}`;
                    const waMessage = `Hola, acabo de pagar mi plan mensual de LocalEcomer a $34.000 (Wompi). Mi ${identifier}. Te envío mi captura para validar mis 30 días.`
                    window.open(`https://wa.me/573005730682?text=${encodeURIComponent(waMessage)}`, '_blank')
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    gap: 12, width: '100%', background: '#25d366', color: 'white', 
                    padding: '18px 0', borderRadius: 18, fontWeight: 900, 
                    fontSize: 14, textTransform: 'uppercase', letterSpacing: '1px',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar Captura por WhatsApp
                </button>
              </div>

              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 24, fontWeight: 600 }}>
                $34.000 COP / Mensual · Activación inmediata
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
