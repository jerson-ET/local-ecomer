'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  ClipboardList,
  Crown,
  Search,
  Share2,
  Heart,
  Loader2,
  Smartphone,
  Monitor,
  FileText,
  CreditCard,
  MessageCircle,
} from 'lucide-react'

/* ── Modular Sub-Panels ── */
import { CreateStoreSection, ChangeTemplateSection, StoreCheckoutConfigSection } from '@/components/features/dashboard/StoreManager'
import { ProductUploadSection, ProductListSection } from '@/components/features/dashboard/ProductManager'
import OrdersDashboard from '@/components/features/dashboard/OrdersDashboard'
import AdminPanel from '@/components/features/dashboard/AdminPanel'
import MasterAdminPanel from '@/components/features/dashboard/MasterAdminPanel'
import AdminInvoicesPanel from '@/components/features/dashboard/AdminInvoicesPanel'
import AffiliateNetworkDashboard from '@/components/features/dashboard/AffiliateNetworkDashboard'
import CommissionsDashboard from '@/components/features/dashboard/CommissionsDashboard'
import BuyerPanel from '@/components/features/dashboard/BuyerPanel'
import SellerCommissionsDashboard from '@/components/features/dashboard/SellerCommissionsDashboard'
import ResellerProductExplorer from '@/components/features/dashboard/ResellerProductExplorer'
import AdminAIAssistant from '@/components/features/dashboard/AdminAIAssistant'
import BillingSection from '@/components/features/dashboard/BillingSection'
import AffiliatePanel from '@/components/features/dashboard/AffiliatePanel'
import AdminTelegramPanel from '@/components/features/dashboard/AdminTelegramPanel'
import { TelegramProductUpload } from '@/components/features/dashboard/TelegramProductUpload'
import '@/components/features/dashboard/admin-panel.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TIPOS DE MENÚ                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubMenuItem { id: string; label: string; icon: React.ReactNode }
interface MenuItem { id: string; label: string; icon: React.ReactNode; subItems?: SubMenuItem[] }

const masterMenuItems: MenuItem[] = [
  { id: 'panel', label: 'Panel Maestro', icon: <Crown size={20} /> },
  { id: 'admin-telegram', label: 'Gestor Telegram', icon: <MessageCircle size={20} /> },
  { id: 'global-stores', label: 'Tiendas Global', icon: <Store size={20} /> },
  { id: 'global-users', label: 'Usuarios', icon: <Users size={20} /> },
  { id: 'admin-invoices', label: 'Facturas Pagadas', icon: <FileText size={20} /> },
]

const sellerMenuItems: MenuItem[] = [
  { id: 'panel', label: 'Panel Vendedor', icon: <BarChart3 size={20} /> },
  { id: 'admin-store', label: 'Administrar Tienda', icon: <Store size={20} />, subItems: [
    { id: 'create-store', label: 'Crear Catálogo', icon: <Sparkles size={16} /> },
    { id: 'store-settings', label: 'Mi Catálogo', icon: <Settings size={16} /> },
    { id: 'store-checkout', label: 'Caja (IA)', icon: <DollarSign size={16} /> },
  ]},
  { id: 'products', label: 'Catálogo', icon: <Package size={20} />, subItems: [
    { id: 'all-products', label: 'Mis Productos', icon: <ShoppingBag size={16} /> },
    { id: 'add-product', label: 'Subir Nuevo', icon: <Plus size={16} /> },
    { id: 'telegram-upload', label: 'Subir por Telegram', icon: <Smartphone size={16} /> },
  ]},
  { id: 'orders', label: 'Ventas', icon: <ClipboardList size={20} />, subItems: [
    { id: 'all-orders', label: 'Ver Pedidos', icon: <ShoppingBag size={16} /> },
    { id: 'seller-commissions', label: 'Mis Ganancias', icon: <DollarSign size={16} /> },
  ]},
  { id: 'billing', label: 'Suscripción', icon: <CreditCard size={20} />, subItems: [
    { id: 'my-invoices', label: 'Facturas de Pago', icon: <FileText size={16} /> },
  ]},
  { id: 'affiliate-network', label: 'Invitar', icon: <Users size={20} /> },
]

