-- =========================================================
-- 0001_init.sql — Kikiña
-- =========================================================
create extension if not exists pgcrypto;

-- ---------- utilidades ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- pareja y perfiles ----------
create table public.couples (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default 'Kikiña',
  met_on       date not null,              -- 2024-11-16
  together_on  date,                       -- 2025-05-25
  created_at   timestamptz not null default now()
);

create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  couple_id            uuid not null references public.couples(id),
  display_name         text not null,       -- 'Facu' / 'Kiki'
  email                text not null unique,
  color                text,                -- color de acento por persona (marcadores)
  discretion_pin_hash  text,                -- fallback del desbloqueo de Discreción
  created_at           timestamptz not null default now()
);

-- couple_id del usuario actual (security definer: evita recursión de RLS)
create or replace function public.my_couple_id() returns uuid
language sql stable security definer set search_path = public as $$
  select couple_id from public.profiles where id = auth.uid()
$$;

create or replace function public.partner_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles
  where couple_id = public.my_couple_id() and id <> auth.uid()
  limit 1
$$;

-- ---------- lugares ----------
create table public.places (
  id                 uuid primary key default gen_random_uuid(),
  couple_id          uuid not null references public.couples(id),
  name               text not null,
  address            text,
  city               text,
  country            text,
  lat                double precision,
  lng                double precision,
  provider           text not null default 'manual' check (provider in ('google','osm','apple','manual')),
  provider_place_id  text,
  created_at         timestamptz not null default now(),
  unique (couple_id, provider, provider_place_id)
);
create index places_couple_idx on public.places (couple_id);

-- ---------- recuerdos (tabla unificada del timeline) ----------
create table public.entries (
  id                uuid primary key default gen_random_uuid(),
  couple_id         uuid not null references public.couples(id),
  type              text not null check (type in ('date','photo','trip','milestone','note')),
  title             text,
  body              text,
  occurred_on       date not null default current_date,
  occurred_at       timestamptz,                -- hora exacta si se conoce
  place_id          uuid references public.places(id),
  cover_media_id    uuid,                       -- FK agregada después de crear media
  is_first_time     boolean not null default false,
  first_time_label  text,                       -- 'Primer viaje juntos'
  hidden_until      timestamptz,                -- sorpresas (v1): invisible para el otro hasta esa fecha
  created_by        uuid not null references public.profiles(id) default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  search            tsvector generated always as (
                      to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(body,'') || ' ' || coalesce(first_time_label,''))
                    ) stored
);
create index entries_timeline_idx on public.entries (couple_id, occurred_on desc) where deleted_at is null;
create index entries_type_idx     on public.entries (couple_id, type, occurred_on desc) where deleted_at is null;
create index entries_place_idx    on public.entries (place_id);
create index entries_search_idx   on public.entries using gin (search);
create trigger entries_updated before update on public.entries for each row execute function public.set_updated_at();

-- ---------- detalle de date ----------
create table public.date_details (
  entry_id      uuid primary key references public.entries(id) on delete cascade,
  couple_id     uuid not null references public.couples(id),
  food          text,
  kind          text check (kind in ('cena','almuerzo','cine','plan_en_casa','evento','salida','otro')),
  would_return  text check (would_return in ('si','no','tal_vez')),
  updated_at    timestamptz not null default now()
);
create trigger date_details_updated before update on public.date_details for each row execute function public.set_updated_at();

create table public.date_ratings (
  entry_id    uuid not null references public.entries(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) default auth.uid(),
  couple_id   uuid not null references public.couples(id),
  score       smallint not null check (score between 1 and 10),
  updated_at  timestamptz not null default now(),
  primary key (entry_id, user_id)
);

