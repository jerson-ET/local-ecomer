# Tareas de Dropshipping Local

1.  **Migración de Base de Datos:**
    - Correr `sql/dropshipping_migration.sql` en Supabase.
    - Actualizar la interfaz de validación de orden en base de datos.
2.  **Auth Modal:**
    - Modificar `AuthModal.tsx` para permitir registrar con Google usando `@supabase/ssr` o `supabase-js`.
    - Tener cuidado con la lógica de confirmación en la misma.
3.  **Comunidad / Hub de Afiliados:**
    - Modificar `/app/community/page.tsx` para mostrar productos.
    - Botón `Copiar Enlace` para referidos de la URL actual.
4.  **Confirmación Pedidos Tienda:**
    - Añadir sección a la lista de tareas en `AdminPanel`.
5.  **Recepción de Pedidos y Webhook (Opcional):**
    - Si un usuario interactúa a través del carrito (con link con 'ref=' parámetro), guardarlo en el contexto.

_(Esto sirve como recordatorio local)_
