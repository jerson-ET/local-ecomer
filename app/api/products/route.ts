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
  additionalImages?: { fullUrl: string; thumbnailUrl: string }[]
  productTags?: string[]
  variants: VariantInput[]
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                     POST — Crear un producto nuevo                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    /* ─── 1. Verificar autenticación ─── */
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })
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

    /* ─── 4.1 Validar que las imágenes sean de R2 ─── */
    const r2PublicUrl = process.env.R2_PUBLIC_URL || ''
    const isR2Url = (url: string) => url.startsWith(r2PublicUrl)

    if (!isR2Url(body.mainImage.fullUrl)) {
      console.warn('[PRODUCTS] Intento de usar imagen no R2:', body.mainImage.fullUrl)
      // Opcional: Podrías bloquear esto, pero por ahora solo lo registramos
    }

    /* ─── 5. Construir array de imágenes (formato para la columna jsonb) ─── */
    const images = [
      {
        full: body.mainImage.fullUrl,
        thumbnail: body.mainImage.thumbnailUrl,
        isMain: true,
      },
      ...(body.additionalImages || []).map((img) => ({
        full: img.fullUrl,
        thumbnail: img.thumbnailUrl,
        isMain: false,
      })),
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
        price: body.price /* Ya en centavos/unidades  */,
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
    return NextResponse.json(
      {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          variantsCount: body.variants?.length || 0,
          totalStock,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[PRODUCTS] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message, code: 'SERVER_ERROR' }, { status: 500 })
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                     GET — Obtener productos                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 })
    }

    const supabase = await createClient()

    // 2. Obtener productos y variantes manualmente para evitar fallos de cache de FK en Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[PRODUCTS GET] Error:', error)
      return NextResponse.json({ error: 'Error obteniendo productos' }, { status: 500 })
    }

    let finalProducts = products || []

    // 3. Obtener variantes si hay productos
    if (finalProducts.length > 0) {
      const productIds = finalProducts.map((p) => p.id)
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds)

      if (!variantsError && variants) {
        finalProducts = finalProducts.map((p) => ({
          ...p,
          product_variants: variants.filter((v) => v.product_id === p.id),
        }))
      } else {
        finalProducts = finalProducts.map((p) => ({ ...p, product_variants: [] }))
      }
    }

    return NextResponse.json({ success: true, products: finalProducts })
  } catch (error) {
    console.error('[PRODUCTS GET] Error fatal:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                     PUT — Actualizar un producto existente                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, name, description, price, discountPrice, category, stock, images, variants } = body

    if (!productId) {
      return NextResponse.json({ error: 'productId es requerido' }, { status: 400 })
    }

    /* Verificar que el producto pertenece al usuario */
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, store_id')
      .eq('id', productId)
      .single()

    if (prodErr || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('user_id')
      .eq('id', product.store_id)
      .single()

    if (!store || store.user_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
    }

    /* Construir objeto de actualización */
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (price !== undefined) updateData.price = price
    if (discountPrice !== undefined) updateData.discount_price = discountPrice || null
    if (category !== undefined) updateData.category_id = category || null
    if (stock !== undefined) updateData.stock = stock
    if (images !== undefined) updateData.images = images

    /* Calcular descuento */
    if (price && discountPrice && discountPrice > 0 && discountPrice < price) {
      updateData.discount_percent = Math.round(((price - discountPrice) / price) * 100)
    } else if (discountPrice === null || discountPrice === 0) {
      updateData.discount_percent = null
    }

    const { error: updateErr } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)

    if (updateErr) {
      console.error('[PRODUCTS PUT] Error:', updateErr)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    /* Actualizar variantes si se proporcionan */
    if (variants !== undefined) {
      /* Eliminar variantes existentes y reinsertar */
      await supabase.from('product_variants').delete().eq('product_id', productId)

      if (variants.length > 0) {
        const variantsToInsert = variants.map((v: VariantInput) => ({
          product_id: productId,
          color: v.color,
          color_hex: v.colorHex,
          size: v.size,
          type: v.type || 'unisex',
          images: v.images.map((img) => ({ full: img.fullUrl, thumbnail: img.thumbnailUrl })),
          stock: v.stock || 0,
          price_modifier: v.priceModifier || 0,
        }))
        await supabase.from('product_variants').insert(variantsToInsert)
      }
    }

    return NextResponse.json({ success: true, message: 'Producto actualizado' })
  } catch (error) {
    console.error('[PRODUCTS PUT] Error fatal:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                     DELETE — Eliminar un producto                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId es requerido' }, { status: 400 })
    }

    /* Verificar permisos */
    const { data: product } = await supabase
      .from('products')
      .select('id, store_id')
      .eq('id', productId)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('user_id')
      .eq('id', product.store_id)
      .single()

    if (!store || store.user_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
    }

    /* Eliminar variantes primero, luego producto */
    await supabase.from('product_variants').delete().eq('product_id', productId)
    const { error: delErr } = await supabase.from('products').delete().eq('id', productId)

    if (delErr) {
      console.error('[PRODUCTS DELETE] Error:', delErr)
      return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Producto eliminado' })
  } catch (error) {
    console.error('[PRODUCTS DELETE] Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
