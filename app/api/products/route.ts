/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    API: GESTIÓN DE PRODUCTOS                                 */
/*                                                                              */
/*   Propósito     : Crear productos con imágenes ya procesadas                */
/*   Ruta          : POST /api/products                                         */
/*   Archivo       : app/api/products/route.ts                                  */
/*                                                                              */
/*   FLUJO:                                                                     */
/*   1. Recibir datos del producto + URLs de imágenes procesadas               */
/*   2. Validar los datos con Zod                                              */
/*   3. Guardar en Supabase (tabla products + product_variants)                */
/*   4. Retornar el producto creado                                            */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              INTERFACES                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Variante de producto recibida del frontend                                  */
interface VariantInput {
    color: string
    colorHex: string
    size: string
    type: string
    images: { fullUrl: string; thumbnailUrl: string }[]
    stock: number
    priceModifier: number
}

/** Datos del producto recibidos del frontend                                    */
interface ProductInput {
    storeId: string
    name: string
    description: string
    price: number
    discountPrice?: number | null
    category: string
    mainImage: { fullUrl: string; thumbnailUrl: string }
    variants: VariantInput[]
}


/* ─────────────────────────────────────────────────────────────────────────── */
/*                     POST — Crear un producto nuevo                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
    try {

        /* ─── 1. Verificar autenticación ─── */
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado', code: 'UNAUTHORIZED' },
                { status: 401 }
            )
        }

        /* ─── 2. Parsear body ─── */
        const body: ProductInput = await request.json()

        /* ─── 3. Validaciones básicas ─── */
        if (!body.name || !body.name.trim()) {
            return NextResponse.json(
                { error: 'El nombre del producto es obligatorio', code: 'MISSING_NAME' },
                { status: 400 }
            )
        }

        if (!body.price || body.price <= 0) {
            return NextResponse.json(
                { error: 'El precio debe ser mayor a 0', code: 'INVALID_PRICE' },
                { status: 400 }
            )
        }

        if (!body.storeId) {
            return NextResponse.json(
                { error: 'Se requiere el ID de la tienda', code: 'MISSING_STORE' },
                { status: 400 }
            )
        }

        if (!body.mainImage?.fullUrl) {
            return NextResponse.json(
                { error: 'Se requiere al menos una imagen principal', code: 'MISSING_IMAGE' },
                { status: 400 }
            )
        }

        /* ─── 4. Verificar que la tienda pertenece al usuario ─── */
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('id, user_id')
            .eq('id', body.storeId)
            .single()

        if (storeError || !store) {
            return NextResponse.json(
                { error: 'Tienda no encontrada', code: 'STORE_NOT_FOUND' },
                { status: 404 }
            )
        }

        if (store.user_id !== user.id) {
            return NextResponse.json(
                { error: 'No tienes permiso para agregar productos a esta tienda', code: 'FORBIDDEN' },
                { status: 403 }
            )
        }

        /* ─── 5. Construir array de imágenes (formato para la columna jsonb) ─── */
        const images = [
            {
                full: body.mainImage.fullUrl,
                thumbnail: body.mainImage.thumbnailUrl,
                isMain: true,
            },
        ]

        /* Calcular stock total y agregar imágenes de variantes */
        let totalStock = 0
        if (body.variants && body.variants.length > 0) {
            for (const variant of body.variants) {
                totalStock += variant.stock || 0
                for (const img of variant.images) {
                    images.push({
                        full: img.fullUrl,
                        thumbnail: img.thumbnailUrl,
                        isMain: false,
                    })
                }
            }
        }

        /* ─── 6. Calcular porcentaje de descuento ─── */
        let discountPercent: number | null = null
        if (body.discountPrice && body.discountPrice > 0 && body.discountPrice < body.price) {
            discountPercent = Math.round(((body.price - body.discountPrice) / body.price) * 100)
        }

        /* ─── 7. Insertar producto en Supabase ─── */
        const { data: product, error: insertError } = await supabase
            .from('products')
            .insert({
                store_id: body.storeId,
                name: body.name.trim(),
                description: body.description?.trim() || null,
                price: body.price,                  /* Ya en centavos/unidades  */
                discount_price: body.discountPrice || null,
                discount_percent: discountPercent,
                stock: totalStock,
                category_id: body.category || null,
                images: images,
                is_active: true,
            })
            .select()
            .single()

        if (insertError) {
            console.error('[PRODUCTS] Error insertando producto:', insertError)
            return NextResponse.json(
                { error: 'Error al crear el producto', code: 'INSERT_ERROR', details: insertError.message },
                { status: 500 }
            )
        }

        /* ─── 8. Insertar variantes en tabla product_variants ─── */
        if (body.variants && body.variants.length > 0) {
            const variantsToInsert = body.variants.map((v) => ({
                product_id: product.id,
                color: v.color,
                color_hex: v.colorHex,
                size: v.size,
                type: v.type,
                images: v.images.map((img) => ({
                    full: img.fullUrl,
                    thumbnail: img.thumbnailUrl,
                })),
                stock: v.stock || 0,
                price_modifier: v.priceModifier || 0,
            }))

            const { error: variantError } = await supabase
                .from('product_variants')
                .insert(variantsToInsert)

            if (variantError) {
                console.error('[PRODUCTS] Error insertando variantes:', variantError)
                /* No fallar toda la operación, el producto ya se creó */
            }
        }

        /* ─── 9. Retornar producto creado ─── */
        return NextResponse.json({
            success: true,
            product: {
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images,
                variantsCount: body.variants?.length || 0,
                totalStock,
            },
        }, { status: 201 })

    } catch (error) {
        console.error('[PRODUCTS] Error:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json(
            { error: message, code: 'SERVER_ERROR' },
            { status: 500 }
        )
    }
}
