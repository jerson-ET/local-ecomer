-- ───────────────────────────────────────────────────────────────────────────
--                       POLÍTICAS DE SEGURIDAD (RLS) PARA CHAT
-- ───────────────────────────────────────────────────────────────────────────

-- 1. Habilitar RLS
alter table public.chat_rooms enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;

-- 2. Políticas para CHAT_ROOMS
-- Usuarios pueden ver salas si son participantes o si son dueños de la tienda
create policy "Ver salas propias" on public.chat_rooms
  for select using (
    exists (
      select 1 from public.chat_participants 
      where room_id = id and user_id = auth.uid()
    ) or exists (
      select 1 from public.stores 
      where id = store_id and user_id = auth.uid()
    )
  );

-- Solo el sistema o participantes pueden crear salas (simplificado)
create policy "Crear salas" on public.chat_rooms
  for insert with check (true);

-- 3. Políticas para CHAT_PARTICIPANTS
create policy "Ver participantes de mis salas" on public.chat_participants
  for select using (
    exists (
      select 1 from public.chat_rooms 
      where id = room_id and (
        exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
        or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
      )
    )
  );

create policy "Unirse a salas" on public.chat_participants
  for insert with check (user_id = auth.uid());

-- 4. Políticas para MESSAGES
create policy "Ver mensajes de mis salas" on public.messages
  for select using (
    exists (
      select 1 from public.chat_rooms 
      where id = room_id and (
        exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
        or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
      )
    )
  );

create policy "Enviar mensajes" on public.messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from public.chat_rooms 
      where id = room_id and (
        exists (select 1 from public.chat_participants cp where cp.room_id = chat_rooms.id and cp.user_id = auth.uid())
        or exists (select 1 from public.stores s where s.id = chat_rooms.store_id and s.user_id = auth.uid())
      )
    )
  );
