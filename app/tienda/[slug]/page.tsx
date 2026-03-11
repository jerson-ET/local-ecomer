import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MinimalTemplate, {
  RealStore,
  RealProduct,
} from '@/components/store-templates/MinimalTemplate'
import ModaTemplate from '@/app/store/moda/page'
import GamingTemplate from '@/app/store/gaming/page'
import MotosTemplate from '@/app/store/motos/page'
import BellezaTemplate from '@/app/store/belleza/page'
import MascotasTemplate from '@/app/store/mascotas/page'
import CalzadoTemplate from '@/app/store/calzado/page'
import GorrasTemplate from '@/app/store/gorras/page'

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

  // 3. Obtener qué template usar desde el banner_url simulado como json, o fallback a minimal
  let templateId = 'minimal'
  try {
    if (store.banner_url) {
      const parsed = JSON.parse(store.banner_url)
      if (parsed.templateId) templateId = parsed.templateId
    }
  } catch {
    /* ignore */
  }

  const typedStore: RealStore = {
    id: store.id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    theme_color: store.theme_color,
    banner_url: store.banner_url,
    whatsapp_number: store.whatsapp_number,
  }

  // 4. Renderizar la plantilla correcta
  // En este MVP mapearemos todo temporalmente a la primera plantilla completada (Minimal),
  // a menos que podamos importar todas dinámicamente.
  // TODO: Agregar Switch renderizando otros componentes cuando existan las plantillas dinámicas
  switch (templateId) {
    case 'minimal':
      return (
        <>
          <MinimalCSSLoader />
          <MinimalTemplate store={typedStore} products={products} initialProductId={productId} />
        </>
      )
    case 'moda':
    case 'vibrant-market' /* alias por si acaso */:
      return (
        <>
          <ModaCSSLoader />
          <ModaTemplate />
        </>
      )
    case 'gaming':
    case 'gaming-zone':
      return (
        <>
          <GamingCSSLoader />
          <GamingTemplate />
        </>
      )
    case 'moto-racer':
    case 'motos':
      return (
        <>
          <MotosCSSLoader />
          <MotosTemplate store={typedStore} products={products} />
        </>
      )
    case 'mascotas':
    case 'pet-paradise':
      return (
        <>
          <MascotasCSSLoader />
          <MascotasTemplate />
        </>
      )
    case 'sneaker-vault':
    case 'calzado':
      return (
        <>
          <CalzadoCSSLoader />
          <CalzadoTemplate />
        </>
      )
    case 'cap-kings':
    case 'gorras':
      return (
        <>
          <GorrasCSSLoader />
          <GorrasTemplate />
        </>
      )
    case 'beauty-glow':
    case 'belleza':
      return (
        <>
          <BellezaCSSLoader />
          <BellezaTemplate />
        </>
      )
    default:
      return (
        <>
          <MinimalCSSLoader />
          <MinimalTemplate store={typedStore} products={products} initialProductId={productId} />
        </>
      )
  }
}

// Pequeño componente para cargar CSS de forma dinámica en Server/Client Components
// Pequeño componente para cargar CSS de forma dinámica en Server/Client Components
import '@/app/store/minimal/minimal.css'
import '@/app/store/moda/moda.css'
import '@/app/store/gaming/gaming.css'
import '@/app/store/motos/motos.css'
import '@/app/store/belleza/belleza.css'
import '@/app/store/mascotas/mascotas.css'
import '@/app/store/calzado/calzado.css'
import '@/app/store/gorras/gorras.css'

function MinimalCSSLoader() {
  return null
}
function ModaCSSLoader() {
  return null
}
function GamingCSSLoader() {
  return null
}
function MotosCSSLoader() {
  return null
}
function BellezaCSSLoader() {
  return null
}
function MascotasCSSLoader() {
  return null
}
function CalzadoCSSLoader() {
  return null
}
function GorrasCSSLoader() {
  return null
}
