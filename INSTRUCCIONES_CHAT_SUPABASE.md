# Instrucciones para Configurar el Sistema de Chat en Supabase

## 📋 Pasos a Seguir

### 1. Acceder a la Consola de Supabase
1. Ve a tu proyecto Supabase (https://app.supabase.com/)
2. Selecciona tu proyecto de Local Ecomer
3. Ve a la sección **Database** → **SQL Editor**

### 2. Ejecutar el Script de Migración
**OPCIÓN A (Recomendada si ya tienes las tablas básicas):**
1. Copia TODO el contenido del archivo:
   ```
   /supabase/chat_migration_final.sql
   ```
2. Pega en el editor SQL de Supabase
3. Haz clic en **Run** o presiona **Ctrl+Enter** (Cmd+Enter en Mac)

**OPCIÓN B (Si necesitas crear las tablas desde cero):**
1. Copia TODO el contenido del archivo:
   ```
   /supabase/chat_system_complete.sql
   ```
2. Pega en el editor SQL de Supabase
3. Haz clic en **Run**

### 3. Verificar la Creación de Tablas
Después de ejecutar el script, verifica que las tablas se hayan creado correctamente:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'chat_%';

-- Verificar estructura de las tablas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_rooms' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_participants' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;
```

### 4. Probar el Sistema de Chat
1. **Abre la aplicación** en tu navegador
2. **Ve a la sección de Chat** (Messenger)
3. **Verifica que:**
   - El buscador de conversación funcione
   - La sección "Contactos" aparezca debajo del buscador
   - Puedas hacer clic en contactos para iniciar chats
   - Los mensajes se envíen y reciban correctamente

## 🗂️ Tablas Creadas

### 1. `chat_rooms` - Salas de Chat
- **id**: UUID único
- **type**: Tipo de sala ('direct', 'group', 'channel')
- **store_id**: Referencia a la tienda (opcional)
- **title**: Título de la sala
- **description**: Descripción
- **created_by**: Quién creó la sala
- **created_at**: Fecha de creación
- **last_message_at**: Último mensaje
- **updated_at**: Última actualización

### 2. `chat_participants` - Participantes
- **id**: UUID único
- **room_id**: Referencia a la sala
- **user_id**: Referencia al usuario
- **role**: Rol ('member', 'admin', 'owner')
- **joined_at**: Fecha de unión
- **last_read_at**: Último mensaje leído
- **muted_until**: Silenciado hasta
- **is_active**: Activo/inactivo

### 3. `messages` - Mensajes
- **id**: UUID único
- **room_id**: Referencia a la sala
- **sender_id**: Remitente (null para sistema)
- **content**: Contenido del mensaje
- **type**: Tipo ('text', 'image', 'file', 'product', 'system')
- **attachments**: Array de URLs
- **product_id**: Referencia a producto
- **reply_to**: Respuesta a mensaje
- **is_deleted**: Eliminado
- **deleted_at**: Fecha eliminación
- **edited_at**: Fecha edición
- **created_at**: Fecha creación

## 🔧 Características Implementadas

### ✅ Índices de Rendimiento
- Índices en campos frecuentemente consultados
- Optimización para búsquedas rápidas

### ✅ Triggers Automáticos
- Actualización automática de `last_message_at`
- Mantenimiento de timestamps actualizados

### ✅ Funciones de Utilidad
- `get_unread_count()`: Contar mensajes no leídos
- `mark_as_read()`: Marcar mensajes como leídos

### ✅ Políticas de Seguridad (RLS)
- Acceso restringido a participantes
- Dueños de tienda pueden ver chats relacionados
- Usuarios solo pueden editar sus propios mensajes

### ✅ Vistas Útiles
- `chat_rooms_with_details`: Información completa de salas
- `messages_with_sender`: Mensajes con perfil del remitente

## 🚨 Solución de Problemas

### Si hay errores al ejecutar el script:
1. **Verifica permisos**: Asegúrate de tener permisos de administrador
2. **Ejecuta por partes**: Divide el script en secciones más pequeñas
3. **Revisa logs**: Consulta los logs de error en Supabase

### Si el chat no funciona correctamente:
1. **Verifica conexión**: Asegúrate de que la aplicación se conecte a Supabase
2. **Revisa políticas RLS**: Verifica que las políticas estén aplicadas
3. **Prueba con datos de ejemplo**: Crea usuarios y salas de prueba

### Si faltan columnas:
1. **Ejecuta el script de migración** nuevamente
2. **Verifica nombres de columnas**: Asegúrate de que coincidan con el código

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de error en la consola del navegador
2. Verifica la conexión a Supabase en la aplicación
3. Ejecuta las consultas de verificación SQL

## ✅ Verificación Final

Después de configurar todo, verifica que:

1. [ ] Las tablas `chat_rooms`, `chat_participants`, `messages` existen
2. [ ] Las políticas RLS están habilitadas
3. [ ] Los índices se crearon correctamente
4. [ ] Las funciones `get_unread_count` y `mark_as_read` funcionan
5. [ ] Las vistas `chat_rooms_with_details` y `messages_with_sender` están disponibles
6. [ ] La aplicación puede enviar y recibir mensajes
7. [ ] La sección "Contactos" aparece en el chat

¡Listo! Tu sistema de chat está configurado y listo para usar. 🎉