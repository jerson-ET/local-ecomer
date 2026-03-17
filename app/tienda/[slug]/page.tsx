import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MinimalTemplate, {
  RealStore,
  RealProduct,
} from '@/components/store-templates/MinimalTemplate'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ productId?: string }>
}

export default async function TiendaDinamicaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { productId } = await searchParams
  const supabase = await createClient()

  // 1. Buscar la tienda por slug
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .single()

  if (storeError || !store) {
    console.error('Tienda no encontrada:', slug, storeError)
    notFound()
  }

  // 2. Obtener los productos reales de esta tienda
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true)
  // .order('created_at', { ascending: false })

  if (productsError) {
    console.error('Error cargando productos:', productsError)
  }

  const products: RealProduct[] = productsData || []

  const typedStore: RealStore = {
    id: store.id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    theme_color: store.theme_color,
    banner_url: store.banner_url,
    whatsapp_number: store.whatsapp_number,
  }

  return <MinimalTemplate store={typedStore} products={products} initialProductId={productId} />
}

// CSS importado directamente
import '@/app/store/minimal/minimal.css'
