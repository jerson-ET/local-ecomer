# Plan de Implementación: Marketplace

## Concepto
La página principal (`app/page.tsx`) se convierte en el **Marketplace**.
- Muestra automáticamente productos con descuento de TODAS las tiendas
- Al hacer clic en un producto → redirige a la tienda original (no agrega al carrito)
- Cada card muestra el nombre de la tienda de origen + badge de descuento

## Cambios Necesarios

### 1. Crear sistema centralizado de productos (`lib/store/marketplace.ts`)
- Interface `MarketplaceProduct` con: storeName, storeUrl, storeTemplate, etc.
- Función que recoge productos con descuento de todas las tiendas
- Datos simulados de productos con descuento de varias tiendas

### 2. Transformar `app/page.tsx` → Marketplace real
- Reemplazar productos estáticos por productos del marketplace
- Las cards ahora muestran tienda de origen
- Click → Link a la tienda (`/store/{template}`)
- Sección "Ofertas Flash" con productos con mayor descuento
- Banner más orientado al marketplace
- Búsqueda funcional por nombre/tienda
- Categorías funcionales que filtran

### 3. Nuevo layout del Marketplace
- Header con logo + búsqueda
- Banner "Las mejores ofertas de tiendas locales"
- Categorías con iconos
- Grid de productos con descuento (badge tienda + % descuento)
- Bottom nav actualizado
