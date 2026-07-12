-- ═══════════════════════════════════════════════════════════════════════════
--                 MIGRACIÓN DEL SISTEMA DE CHAT - LOCAL ECOMER
-- ═══════════════════════════════════════════════════════════════════════════
-- Este script asegura que las tablas de chat estén correctamente configuradas
-- y agrega mejoras necesarias para el funcionamiento del chat con tiendas
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. VERIFICAR Y MEJORAR TABLA CHAT_ROOMS
-- ───────────────────────────────────────────────────────────────────────────

-- Agregar columnas faltantes si no existen
do $$ 
begin
  -- Agregar columna title si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'chat_rooms' and column_name = 'title') then
    alter table public.chat_rooms add column title text;
  end if;
  
  -- Agregar columna description si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'chat_rooms' and column_name = 'description') then
    alter table public.chat_rooms add column description text;
  end if;
  
  -- Agregar columna created_by si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'chat_rooms' and column_name = 'created_by') then
    alter table public.chat_rooms add column created_by uuid references public.profiles(id);
  end if;
  
  -- Agregar columna updated_at si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'chat_rooms' and column_name = 'updated_at') then
    alter table public.chat_rooms add column updated_at timestamp with time zone default timezone('utc'::text, now()) not null;
  end if;
  
  -- Mejorar la restricción de clave foránea para store_id
  alter table public.chat_rooms drop constraint if exists chat_rooms_store_id_fkey;
  alter table public.chat_rooms add constraint chat_rooms_store_id_fkey 
    foreign key (store_id) references public.stores(id) on delete cascade;
end $$;

-- Crear índices para mejor rendimiento
create index if not exists idx_chat_rooms_store_id on public.chat_rooms(store_id);
create index if not exists idx_chat_rooms_last_message_at on public.chat_rooms(last_message_at desc);
create index if not exists idx_chat_rooms_created_by on public.chat_rooms(created_by);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. VERIFICAR Y MEJORAR TABLA CHAT_PARTICIPANTS
-- ───────────────────────────────────────────────────────────────────────────

-- Agregar columnas faltantes si no existen
do $$ 
begin
  -- Agregar columna role si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'chat_participants' and column_name = 'role') then
    alter table public.chat_participants add column role text default 'member' check (role in ('member', 'admin', 'owner'));
  end if;
  
  -- Agregar columna muted_until si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'chat_participants' and column_name = 'muted_until') then
    alter table public.chat_participants add column muted_until timestamp with time zone;
  end if;
  
  -- Agregar columna is_active si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'chat_participants' and column_name = 'is_active') then
    alter table public.chat_participants add column is_active boolean default true;
  end if;
  
  -- Mejorar restricciones de clave foránea
  alter table public.chat_participants drop constraint if exists chat_participants_room_id_fkey;
  alter table public.chat_participants add constraint chat_participants_room_id_fkey 
    foreign key (room_id) references public.chat_rooms(id) on delete cascade;
    
  alter table public.chat_participants drop constraint if exists chat_participants_user_id_fkey;
  alter table public.chat_participants add constraint chat_participants_user_id_fkey 
    foreign key (user_id) references public.profiles(id) on delete cascade;
    
  -- Agregar restricción única si no existe
  if not exists (select 1 from information_schema.table_constraints 
                where table_name = 'chat_participants' and constraint_name = 'chat_participants_room_id_user_id_key') then
    alter table public.chat_participants add constraint chat_participants_room_id_user_id_key unique(room_id, user_id);
  end if;
end $$;

