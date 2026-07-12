create extension if not exists "uuid-ossp";

create table if not exists public.chat_rooms (
  id uuid primary key default uuid_generate_v4(),
  type text not null default 'direct' check (type in ('direct', 'group', 'channel')),
  store_id uuid references public.stores(id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_message_at timestamp with time zone
);

create table if not exists public.chat_participants (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_read_at timestamp with time zone,
  unique (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  type text not null default 'text' check (type in ('text', 'image', 'file', 'product')),
  attachments text[],
  reply_to uuid references public.messages(id) on delete set null,
  is_deleted boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  edited_at timestamp with time zone
);

create index if not exists idx_chat_rooms_store_id on public.chat_rooms(store_id);
create index if not exists idx_chat_rooms_last_message_at on public.chat_rooms(last_message_at desc);
create index if not exists idx_chat_participants_room_id on public.chat_participants(room_id);
create index if not exists idx_chat_participants_user_id on public.chat_participants(user_id);
create index if not exists idx_messages_room_id on public.messages(room_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_messages_sender_id on public.messages(sender_id);

create or replace function public.update_chat_room_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.chat_rooms
  set last_message_at = new.created_at
  where id = new.room_id;

  return new;
end;
$$;

drop trigger if exists trg_update_chat_room_last_message on public.messages;

create trigger trg_update_chat_room_last_message
after insert on public.messages
for each row
execute function public.update_chat_room_last_message();

create or replace function public.get_unread_count(p_room_id uuid, p_user_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::int
  from public.messages m
  join public.chat_participants cp
    on cp.room_id = m.room_id
   and cp.user_id = p_user_id
  where m.room_id = p_room_id
    and m.is_deleted = false
    and m.sender_id is distinct from p_user_id
    and m.created_at > coalesce(cp.last_read_at, '1970-01-01'::timestamp with time zone);
$$;

create or replace function public.mark_chat_room_as_read(p_room_id uuid, p_user_id uuid)
returns void
language sql
as $$
  update public.chat_participants
  set last_read_at = timezone('utc'::text, now())
  where room_id = p_room_id
    and user_id = p_user_id;
$$;

alter table public.chat_rooms enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Ver salas propias" on public.chat_rooms;
create policy "Ver salas propias"
on public.chat_rooms
for select
using (
  exists (
    select 1
    from public.chat_participants cp
    where cp.room_id = chat_rooms.id
      and cp.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.stores s
    where s.id = chat_rooms.store_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "Crear salas" on public.chat_rooms;
create policy "Crear salas"
on public.chat_rooms
for insert
with check (true);

drop policy if exists "Actualizar salas propias" on public.chat_rooms;
create policy "Actualizar salas propias"
on public.chat_rooms
for update
using (
  exists (
    select 1
    from public.chat_participants cp
    where cp.room_id = chat_rooms.id
      and cp.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.stores s
    where s.id = chat_rooms.store_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "Ver participantes de mis salas" on public.chat_participants;
create policy "Ver participantes de mis salas"
on public.chat_participants
for select
using (
  exists (
    select 1
    from public.chat_participants cp
    where cp.room_id = chat_participants.room_id
      and cp.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.chat_rooms cr
    join public.stores s on s.id = cr.store_id
    where cr.id = chat_participants.room_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "Unirse a salas" on public.chat_participants;
create policy "Unirse a salas"
on public.chat_participants
for insert
with check (user_id = auth.uid());

drop policy if exists "Actualizar mi lectura" on public.chat_participants;
create policy "Actualizar mi lectura"
on public.chat_participants
for update
using (user_id = auth.uid());

drop policy if exists "Ver mensajes de mis salas" on public.messages;
create policy "Ver mensajes de mis salas"
on public.messages
for select
using (
  exists (
    select 1
    from public.chat_participants cp
    where cp.room_id = messages.room_id
      and cp.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.chat_rooms cr
    join public.stores s on s.id = cr.store_id
    where cr.id = messages.room_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "Enviar mensajes" on public.messages;
create policy "Enviar mensajes"
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and (
    exists (
      select 1
      from public.chat_participants cp
      where cp.room_id = messages.room_id
        and cp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.chat_rooms cr
      join public.stores s on s.id = cr.store_id
      where cr.id = messages.room_id
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists "Editar mis mensajes" on public.messages;
create policy "Editar mis mensajes"
on public.messages
for update
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

create or replace view public.chat_rooms_with_details as
select
  cr.id,
  cr.type,
  cr.store_id,
  cr.created_at,
  cr.last_message_at,
  coalesce(
    json_agg(
      json_build_object(
        'user_id', cp.user_id,
        'joined_at', cp.joined_at,
        'last_read_at', cp.last_read_at,
        'profile', json_build_object(
          'id', p.id,
          'name', coalesce(to_jsonb(p)->>'name', to_jsonb(p)->>'nombre', split_part(coalesce(to_jsonb(p)->>'email', ''), '@', 1)),
          'email', to_jsonb(p)->>'email',
          'avatar_url', to_jsonb(p)->>'avatar_url',
          'role', to_jsonb(p)->>'role'
        )
      )
    ) filter (where cp.id is not null),
    '[]'::json
  ) as participants
from public.chat_rooms cr
left join public.chat_participants cp on cp.room_id = cr.id
left join public.profiles p on p.id = cp.user_id
group by cr.id;

create or replace view public.messages_with_sender as
select
  m.*,
  json_build_object(
    'id', p.id,
    'name', coalesce(to_jsonb(p)->>'name', to_jsonb(p)->>'nombre', split_part(coalesce(to_jsonb(p)->>'email', ''), '@', 1)),
    'email', to_jsonb(p)->>'email',
    'avatar_url', to_jsonb(p)->>'avatar_url',
    'role', to_jsonb(p)->>'role'
  ) as sender_profile
from public.messages m
left join public.profiles p on p.id = m.sender_id
where m.is_deleted = false;