-- ---------- media ----------
create table public.media (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id),
  entry_id       uuid references public.entries(id) on delete set null,
  storage_path   text not null unique,       -- {couple_id}/{yyyy}/{mm}/{id}.webp
  thumb_path     text,                       -- {couple_id}/{yyyy}/{mm}/{id}_thumb.webp
  kind           text not null default 'image' check (kind in ('image','video')),
  mime           text not null,
  width          int,
  height         int,
  bytes          int,
  duration_s     numeric,
  taken_at       timestamptz,                -- EXIF DateTimeOriginal o fecha por lote
  lat            double precision,
  lng            double precision,
  original_name  text,
  position       int not null default 0,     -- orden dentro del recuerdo
  created_by     uuid not null references public.profiles(id) default auth.uid(),
  created_at     timestamptz not null default now()
);
create index media_entry_idx on public.media (entry_id, position);
create index media_taken_idx on public.media (couple_id, taken_at desc);

alter table public.entries
  add constraint entries_cover_fk foreign key (cover_media_id) references public.media(id) on delete set null;

-- ---------- reacciones y comentarios ----------
create table public.reactions (
  entry_id    uuid not null references public.entries(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) default auth.uid(),
  couple_id   uuid not null references public.couples(id),
  emoji       text not null check (emoji in ('❤️','😂','😍','🔥','🥹')),
  created_at  timestamptz not null default now(),
  primary key (entry_id, user_id, emoji)
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references public.entries(id) on delete cascade,
  couple_id   uuid not null references public.couples(id),
  user_id     uuid not null references public.profiles(id) default auth.uid(),
  body        text not null check (char_length(body) <= 500),
  created_at  timestamptz not null default now()
);
create index comments_entry_idx on public.comments (entry_id, created_at);

-- ---------- viajes (v1) ----------
create table public.trip_details (
  entry_id    uuid primary key references public.entries(id) on delete cascade,
  couple_id   uuid not null references public.couples(id),
  status      text not null default 'planned' check (status in ('idea','planned','done')),
  start_on    date,
  end_on      date,
  destination text
);

create table public.trip_plan_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.entries(id) on delete cascade,
  couple_id   uuid not null references public.couples(id),
  kind        text not null default 'todo' check (kind in ('todo','reserva','idea','lugar')),
  text        text not null,
  url         text,
  done        boolean not null default false,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- bucket list / restaurantes "para ir" (v1) ----------
create table public.wishlist_items (
  id              uuid primary key default gen_random_uuid(),
  couple_id       uuid not null references public.couples(id),
  list            text not null check (list in ('bucket','restaurantes')),
  text            text not null,
  place_id        uuid references public.places(id),
  done_entry_id   uuid references public.entries(id) on delete set null,  -- recuerdo que lo cumplió
  done_at         timestamptz,
  created_by      uuid not null references public.profiles(id) default auth.uid(),
  created_at      timestamptz not null default now()
);

-- ---------- juegos ----------
create table public.games (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id),
  slug        text not null,                  -- 'truco','chinchon','scrabble','codigo-secreto','auto-amarillo'
  name        text not null,
  emoji       text,
  scorer      text not null check (scorer in ('scrabble','truco','chinchon','winner_only','counter','rounds')),
  config      jsonb not null default '{}',    -- ej. truco {target:30}, chinchon {limit:101}, rounds {win:'highest'|'lowest', target?:n}
  is_builtin  boolean not null default false,
  archived    boolean not null default false,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  unique (couple_id, slug)
);

create table public.matches (
  id            uuid primary key default gen_random_uuid(),
  couple_id     uuid not null references public.couples(id),
  game_id       uuid not null references public.games(id),
  status        text not null default 'in_progress' check (status in ('in_progress','finished','abandoned')),
  state         jsonb not null default '{}',  -- estado del reducer + log de eventos (para deshacer)
  winner_id     uuid references public.profiles(id),   -- null = empate o cooperativo
  bet           text,                          -- "el que pierde paga el helado"
  bet_paid_at   timestamptz,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  created_by    uuid not null references public.profiles(id) default auth.uid(),
  updated_at    timestamptz not null default now()
);
create index matches_game_idx on public.matches (game_id, finished_at desc);
create index matches_open_idx on public.matches (couple_id) where status = 'in_progress';
create trigger matches_updated before update on public.matches for each row execute function public.set_updated_at();