-- Crear índices para mejor rendimiento
create index if not exists idx_chat_participants_room_id on public.chat_participants(room_id);
create index if not exists idx_chat_participants_user_id on public.chat_participants(user_id);
create index if not exists idx_chat_participants_room_user on public.chat_participants(room_id, user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. VERIFICAR Y MEJORAR TABLA MESSAGES
-- ───────────────────────────────────────────────────────────────────────────

-- Agregar columnas faltantes si no existen
do $$ 
begin
  -- Agregar columna product_id si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'messages' and column_name = 'product_id') then
    alter table public.messages add column product_id uuid references public.products(id) on delete set null;
  end if;
  
  -- Agregar columna deleted_at si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'messages' and column_name = 'deleted_at') then
    alter table public.messages add column deleted_at timestamp with time zone;
  end if;
  
  -- Agregar columna edited_at si no existe
  if not exists (select 1 from information_schema.columns 
                where table_name = 'messages' and column_name = 'edited_at') then
    alter table public.messages add column edited_at timestamp with time zone;
  end if;
  
  -- Mejorar restricciones de clave foránea
  alter table public.messages drop constraint if exists messages_room_id_fkey;
  alter table public.messages add constraint messages_room_id_fkey 
    foreign key (room_id) references public.chat_rooms(id) on delete cascade;
    
  alter table public.messages drop constraint if exists messages_sender_id_fkey;
  alter table public.messages add constraint messages_sender_id_fkey 
    foreign key (sender_id) references public.profiles(id) on delete set null;
    
  -- Agregar tipo 'system' a las opciones si no existe
  if exists (select 1 from information_schema.columns 
            where table_name = 'messages' and column_name = 'type') then
    -- Primero eliminamos la restricción check existente
    alter table public.messages drop constraint if exists messages_type_check;
    -- Luego creamos una nueva con 'system' incluido
    alter table public.messages add constraint messages_type_check 
      check (type in ('text', 'image', 'file', 'product', 'system'));
  end if;
end $$;

-- Crear índices para mejor rendimiento
create index if not exists idx_messages_room_id on public.messages(room_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_messages_reply_to on public.messages(reply_to);
create index if not exists idx_messages_product_id on public.messages(product_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. CREAR FUNCIONES Y TRIGGERS
-- ───────────────────────────────────────────────────────────────────────────

-- Función para actualizar last_message_at cuando se inserta un mensaje
create or replace function public.update_chat_room_last_message()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.chat_rooms
  set 
    last_message_at = new.created_at,
    updated_at = now()
  where id = new.room_id;
  return new;
end;
$$;

-- Crear trigger si no existe
drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row
  execute function public.update_chat_room_last_message();

-- Función para obtener el número de mensajes no leídos por sala para un usuario
create or replace function public.get_unread_count(room_id uuid, user_id uuid)
returns integer
language plpgsql
stable
as $$
declare
  unread_count integer;
begin
  select count(*) into unread_count
  from public.messages m
  where m.room_id = $1
    and m.created_at > coalesce(
      (select last_read_at 
       from public.chat_participants 
       where room_id = $1 and user_id = $2),
      '1970-01-01'::timestamp
    )
    and m.sender_id != $2
    and m.is_deleted = false;
    
  return coalesce(unread_count, 0);
end;
$$;

-- Función para marcar mensajes como leídos
create or replace function public.mark_as_read(room_id uuid, user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.chat_participants
  set last_read_at = now()
  where room_id = $1 and user_id = $2;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. APLICAR POLÍTICAS RLS (SI NO EXISTEN)
-- ───────────────────────────────────────────────────────────────────────────

-- Habilitar RLS si no está habilitado
do $$ 
begin
  if not exists (select 1 from pg_tables where tablename = 'chat_rooms' and rowsecurity = true) then
    alter table public.chat_rooms enable row level security;
  end if;
  
  if not exists (select 1 from pg_tables where tablename = 'chat_participants' and rowsecurity = true) then
    alter table public.chat_participants enable row level security;
  end if;
  
  if not exists (select 1 from pg_tables where tablename = 'messages' and rowsecurity = true) then
    alter table public.messages enable row level security;
  end if;
end $$;

-- Crear políticas si no existen (usando nombres únicos)
do $$ 
begin
  -- Políticas para chat_rooms
  if not exists (select 1 from pg_policies where tablename = 'chat_rooms' and policyname = 'chat_rooms_select') then
    execute $$
      create policy "chat_rooms_select" on public.chat_rooms
        for select using (
          exists (
            select 1 from public.chat_participants 
            where room_id = id and user_id = auth.uid()
          ) or exists (
            select 1 from public.stores 
            where id = store_id and user_id = auth.uid()
          )
        )
    $$;
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'chat_rooms' and policyname = 'chat_rooms_insert') then
    execute $$
      create policy "chat_rooms_insert" on public.chat_rooms
        for insert with check (true)
    $$;
  end if;
  
  -- Políticas para chat_participants
  if not exists (select 1 from pg_policies where tablename = 'chat_participants' and policyname = 'chat_participants_select') then
    execute $$
      create policy "chat_participants_select" on public.chat_participants
        for select using (
          exists (
            select 1 from public.chat_rooms 
            where id = room_id and (
              exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
              or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
            )
          )
        )
    $$;
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'chat_participants' and policyname = 'chat_participants_insert') then
    execute $$
      create policy "chat_participants_insert" on public.chat_participants
        for insert with check (user_id = auth.uid())
    $$;
  end if;
  
  -- Políticas para messages
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'messages_select') then
    execute $$
      create policy "messages_select" on public.messages
        for select using (
          exists (
            select 1 from public.chat_rooms 
            where id = room_id and (
              exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
              or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
            )
          )
        )
    $$;
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'messages_insert') then
    execute $$
      create policy "messages_insert" on public.messages
        for insert with check (
          sender_id = auth.uid() and exists (
            select 1 from public.chat_rooms 
            where id = room_id and (
              exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
              or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
            )
          )
        )
    $$;
  end if;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. CREAR VISTAS ÚTILES