const resellerMenuItems: MenuItem[] = [
  { id: 'panel', label: 'Panel Revendedor', icon: <TrendingUp size={20} /> },
  { id: 'reseller-explore', label: 'Explorar Productos', icon: <Search size={20} /> },
  { id: 'reseller-links', label: 'Mis Enlaces', icon: <Share2 size={20} /> },
  { id: 'reseller-commissions', label: 'Mis Comisiones', icon: <DollarSign size={20} /> },
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
  const [activeSection, setActiveSection] = useState('panel')
  const [userInitials, setUserInitials] = useState('TU')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userStore, setUserStore] = useState<{
    id: string; name: string; slug: string; banner_url?: string; whatsapp_number?: string; payment_methods?: string[]; auto_discount_rules?: unknown
  } | null>(null)
  const [initialTemplate, setInitialTemplate] = useState('minimal')
  const [isLoadingStore, setIsLoadingStore] = useState(true)
  const [userRole, setUserRole] = useState<string>('buyer')
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [globalStats, setGlobalStats] = useState({ users: 0, stores: 0 })

  useEffect(() => {
    const loadUser = async () => {
      console.log("[DASHBOARD] Iniciando carga de usuario...", { impersonatedUserId });
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // 1. Obtener el usuario REAL (el que está logueado)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log("[DASHBOARD] No hay usuario logueado, redirigiendo...");
          router.push('/');
          return;
        }

        setUserEmail(user.email || '');
        const localPart = user.email?.split('@')[0] ?? ''
        const parts = localPart.split('.')
        setUserInitials(((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase() || 'TU')

        // 2. Determinar el rol REAL
        let realRole = 'buyer';
        if (user.user_metadata?.role === 'superadmin' || user.app_metadata?.role === 'superadmin') {
          realRole = 'superadmin';
        } else {
          const { data: profile } = await supabase.from('profiles').select('role, nombre').eq('id', user.id).single();
          if (profile?.role) realRole = profile.role;
          if (profile?.nombre) setUserName(profile.nombre);
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
            const tParts = (targetProfile.nombre || 'Usuario').split(' ');
            setUserInitials(((tParts[0]?.[0] ?? '') + (tParts[1]?.[0] ?? tParts[0]?.[1] ?? '')).toUpperCase());
            
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
                setActiveSection('panel'); // Aseguramos que empiece en el panel
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
        case 'admin-telegram': return <AdminTelegramPanel />
        default: return <MasterAdminPanel />
      }
    }
    if (userRole === 'buyer') return <BuyerPanel />
    if (userRole === 'reseller') {
      switch (activeSection) {
        case 'reseller-explore': return <ResellerProductExplorer />
        case 'reseller-commissions': return <CommissionsDashboard />
        default: return <AffiliateNetworkDashboard />
      }
    }

    // Seller flow
    switch (activeSection) {
      case 'panel':
        if (!isLoadingStore && !userStore) return <CreateStoreSection onBack={() => setActiveSection('panel')} />
        return <AdminPanel storeSlug={userStore?.slug} storeId={userStore?.id || ''} />
      case 'create-store':
        return <CreateStoreSection onBack={() => setActiveSection('panel')} />
      case 'store-settings':
        if (!userStore) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Sincronizando...</h2><button onClick={() => window.location.reload()} className="premium-btn-main" style={{ marginTop: '20px' }}>Recargar</button></div>
        return <ChangeTemplateSection onBack={() => setActiveSection('panel')} store={userStore} initialTemplate={initialTemplate || 'store-minimal'} onAddProduct={() => setActiveSection('add-product')} />
      case 'store-checkout':
        if (!userStore) return <div>Cargando...</div>
        return <StoreCheckoutConfigSection onBack={() => setActiveSection('panel')} store={userStore} />
      case 'add-product':
        return <ProductUploadSection onBack={() => setActiveSection('panel')} onGoToProducts={() => setActiveSection('all-products')} storeId={userStore?.id || null} />
      case 'telegram-upload':
        return <TelegramProductUpload onBack={() => setActiveSection('all-products')} storeId={userStore?.id || null} />
      case 'all-products':
        return <ProductListSection onBack={() => setActiveSection('panel')} onAddProduct={() => setActiveSection('add-product')} storeId={userStore?.id || null} />
      case 'all-orders':
        return <OrdersDashboard storeId={userStore?.id || ''} />
      case 'seller-commissions':
        if (!userStore?.id) return <div>Cargando...</div>
        return <SellerCommissionsDashboard />
      case 'my-invoices':
        return <BillingSection />
      case 'affiliate-network':
        return <AffiliatePanel />
      default:
        if (!isLoadingStore && !userStore) return <CreateStoreSection onBack={() => setActiveSection('panel')} />
        return <AdminPanel storeSlug={userStore?.slug} storeId={userStore?.id || ''} />
    }
  }

  const getActiveMenuItems = () => {
    let items: MenuItem[] = []
    if (userRole === 'superadmin' || userRole === 'admin') items = masterMenuItems
    else if (userRole === 'reseller') items = resellerMenuItems
    else if (userRole === 'buyer') items = buyerMenuItems
    else items = sellerMenuItems
    return items.map(item => {
      if (item.id === 'global-users' && globalStats.users > 0) return { ...item, label: `${item.label} (${globalStats.users})` }
      if (item.id === 'global-stores' && globalStats.stores > 0) return { ...item, label: `${item.label} (${globalStats.stores})` }
      return item
    })
  }

  const sectionTitles: Record<string, string> = {
    'panel': userName ? `Panel de ${userName.split(' ')[0]}` : 'Panel de Administración',
    'create-store': 'Crear Nuevo Catálogo',
    'store-settings': 'Mi Catálogo',
    'store-checkout': 'Caja y Asistente IA',
    'add-product': 'Subir Producto',
    'all-products': 'Mis Productos',
    'all-orders': 'Gestión de Pedidos',
    'my-invoices': 'Facturas de Pago',
    'admin-invoices': 'Facturas Pagadas',
    'affiliate-network': 'Red de Afiliados',
    'buyer-orders': 'Mis Compras',
  }

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand"><span className="brand-icon">⚡</span><span className="brand-text">LocalEcomer</span></div>
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
          <h1 className="topbar-title">{sectionTitles[activeSection] || 'Panel de Administración'}</h1>
          <div className="topbar-right flex items-center gap-4">
            <div className="flex bg-gray-200 rounded-full p-1 shrink-0 shadow-inner">
              <button onClick={() => setViewMode('mobile')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'mobile' ? 'bg-white shadow text-[#FF5A26]' : 'text-gray-500 hover:text-gray-700'}`}><Smartphone size={16} strokeWidth={2.5} /></button>
              <button onClick={() => setViewMode('desktop')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'desktop' ? 'bg-white shadow text-[#FF5A26]' : 'text-gray-500 hover:text-gray-700'}`}><Monitor size={16} strokeWidth={2.5} /></button>
            </div>
            <div className="topbar-avatar" title={userEmail}><span>{userInitials}</span></div>
          </div>
        </header>

        <div className="dashboard-content flex-1 max-w-full overflow-y-auto w-full flex flex-col items-center bg-[#f9fafb]">
          <div className={`w-full h-full ${viewMode === 'mobile' ? 'max-w-md sm:border-x shadow-2xl bg-[#f9fafb]' : 'w-full max-w-[1600px]'} transition-all mx-auto`}>
            {isLoadingStore ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}><Loader2 size={32} className="spinning" color="#6366f1" /></div>
            ) : renderContent()}
          </div>
        </div>
      </div>

      <AdminAIAssistant 
        storeId={userStore?.id as string | undefined} 
        userName={userName as string} 
        storeName={userStore?.name as string | undefined} 
      />
    </div>
  )
}