create table public.match_scores (
  match_id    uuid not null references public.matches(id) on delete cascade,
  user_id     uuid not null references public.profiles(id),
  couple_id   uuid not null references public.couples(id),
  score       int not null,
  extra       jsonb not null default '{}',     -- scrabble: {best_word, best_word_points, best_turn}
  primary key (match_id, user_id)
);
create index match_scores_user_idx on public.match_scores (user_id);

-- contadores eternos (auto amarillo y juegos tipo 'counter')
create table public.counter_events (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id),
  game_id     uuid not null references public.games(id),
  user_id     uuid not null references public.profiles(id),   -- a quién se le suma
  delta       smallint not null check (delta in (-1, 1)),
  source      text not null default 'app' check (source in ('app','shortcut')),
  created_by  uuid not null references public.profiles(id) default auth.uid(),
  created_at  timestamptz not null default now()
);
create index counter_events_idx on public.counter_events (game_id, user_id);

create view public.counter_totals with (security_invoker = true) as
  select game_id, user_id, sum(delta)::int as total
  from public.counter_events group by game_id, user_id;

-- ---------- preguntas ----------
create table public.questions (
  id        int primary key,                   -- id del JSON semilla
  text      text not null,
  category  text not null check (category in ('gustos','dilemas','divertidas','profundas','pasado','futuro','nosotros','amor','picante')),
  source    text not null default 'nueva',
  active    boolean not null default true
);

create table public.question_draws (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples(id),
  question_id  int not null references public.questions(id),
  drawn_by     uuid not null references public.profiles(id) default auth.uid(),
  drawn_at     timestamptz not null default now()
);
create index question_draws_idx on public.question_draws (couple_id, question_id);

-- ---------- Discreción ----------
create table public.discretion_dice_faces (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid references public.couples(id),    -- null = base
  die        text not null check (die in ('accion','zona','modo')),
  min_level  smallint not null check (min_level between 1 and 4),
  text       text not null
);