-- ───────────────────────────────────────────────────────────────────────────

-- Vista para obtener información completa de salas con detalles de participantes
create or replace view public.chat_rooms_with_details as
select 
  cr.id,
  cr.type,
  cr.store_id,
  cr.title,
  cr.description,
  cr.created_by,
  cr.created_at,
  cr.last_message_at,
  cr.updated_at,
  json_agg(
    json_build_object(
      'user_id', cp.user_id,
      'role', cp.role,
      'joined_at', cp.joined_at,
      'last_read_at', cp.last_read_at,
      'profile', json_build_object(
        'id', p.id,
        'name', p.name,
        'email', p.email,
        'avatar_url', p.avatar_url,
        'role', p.role
      )
    )
  ) as participants,
  (
    select json_build_object(
      'id', m.id,
      'content', m.content,
      'sender_id', m.sender_id,
      'created_at', m.created_at
    )
    from public.messages m
    where m.room_id = cr.id
    order by m.created_at desc
    limit 1
  ) as last_message
from public.chat_rooms cr
left join public.chat_participants cp on cp.room_id = cr.id
left join public.profiles p on p.id = cp.user_id
group by cr.id;

-- Vista para obtener mensajes con información del remitente
create or replace view public.messages_with_sender as
select 
  m.*,
  json_build_object(
    'id', p.id,
    'name', p.name,
    'email', p.email,
    'avatar_url', p.avatar_url,
    'role', p.role
  ) as sender_profile
from public.messages m
left join public.profiles p on p.id = m.sender_id
where m.is_deleted = false;

-- ───────────────────────────────────────────────────────────────────────────
-- 7. INSTRUCCIONES FINALES
-- ───────────────────────────────────────────────────────────────────────────

-- Para ejecutar este script en Supabase:
-- 1. Ve a la consola de SQL de tu proyecto Supabase (Database → SQL Editor)
-- 2. Copia y pega TODO este script
-- 3. Haz clic en "Run" o presiona Ctrl+Enter (Cmd+Enter en Mac)
-- 4. Verifica que no haya errores en la ejecución

-- Este script hará lo siguiente:
-- • Agregará columnas faltantes a las tablas existentes
-- • Creará índices para optimizar el rendimiento
-- • Creará funciones y triggers para funcionalidades automáticas
-- • Aplicará políticas de seguridad RLS
-- • Creará vistas útiles para consultas comunes

-- NOTA: Si las tablas no existen, primero ejecuta el script completo:
-- /supabase/chat_system_complete.sql

-- ═══════════════════════════════════════════════════════════════════════════
--                             MIGRACIÓN COMPLETADA
-- ═══════════════════════════════════════════════════════════════════════════