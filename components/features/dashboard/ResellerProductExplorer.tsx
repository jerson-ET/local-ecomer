'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Link as LinkIcon, Loader2, Search, Share2, Store as StoreIcon, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ProductRow = {
  id: string
  name: string
  description: string | null
  price: number
  discount_price: number | null
  images: any
  store_id: string
  stores?: { name: string; slug: string } | null
}

type ReferralLinkRow = {
  code: string
}

function getMainImage(images: any): string | null {
  const imgs = Array.isArray(images) ? images : []
  if (imgs.length === 0) return null
  const main = imgs.find((i: any) => i?.isMain) || imgs[0]
  return main?.thumbnail || main?.full || null
}

export default function ResellerProductExplorer() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSharingId, setIsSharingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [cursor, setCursor] = useState<number>(0)
  const pageSize = 24

  const loadProducts = async (reset = false) => {
    setError(null)
    if (reset) {
      setCursor(0)
      setProducts([])
    }
    setIsLoading(true)
    try {
      const supabase = createClient()
      let q = supabase
        .from('products')
        .select('id, name, description, price, discount_price, images, store_id, stores(name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(reset ? 0 : cursor, (reset ? 0 : cursor) + pageSize - 1)

      const search = query.trim()
      if (search) {
        q = q.ilike('name', `%${search}%`)
      }

      const { data, error: qErr } = await q
      if (qErr) throw qErr

      const rows = (data || []) as any as ProductRow[]
      setProducts((prev) => (reset ? rows : [...prev, ...rows]))
      setCursor((prev) => (reset ? pageSize : prev + pageSize))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando productos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildReferralUrl = (storeSlug: string, productId: string, code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams()
    params.set('ref', code)
    params.set('productId', productId)
    return `${origin}/tienda/${storeSlug}?${params.toString()}`
  }

  const generateCode = () => {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return `ref_${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`
  }

  const shareProduct = async (p: ProductRow) => {
    setIsSharingId(p.id)
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesión como revendedor.')

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const role = String((profile as { role?: string } | null)?.role || '')
      if (role !== 'reseller') throw new Error('Tu cuenta no es de revendedor.')

      const storeSlug = p.stores?.slug
      if (!storeSlug) throw new Error('La tienda del producto no tiene slug.')

      const { data: existing } = await supabase
        .from('referral_links')
        .select('code')
        .eq('reseller_id', user.id)
        .eq('store_id', p.store_id)
        .eq('product_id', p.id)
        .maybeSingle()

      const existingCode = (existing as ReferralLinkRow | null)?.code
      const code = existingCode || generateCode()

      if (!existingCode) {
        const { error: upErr } = await supabase
          .from('referral_links')
          .upsert(
            {
              reseller_id: user.id,
              store_id: p.store_id,
              product_id: p.id,
              code,
              commission_pct: 10,
            },
            { onConflict: 'reseller_id,store_id,product_id' }
          )
        if (upErr) throw upErr
      }

      const url = buildReferralUrl(storeSlug, p.id, code)

      if (navigator.share) {
        await navigator.share({ title: p.name, text: `Mira este producto`, url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Enlace copiado')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo compartir')
    } finally {
      setIsSharingId(null)
    }
  }

  const canLoadMore = useMemo(() => products.length > 0 && products.length % pageSize === 0, [products.length])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900">Explorar Productos</h2>
          <p className="text-sm text-gray-500 font-medium">
            Encuentra productos existentes y compártelos con tu identificador de referido.
          </p>
        </div>
        <button
          onClick={() => loadProducts(true)}
          className="px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-sm"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-white rounded-2xl border border-rose-100 p-4 flex items-start gap-2 text-rose-700 font-bold">
          <AlertCircle size={18} className="mt-0.5" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-2">
        <Search size={18} className="text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
        />
        <button
          onClick={() => loadProducts(true)}
          className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-black text-xs uppercase tracking-wider"
        >
          Buscar
        </button>
      </div>

      {isLoading && products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center gap-2 text-gray-600 font-bold">
          <Loader2 className="spinning" size={18} /> Cargando productos...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const img = getMainImage(p.images)
            const finalPrice = p.discount_price || p.price
            const storeSlug = p.stores?.slug
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="relative h-40 bg-gray-100">
                  {img ? (
                    <img src={img} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-black">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="font-black text-gray-900 leading-tight">{p.name}</div>
                  <div className="text-xs text-gray-500 font-bold flex items-center gap-2">
                    <StoreIcon size={14} className="text-indigo-600" />
                    {p.stores?.name || 'Tienda'}
                  </div>
                  <div className="flex items-end justify-between gap-3 pt-1">
                    <div>
                      <div className="text-lg font-black text-gray-900">
                        ${Number(finalPrice || 0).toLocaleString('es-CO')}
                      </div>
                      {p.discount_price && p.discount_price < p.price && (
                        <div className="text-xs text-gray-400 font-black line-through">
                          ${Number(p.price || 0).toLocaleString('es-CO')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {storeSlug && (
                        <a
                          href={`/tienda/${storeSlug}?productId=${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                          title="Abrir producto"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      <button
                        onClick={() => shareProduct(p)}
                        disabled={isSharingId === p.id}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2"
                        title="Compartir con referido"
                      >
                        {isSharingId === p.id ? <Loader2 className="spinning" size={16} /> : <Share2 size={16} />}
                        Compartir
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                      ID: {p.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <LinkIcon size={12} /> ref
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          onClick={() => loadProducts(false)}
          disabled={isLoading || !canLoadMore}
          className="px-5 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-sm flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="spinning" size={16} /> : null}
          Cargar más
        </button>
      </div>
    </div>
  )
}