create table public.discretion_cards (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid references public.couples(id),   -- null = base
  level       smallint not null check (level between 1 and 4),
  kind        text not null check (kind in ('verdad','reto')),
  text        text not null,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index discretion_cards_level_idx on public.discretion_cards (level);

create table public.discretion_card_prefs (
  card_id     uuid not null references public.discretion_cards(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) default auth.uid(),
  couple_id   uuid not null references public.couples(id),
  pref        text not null check (pref in ('nunca','favorita')),
  created_at  timestamptz not null default now(),
  primary key (card_id, user_id, pref)
);

create table public.discretion_ideas (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid references public.couples(id),   -- null = base
  level       smallint not null check (level between 1 and 4),
  text        text not null,
  done_at     timestamptz                           -- solo para ideas propias; para base ver discretion_idea_done
);

create table public.discretion_idea_votes (
  idea_id     uuid not null references public.discretion_ideas(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) default auth.uid(),
  couple_id   uuid not null references public.couples(id),
  vote        text not null check (vote in ('si','tal_vez','no')),
  updated_at  timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create table public.discretion_idea_done (
  idea_id     uuid not null references public.discretion_ideas(id) on delete cascade,
  couple_id   uuid not null references public.couples(id),
  done_at     timestamptz not null default now(),
  primary key (idea_id, couple_id)
);

-- Coincidencias de "¿Lo probamos?": solo se revela si los dos votaron y ninguno dijo 'no' y al menos uno dijo 'si'
create or replace function public.discretion_matches()
returns table (idea_id uuid, level smallint, text text, done_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, i.level, i.text, d.done_at
  from public.discretion_ideas i
  join public.discretion_idea_votes v1 on v1.idea_id = i.id and v1.user_id = auth.uid()
  join public.discretion_idea_votes v2 on v2.idea_id = i.id and v2.user_id = public.partner_id()
  left join public.discretion_idea_done d on d.idea_id = i.id and d.couple_id = public.my_couple_id()
  where (i.couple_id is null or i.couple_id = public.my_couple_id())
    and v1.vote <> 'no' and v2.vote <> 'no'
    and (v1.vote = 'si' or v2.vote = 'si')
$$;

-- ---------- pensé en vos ----------
create table public.thoughts (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id),
  from_user   uuid not null references public.profiles(id) default auth.uid(),
  to_user     uuid not null references public.profiles(id),
  message     text check (char_length(message) <= 140),
  reply_to    uuid references public.thoughts(id),   -- "yo también 💭"
  source      text not null default 'app' check (source in ('app','shortcut')),
  seen_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index thoughts_to_idx on public.thoughts (to_user, created_at desc);

-- ---------- sobres y cartas para abrir cuando… ----------
create table public.envelopes (
  id              uuid primary key default gen_random_uuid(),
  couple_id       uuid not null references public.couples(id),
  from_user       uuid not null references public.profiles(id) default auth.uid(),
  to_user         uuid not null references public.profiles(id),
  kind            text not null default 'sobre' check (kind in ('sobre','carta')),
  open_when       text,                 -- carta: 'estés triste', 'me extrañes'…
  unlock_at       timestamptz,          -- carta con fecha: no se puede abrir antes
  body            text not null,
  opened_at       timestamptz,
  created_at      timestamptz not null default now()
);
create index envelopes_to_idx on public.envelopes (to_user, opened_at);

-- ---------- push ----------
create table public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) default auth.uid(),
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);
create index push_user_idx on public.push_subscriptions (user_id);

-- ---------- tokens para Atajos ----------
create table public.api_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) default auth.uid(),
  name          text not null,              -- 'iPhone de Kiki'
  token_hash    text not null unique,       -- sha256 hex del token; el token en claro se muestra una sola vez
  token_prefix  text not null,              -- 'kk_ab12' para reconocerlo en la UI
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

-- =========================================================
-- RLS
-- =========================================================
alter table public.couples               enable row level security;
alter table public.profiles              enable row level security;
alter table public.places                enable row level security;
alter table public.entries               enable row level security;
alter table public.date_details          enable row level security;
alter table public.date_ratings          enable row level security;
alter table public.media                 enable row level security;
alter table public.reactions             enable row level security;
alter table public.comments              enable row level security;
alter table public.trip_details          enable row level security;
alter table public.trip_plan_items       enable row level security;
alter table public.wishlist_items        enable row level security;
alter table public.games                 enable row level security;
alter table public.matches               enable row level security;
alter table public.match_scores          enable row level security;
alter table public.counter_events        enable row level security;
alter table public.questions             enable row level security;
alter table public.question_draws        enable row level security;
alter table public.discretion_dice_faces enable row level security;
alter table public.discretion_cards      enable row level security;
alter table public.discretion_card_prefs enable row level security;
alter table public.discretion_ideas      enable row level security;
alter table public.discretion_idea_votes enable row level security;
alter table public.discretion_idea_done  enable row level security;
alter table public.thoughts              enable row level security;
alter table public.envelopes             enable row level security;
alter table public.push_subscriptions    enable row level security;
alter table public.api_tokens            enable row level security;

