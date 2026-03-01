# Especificación de Red de Mercadeo (Dropshipping Local)

## Concepto Core

Transformar la sección "Comunidad" (actualmente tipo feed de red social) en una plataforma de afiliación/dropshipping para revendedores locales.

## Actores del Sistema

1. **Dueño de Tienda (Tendero):** Publica productos especiales en la "Red de Mercadeo" con un margen de comisión definido para revendedores.
2. **Revendedor (Afiliado):** Se registra y navega la red de mercadeo buscando productos atractivos. Genera enlaces únicos con su código de afiliado para compartir en plataformas externas (Facebook, Instagram, TikTok, WhatsApp, etc.).
3. **Comprador Final:** Da click en el enlace del revendedor, es llevado a la tienda directamente al producto. Añade al carrito y finaliza por WhatsApp.

## Flujo de Trabajo (Workflow)

### 1. Publicación y Generación de Enlace

- El tendero selecciona productos de su inventario para colocarlos en la "Red de Mercadeo" definiendo una comisión por venta o monto fijo.
- La UI de "Comunidad" se rediseña como un **Catálogo de Oportunidades** para revendedores.
- El revendedor elige un producto y hace click en "Copiar Enlace".
- El sistema genera un link tipo: `https://localecomer.app/tienda/slug?product=123&ref=REV_CODE`

### 2. Captura del Lead

- El comprador clickea el enlace en TikTok/Insta.
- Llega a la tienda. El frontend detecta el parámetro `ref=REV_CODE` y lo guarda en el carrito / sesión.
- El comprador añade uno o más productos al carrito y le da a "Comprar por WhatsApp".
- El sistema registra un evento de "Intento de Compra" (Pending Order) en base de datos _antes_ de saltar a la app de WhatsApp. Este registro incluye:
  - Cliente (requiere login Google para rastreo, o al menos captura datos básicos y guarda sesión).
  - Los productos en el carrito.
  - El código de referencia `REV_CODE` si aplica a algún producto.
  - Estado: Pendiente de Confirmación.

### 3. Validación y Confirmación de Venta

- El tendero atiende al cliente por WhatsApp y cierra la venta (o no).
- El tendero entra a su Panel de Administración de Tienda.
- Ve una lista de "Pedidos Recientes Iniciados en la App".
- Por cada pedido, el sistema le pregunta: "¿Se concretó esta venta?" -> [SÍ] / [NO].
  - Si **[NO]**: La orden se marca como "Cancelada". Queda en métricas de conversión (leads perdidos). No hay comisión.
  - Si **[SÍ]**:
    - La orden se marca como "Completada".
    - El sistema genera un recibo/factura en PDF para entregar al cliente.
    - El sistema revisa si la orden incluye el `ref=REV_CODE`.
    - Si existe, se liquida automáticamente el monto de la comisión a favor del revendedor.

### 4. Liquidación y Panel del Revendedor

- El revendedor tiene un nuevo **Panel de Afiliado** (Dashboard de Revendedor).
- Ve qué productos ha compartido.
- Ve métricas: Clicks recibidos (si podemos trazar la entrada a la PWA con su ref), Ventas Pendientes de Confirmación (alegría anticipada), Ventas Confirmadas, y Ganancias Generadas.
- La plataforma define que las comisiones se pagan **quincenalmente** directo entre el tendero y el revendedor (o un modelo análogo).
- Envío de notificaciones al tablero cuando una venta se cierra exitosamente.

## Requerimientos Técnicos e Implementación (Fase Inicial)

1. **Modificar Modelo de Datos (Supabase):**
   - Tabla `profiles`: Agregar rol `reseller`.
   - Tabla `products`: (Omitir si basta con `affiliate_links`, pero tal vez un check `is_affiliate_ready` y `commission_rate`).
   - Tabla `orders`: Asegurar que soporte estado `pending_confirmation`, `completed`, `cancelled`. Añadir campo `affiliate_id` (o relacionar nivel item).
   - Crear tabla `affiliate_links` (Opcional, si referimos por ID basico basta, pero mejor para tracking).
   - Crear tabla `commissions`: `id, amount, status (pending/paid), order_id, reseller_id, due_date`.

2. **Frontend - UI Cambios:**
   - Auth Modal: Incluir "Registrarse con Google" (OAuth de Supabase) de forma mas prominente.
   - `/community`: Rediseñar a "Hub de Afiliados" donde se listan productos `is_affiliate_ready = true`. Click en producto = Copiar Link con Ref.
   - PWA Cart Management: Modificar estado del carrito y proceso de checkout para incluir el tracking code y generar el "Pending Order" en DB antes de abrir WhatsApp.
   - `/dashboard/tienda`: Añadir pestaña "Confirmar Pedidos" (Inbox de leads de WhatsApp para marcar Sí/No).
   - `/dashboard/reseller`: Nuevo panel para el revendedor con métricas.

3. **Restricción de Alcance**
   - El pago de la comisión se asume "Off-platform" (el tendero le transfiere al revendedor quincenal) pero la plataforma _calcula y muestra la deuda_.
