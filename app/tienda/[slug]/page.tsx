import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MinimalTemplate, { RealStore, RealProduct } from '@/components/store-templates/MinimalTemplate'
// MÁS ADELANTE: ir agregando más plantillas dinámicas
// import ModaTemplate from '@/components/store-templates/ModaTemplate' 
// import GamingTemplate from '@/components/store-templates/GamingTemplate'

interface Props {
    params: Promise<{ slug: string }>
}

export default async function TiendaDinamicaPage({ params }: Props) {
    const { slug } = await params
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
    } catch (e) { /* ignore */ }

    const typedStore: RealStore = {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        theme_color: store.theme_color,
        banner_url: store.banner_url,
        whatsapp_number: store.whatsapp_number
    }

    // 4. Renderizar la plantilla correcta
    // En este MVP mapearemos todo temporalmente a la primera plantilla completada (Minimal),
    // a menos que podamos importar todas dinámicamente. 
    // TODO: Agregar Switch renderizando otros componentes cuando existan las plantillas dinámicas
    switch (templateId) {
        case 'minimal':
        case 'moda':     // Fallback temporal si la plantilla Moda aún no es dinámica
        case 'gaming':   // etc
        default:
            // Reutilizamos el CSS del layout de cada store (para que minimal cargue minimal.css)
            // Para eso en lugar de usar un CSS module, MinimalTemplate asume que 
            // minimal.css está cargado globalmente o lo inserta:
            return (
                <>
                    {/* Workaround para cargar el CSS del template Minimal sin romper layout base */}
                    {/* En un refactor futuro, usar CSS Modules (.module.css) es más óptimo */}
                    {/* Por suerte importaste minimal.css en su propio archivo, pero al ser dinámico requiere */}
                    {/* o bien agregarlo a globals.css, o importarlo dinámicamente: */}
                    <MinimalCSSLoader />
                    <MinimalTemplate store={typedStore} products={products} />
                </>
            )
    }
}

// Pequeño componente para cargar CSS de forma dinámica en Server/Client Components
import '@/app/store/minimal/minimal.css'

function MinimalCSSLoader() {
    return null
}
