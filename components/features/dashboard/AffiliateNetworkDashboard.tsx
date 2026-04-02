'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Share2,
  Link as LinkIcon,
  DollarSign,
  TrendingUp,
  Users,
  ExternalLink,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'
import { createClient } from '@/lib/supabase/client'

interface ResellerData {
  clicks: number
  sales: number
  earnings: number
  pending: number
}

type ReferralLinkRow = {
  id: string
  code: string
  commission_pct: number
  created_at: string
  store_id: string
  product_id: string | null
  stores?: { name: string; slug: string } | null
  products?: { name: string } | null
}

type CommissionRow = {
  id: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
}

type ReferralEventRow = {
  referral_code: string
  event_type: 'click'
}

export default function AffiliateNetworkDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'links'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [links, setLinks] = useState<ReferralLinkRow[]>([])
  const [commissions, setCommissions] = useState<CommissionRow[]>([])
  const [clicksByCode, setClicksByCode] = useState<Record<string, number>>({})
  const [salesByCode, setSalesByCode] = useState<Record<string, number>>({})

  const [storeSlugInput, setStoreSlugInput] = useState('')
  const [productIdInput, setProductIdInput] = useState('')
  const [commissionPctInput, setCommissionPctInput] = useState('10')
  const [isCreating, setIsCreating] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLinks([])
        setCommissions([])
        setError('Debes iniciar sesión como revendedor.')
        return
      }

      const [{ data: linksData, error: linksError }, { data: commData, error: commError }] =
        await Promise.all([
          supabase
            .from('referral_links')
            .select('id, code, commission_pct, created_at, store_id, product_id, stores(name, slug), products(name)')
            .eq('reseller_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('commissions')
            .select('id, amount, status, referral_code')
            .eq('reseller_id', user.id)
            .order('created_at', { ascending: false })
            .limit(200),
        ])

      if (linksError) throw linksError
      if (commError) throw commError

      const nextLinks = (linksData || []) as any as ReferralLinkRow[]
      const nextCommissions = (commData || []) as any as (CommissionRow & { referral_code?: string | null })[]

      setLinks(nextLinks)
      setCommissions(nextCommissions as any)

      const salesMap: Record<string, number> = {}
      for (const c of nextCommissions) {
        const code = String(c.referral_code || '')
        if (!code) continue
        if (c.status === 'cancelled') continue
        salesMap[code] = (salesMap[code] || 0) + 1
      }
      setSalesByCode(salesMap)

      const codes = nextLinks.map((l) => l.code).filter(Boolean)
      if (codes.length > 0) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('referral_events')
          .select('referral_code, event_type')
          .in('referral_code', codes)
          .limit(5000)
        if (eventsError) throw eventsError

        const clicksMap: Record<string, number> = {}
        for (const ev of (eventsData || []) as any as ReferralEventRow[]) {
          if (ev.event_type !== 'click') continue
          clicksMap[String(ev.referral_code)] = (clicksMap[String(ev.referral_code)] || 0) + 1
        }
        setClicksByCode(clicksMap)
      } else {
        setClicksByCode({})
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats: ResellerData = useMemo(() => {
    const paid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount || 0), 0)
    const pending = commissions
      .filter((c) => c.status === 'pending')
      .reduce((s, c) => s + Number(c.amount || 0), 0)
    const sales = commissions.filter((c) => c.status !== 'cancelled').length
    const clicks = Object.values(clicksByCode).reduce((s, n) => s + n, 0)
    return { clicks, sales, earnings: paid, pending }
  }, [commissions, clicksByCode])

  const buildUrl = (link: ReferralLinkRow) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localecomer.vercel.app'
    const base = `${origin}/tienda/${link.stores?.slug || ''}`
    const params = new URLSearchParams()
    params.set('ref', link.code)
    if (link.product_id) params.set('productId', link.product_id)
    return `${base}?${params.toString()}`
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copia el enlace:', url)
    }
  }

  const generateCode = () => {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return `ref_${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`
  }

  const createLink = async () => {
    setIsCreating(true)
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesión expirada')

      const slug = storeSlugInput.trim()
      if (!slug) throw new Error('Ingresa el slug de la tienda')

      const { data: storeRow, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()
      if (storeError) throw storeError

      const pct = Number(commissionPctInput)
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error('Comisión inválida')

      const code = generateCode()
      const productId = productIdInput.trim() || null

      const { error: insError } = await supabase.from('referral_links').insert({
        reseller_id: user.id,
        store_id: storeRow.id,
        product_id: productId,
        code,
        commission_pct: pct,
      })
      if (insError) throw insError

      setStoreSlugInput('')
      setProductIdInput('')
      setCommissionPctInput('10')
      await loadData()
      setActiveTab('links')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando link')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Share2 size={20} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900">Panel Revendedor</h2>
          <p className="text-sm text-gray-500 font-medium">
            Crea enlaces, comparte y gana comisiones.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
        >
          {isLoading ? <Loader2 className="spinning" size={16} /> : 'Actualizar'}
        </button>
      </div>

      {/* TABS */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1">
        {[
          { id: 'overview', label: 'Resumen', icon: <TrendingUp size={16} /> },
          { id: 'links', label: 'Enlaces', icon: <LinkIcon size={16} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === t.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-white rounded-2xl border border-rose-100 p-4 flex items-start gap-2 text-rose-700 font-bold">
          <AlertCircle size={18} className="mt-0.5" /> {error}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1 text-gray-500">
              <Share2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Clicks</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{stats.clicks}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1 text-gray-500">
              <Users size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Ventas</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{stats.sales}</div>
          </div>
          <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1 text-emerald-100">
              <DollarSign size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Pagado</span>
            </div>
            <div className="text-2xl font-black">{formatCOP(stats.earnings)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1 text-gray-500">
              <TrendingUp size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Pendiente</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{formatCOP(stats.pending)}</div>
          </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" /> Crear enlace
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Slug tienda</div>
                <input
                  value={storeSlugInput}
                  onChange={(e) => setStoreSlugInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  placeholder="ej: mi-tienda"
                />
              </div>
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Producto (opcional)</div>
                <input
                  value={productIdInput}
                  onChange={(e) => setProductIdInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  placeholder="UUID producto"
                />
              </div>
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Comisión %</div>
                <input
                  value={commissionPctInput}
                  onChange={(e) => setCommissionPctInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  placeholder="10"
                />
              </div>
            </div>
            <button
              onClick={createLink}
              disabled={isCreating}
              className="mt-3 w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-black text-sm flex items-center justify-center gap-2"
            >
              {isCreating ? <Loader2 className="spinning" size={16} /> : <LinkIcon size={16} />}
              Crear enlace
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div className="font-black text-gray-900">Mis enlaces</div>
              <div className="text-xs font-black text-gray-500">{links.length} total</div>
            </div>

            {isLoading && (
              <div className="p-8 flex items-center justify-center gap-2 text-gray-600 font-bold">
                <Loader2 className="spinning" size={16} /> Cargando...
              </div>
            )}

            {!isLoading && links.length === 0 && (
              <div className="p-10 text-center text-gray-600">
                <div className="font-black text-gray-900 mb-1">Aún no tienes enlaces</div>
                <div className="text-sm">Crea tu primer enlace y compártelo.</div>
              </div>
            )}

            {!isLoading && links.length > 0 && (
              <div className="divide-y divide-gray-50">
                {links.map((l) => {
                  const url = buildUrl(l)
                  const clicks = clicksByCode[l.code] || 0
                  const conversions = salesByCode[l.code] || 0
                  return (
                    <div key={l.id} className="p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-black text-gray-900">
                            {l.stores?.name || 'Tienda'}{' '}
                            <span className="text-xs font-black text-gray-400">
                              • {l.commission_pct}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 font-bold">
                            {l.product_id ? `Producto: ${l.product_id}` : 'Enlace a la tienda completa'}
                          </div>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                              {clicks} clicks
                            </span>
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              {conversions} ventas
                            </span>
                          </div>
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                          title="Abrir"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                      <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div className="text-xs text-gray-600 font-mono truncate">{url}</div>
                        <button
                          onClick={() => copyLink(url)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 font-black text-xs flex items-center gap-2"
                        >
                          <LinkIcon size={14} /> Copiar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
