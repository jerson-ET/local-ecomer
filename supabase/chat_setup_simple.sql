-- ═══════════════════════════════════════════════════════════════════════════
--               CONFIGURACIÓN SIMPLE DEL SISTEMA DE CHAT
-- ═══════════════════════════════════════════════════════════════════════════
-- Script simple para configurar el sistema de chat en Supabase
-- Ejecuta este script completo en la consola SQL de Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. CREAR TABLAS SI NO EXISTEN
-- ───────────────────────────────────────────────────────────────────────────

-- Tabla de salas de chat
create table if not exists public.chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  type text default 'direct' check (type in ('direct', 'group', 'channel')),
  store_id uuid references public.stores(id) on delete cascade,
  title text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_message_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de participantes
create table if not exists public.chat_participants (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('member', 'admin', 'owner')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_read_at timestamp with time zone,
  muted_until timestamp with time zone,
  is_active boolean default true,
  unique(room_id, user_id)
);

-- Tabla de mensajes
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  type text default 'text' check (type in ('text', 'image', 'file', 'product', 'system')),
  attachments text[],
  product_id uuid references public.products(id) on delete set null,
  reply_to uuid references public.messages(id) on delete set null,
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  edited_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- ───────────────────────────────────────────────────────────────────────────

-- Índices para chat_rooms
create index if not exists idx_chat_rooms_store_id on public.chat_rooms(store_id);
create index if not exists idx_chat_rooms_last_message_at on public.chat_rooms(last_message_at desc);
create index if not exists idx_chat_rooms_created_by on public.chat_rooms(created_by);

-- Índices para chat_participants
create index if not exists idx_chat_participants_room_id on public.chat_participants(room_id);
create index if not exists idx_chat_participants_user_id on public.chat_participants(user_id);
create index if not exists idx_chat_participants_room_user on public.chat_participants(room_id, user_id);

-- Índices para messages
create index if not exists idx_messages_room_id on public.messages(room_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_messages_reply_to on public.messages(reply_to);
create index if not exists idx_messages_product_id on public.messages(product_id);

-- 3. CREAR FUNCIÓN PARA ACTUALIZAR LAST_MESSAGE_AT
-- ───────────────────────────────────────────────────────────────────────────

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

-- 4. CREAR TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA
-- ───────────────────────────────────────────────────────────────────────────

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row
  execute function public.update_chat_room_last_message();

-- 5. HABILITAR SEGURIDAD DE NIVEL DE FILA (RLS)
-- ───────────────────────────────────────────────────────────────────────────

alter table public.chat_rooms enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;

-- 6. CREAR POLÍTICAS DE SEGURIDAD
-- ───────────────────────────────────────────────────────────────────────────

-- Políticas para chat_rooms
create policy if not exists "chat_rooms_select" on public.chat_rooms
  for select using (
    exists (
      select 1 from public.chat_participants 
      where room_id = id and user_id = auth.uid()
    ) or exists (
      select 1 from public.stores 
      where id = store_id and user_id = auth.uid()
    )
  );

create policy if not exists "chat_rooms_insert" on public.chat_rooms
  for insert with check (true);

-- Políticas para chat_participants
create policy if not exists "chat_participants_select" on public.chat_participants
  for select using (
    exists (
      select 1 from public.chat_rooms 
      where id = room_id and (
        exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
        or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
      )
    )
  );

create policy if not exists "chat_participants_insert" on public.chat_participants
  for insert with check (user_id = auth.uid());

-- Políticas para messages
create policy if not exists "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.chat_rooms 
      where id = room_id and (
        exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
        or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
      )
    )
  );

create policy if not exists "messages_insert" on public.messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from public.chat_rooms 
      where id = room_id and (
        exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
        or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
      )
    )
  );

-- 7. CREAR VISTAS ÚTILES
-- ───────────────────────────────────────────────────────────────────────────

-- Vista para salas con detalles de participantes
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

-- Vista para mensajes con perfil del remitente
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

-- 8. MENSAJE DE CONFIRMACIÓN
-- ───────────────────────────────────────────────────────────────────────────

select '✅ Sistema de chat configurado correctamente' as status;

-- ═══════════════════════════════════════════════════════════════════════════
--                             INSTRUCCIONES
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Copia TODO este script
-- 2. Ve a Supabase → Database → SQL Editor
-- 3. Pega el script
-- 4. Haz clic en "Run"
-- 5. Verifica que aparezca el mensaje de confirmación
-- ═══════════════════════════════════════════════════════════════════════════