-- pareja y perfiles: solo lectura de lo propio
create policy couples_read  on public.couples  for select to authenticated using (id = public.my_couple_id());
create policy profiles_read on public.profiles for select to authenticated using (couple_id = public.my_couple_id());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- tablas "de la pareja": acceso total para los dos
do $$
declare t text;
begin
  foreach t in array array['places','date_details','media','comments','trip_details','trip_plan_items',
                           'wishlist_items','games','matches','match_scores','counter_events','question_draws',
                           'discretion_idea_done']
  loop
    execute format(
      'create policy %1$s_couple on public.%1$s for all to authenticated
         using (couple_id = public.my_couple_id())
         with check (couple_id = public.my_couple_id())', t);
  end loop;
end $$;

-- recuerdos: las sorpresas no se ven hasta hidden_until (salvo para quien las creó)
create policy entries_select on public.entries for select to authenticated
  using (couple_id = public.my_couple_id()
         and (hidden_until is null or hidden_until <= now() or created_by = auth.uid()));
create policy entries_insert on public.entries for insert to authenticated
  with check (couple_id = public.my_couple_id() and created_by = auth.uid());
create policy entries_update on public.entries for update to authenticated
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
-- no hay policy de delete: se usa deleted_at

-- puntajes y reacciones: cada uno escribe lo suyo, los dos leen todo
create policy ratings_read  on public.date_ratings for select to authenticated using (couple_id = public.my_couple_id());
create policy ratings_write on public.date_ratings for all    to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());

create policy reactions_read  on public.reactions for select to authenticated using (couple_id = public.my_couple_id());
create policy reactions_write on public.reactions for all    to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());

-- preguntas: lectura para autenticados
create policy questions_read on public.questions for select to authenticated using (true);

-- Discreción: base (couple_id null) + propio
create policy dice_read   on public.discretion_dice_faces for select to authenticated using (couple_id is null or couple_id = public.my_couple_id());
create policy dice_write  on public.discretion_dice_faces for all    to authenticated using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy cards_read  on public.discretion_cards for select to authenticated using (couple_id is null or couple_id = public.my_couple_id());
create policy cards_write on public.discretion_cards for all    to authenticated using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy ideas_read  on public.discretion_ideas for select to authenticated using (couple_id is null or couple_id = public.my_couple_id());
create policy ideas_write on public.discretion_ideas for all    to authenticated using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());

-- preferencias: los dos leen (los 'nunca' excluyen la carta para ambos); cada uno escribe las suyas
create policy prefs_read  on public.discretion_card_prefs for select to authenticated using (couple_id = public.my_couple_id());
create policy prefs_write on public.discretion_card_prefs for all    to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());

-- votos de "¿Lo probamos?": cada uno ve SOLO los suyos (coincidencias vía discretion_matches())
create policy votes_own on public.discretion_idea_votes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());

-- pensé en vos y sobres
create policy thoughts_read   on public.thoughts for select to authenticated using (couple_id = public.my_couple_id());
create policy thoughts_insert on public.thoughts for insert to authenticated
  with check (couple_id = public.my_couple_id() and from_user = auth.uid() and to_user = public.partner_id());
create policy thoughts_seen   on public.thoughts for update to authenticated using (to_user = auth.uid()) with check (to_user = auth.uid());

-- sobres: el que recibe no puede leer el cuerpo de una carta con fecha antes de tiempo → se lee vía función
create policy envelopes_read   on public.envelopes for select to authenticated
  using (couple_id = public.my_couple_id() and (from_user = auth.uid() or unlock_at is null or unlock_at <= now()));
create policy envelopes_insert on public.envelopes for insert to authenticated
  with check (couple_id = public.my_couple_id() and from_user = auth.uid() and to_user = public.partner_id());
create policy envelopes_open   on public.envelopes for update to authenticated using (to_user = auth.uid()) with check (to_user = auth.uid());

-- cartas bloqueadas: el destinatario ve que existen, pero sin el cuerpo
create or replace function public.locked_envelopes()
returns table (id uuid, open_when text, unlock_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select id, open_when, unlock_at, created_at from public.envelopes
  where to_user = auth.uid() and unlock_at > now()
$$;

-- push y tokens: solo lo propio
create policy push_own   on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tokens_own on public.api_tokens          for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================
-- Storage
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 26214400,  -- 25 MB (videos cortos)
        array['image/webp','image/avif','image/jpeg','image/png','video/mp4','video/quicktime'])
on conflict (id) do nothing;

create policy media_read on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = public.my_couple_id()::text);
