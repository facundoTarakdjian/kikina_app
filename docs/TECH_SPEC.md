# Kikiña — TECH_SPEC

> Versión 1.0 · 30/10/2026 · Complementa a `PRD.md`

---

## 1. Arquitectura

```
┌────────────────────────────┐        ┌──────────────────────────────┐
│  PWA (Next.js App Router)  │        │  Supabase (plan Free)        │
│  · React + TS + Tailwind   │◄──────►│  · Auth (OTP por mail)       │
│  · Service Worker (Serwist)│  RLS   │  · Postgres + RLS            │
│  · Compresión de imágenes  │        │  · Storage (bucket privado)  │
│    y EXIF en el cliente    │        │  · Realtime (opcional)       │
└──────────┬─────────────────┘        └──────────────▲───────────────┘
           │                                         │ service role
┌──────────▼─────────────────┐                       │
│ Vercel (Hobby)             │───────────────────────┘
│ · Route Handlers /api/*    │──► Web Push (VAPID, librería web-push)
│ · /api/v1/* para Atajos    │
└────────────────────────────┘
┌────────────────────────────┐
│ GitHub Actions (v1)        │──► Backup mensual a Google Drive
└────────────────────────────┘
Mapas: MapLibre GL + tiles de OpenFreeMap (gratis, sin key)
Búsqueda de lugares: Google Places API (New) dentro del cupo gratuito → fallback Photon (OSM)
```

### Decisiones clave
| Tema | Decisión | Por qué |
|---|---|---|
| Lecturas y escrituras de la app | Directo desde el cliente con `@supabase/ssr` + RLS | Menos código; RLS es la frontera de seguridad. |
| Endpoints de Atajos, push y export | Route Handlers en `/api` con service role | Necesitan autenticación por token o privilegios del servidor. |
| Imágenes | Se comprimen en el navegador antes de subir | Las transformaciones de imagen de Supabase no están en el plan gratis; ahorra Storage y datos móviles. |
| Partida en vivo | Reducer puro por juego + estado en `matches.state` (jsonb) + copia en `localStorage` | Sobrevive a que se bloquee el celular; deshacer trivial; testeable. |
| Discreción | Contenido base global (`couple_id null`) + contenido propio | La base viene precargada; lo propio está aislado por pareja. |
| Pausa de Supabase Free | Se reactiva a mano desde el dashboard (decisión de Facu) | Sin costo. Los datos no se pierden. |

---

## 2. Stack y librerías

| Uso | Librería |
|---|---|
| Framework | Next.js (App Router, versión estable actual), React, TypeScript estricto |
| Estilos | Tailwind CSS (+ CSS variables para tokens de `DESIGN.md`) |
| Supabase | `@supabase/supabase-js`, `@supabase/ssr` |
| PWA / Service Worker | `@serwist/next` |
| Push | `web-push` (servidor) |
| Imágenes | `browser-image-compression` (o canvas propio), `exifr` (leer EXIF antes de comprimir) |
| Mapas | `maplibre-gl` + `react-map-gl` (tiles OpenFreeMap) |
| Fechas | `date-fns` + locale `es` |
| Validación | `zod` |
| Export ZIP | `client-zip` (streaming en el navegador) |
| Tests | `vitest` (reducers de juegos, utilidades), Playwright (smoke) |
| Animaciones | `motion` (dados, sobres), con moderación |

---

## 3. Autenticación

- **Signups deshabilitados** en Supabase (Auth → Settings → "Allow new users to sign up" = off).
- Los dos usuarios se crean a mano en el dashboard (Auth → Users → Add user, con mail confirmado).
- Login: `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })` → el usuario escribe el código con `verifyOtp({ email, token, type: 'email' })`.
- **Plantilla del mail** (Auth → Email Templates → Magic Link): mostrar `{{ .Token }}` grande y **no** incluir el link. Motivo: en iOS la PWA instalada no comparte cookies con Safari; un link abriría Safari y la app seguiría deslogueada.
- Sesión: access token de 1 h + refresh token sin vencimiento (default del plan gratis) → en la práctica nunca vuelve a pedir login.
- Middleware de Next (`src/middleware.ts`) refresca la sesión en cada request (patrón oficial de `@supabase/ssr`).
- **SMTP propio: obligatorio.** El mailer incluido de Supabase solo entrega a miembros de la organización del proyecto (no a usuarios externos), por lo que Kiki nunca recibiría los códigos. Configurar un SMTP externo en Auth → Settings → SMTP antes del primer uso. Setup actual: Gmail con contraseña de aplicación (`smtp.gmail.com:587`, usuario `facu.tarakdjian@gmail.com`). Alternativa si se revoca: Resend con dominio verificado (plan gratis, 100 mails/día).

---

## 4. Modelo de datos (SQL completo)

Archivo: `supabase/migrations/0001_init.sql`.
Convenciones: `snake_case`, `uuid` como PK, `created_at`/`updated_at` en todo, **`couple_id` en todas las tablas de contenido** (RLS simple y rápido), borrado lógico (`deleted_at`) en recuerdos.

```sql
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
```

### Seed (`supabase/seed.sql` + `scripts/seed.ts`)
1. Insertar el `couple` (`met_on = '2024-11-16'`, `together_on = '2025-05-25'`).
2. Crear los 2 usuarios en Auth (a mano) y luego sus `profiles` con el `couple_id`.
3. Insertar los juegos base (`is_builtin = true`):

| slug | name | emoji | scorer | config |
|---|---|---|---|---|
| `scrabble` | Scrabble | 🔤 | `scrabble` | `{}` |
| `truco` | Truco | 🃏 | `truco` | `{"target":30,"flor":false}` |
| `chinchon` | Chinchón | 🂡 | `chinchon` | `{"limit":101,"cut_bonus":-10,"reenganche":false}` |
| `codigo-secreto` | Código Secreto | 🕵️ | `winner_only` | `{}` |
| `auto-amarillo` | Auto amarillo | 🚕 | `counter` | `{}` |

4. `scripts/seed.ts` carga `preguntas_kikina.json` → `questions` y `discrecion_base.json` → `discretion_dice_faces`, `discretion_cards` e `discretion_ideas` (con `couple_id = null`).

---

## 5. Lógica de juegos (reducers)

Cada juego es un módulo puro en `src/lib/scorers/<scorer>.ts`:

```ts
export interface Scorer<S, E> {
  init(config: GameConfig, players: [PlayerId, PlayerId]): S;
  apply(state: S, event: E): S;        // puro, sin efectos
  undo(state: S): S;                   // vuelve a calcular desde events.slice(0, -1)
  result(state: S): { finished: boolean; winner: PlayerId | null; scores: Record<PlayerId, number>; extra?: Record<PlayerId, unknown> };
}
// El estado siempre guarda `events: E[]`; el resto se deriva → deshacer es trivial.
```

| Scorer | Eventos | Fin |
|---|---|---|
| `truco` | `{t:'point', player, n=1}` | Primero en `target` (30). UI: fosforitos en grupos de 5; separador de "malas/buenas" en 15. |
| `chinchon` | `{t:'hand', scores:{a:n,b:n}, cut?:player}`, `{t:'chinchon', player}` | Pierde quien supera `limit` (101); `chinchon` gana directo. `cut` suma `cut_bonus` (−10) al que cortó. |
| `scrabble` | `{t:'turn', player, points, word?}`, `{t:'end'}` | Al tocar "Terminar"; gana el mayor total. `extra`: mejor palabra y mejor turno. |
| `winner_only` | `{t:'win', player}` | Inmediato. |
| `rounds` | `{t:'round', scores}` | Según `config.win` (`highest`/`lowest`) y `config.target`. |
| `counter` | No usa `matches`: escribe en `counter_events`. | Eterno. |

**Persistencia de partida en vivo:** cada `apply` → guarda en `localStorage` (inmediato) y hace `upsert` de `matches.state` con debounce de 800 ms. Al abrir el juego, si hay un `match` `in_progress`, se ofrece retomarlo. Al terminar: `status='finished'`, `winner_id`, `finished_at` y filas en `match_scores`.

**Tests obligatorios** (`vitest`): cada scorer con casos de victoria, empate (si aplica), deshacer y límites (truco 29→30, chinchón 101 exacto vs 102, chinchón directo, −10).

---

## 6. Imágenes y Storage

### Pipeline de subida (cliente)
1. `exifr.parse(file, ['DateTimeOriginal','GPSLatitude','GPSLongitude'])` → `taken_at`, `lat`, `lng` (**antes** de comprimir, porque el canvas borra el EXIF).
2. Convertir HEIC si hace falta (Safari ya entrega JPEG al elegir de la galería en la mayoría de los casos; si llega HEIC, usar `heic2any` de forma lazy).
3. Comprimir a **WebP**: lado mayor 2048 px, calidad 0.8 → ~250–400 KB.
4. Miniatura WebP: lado mayor 480 px, calidad 0.7 → ~30–50 KB.
5. Subir ambas a `media/{couple_id}/{yyyy}/{mm}/{media_id}.webp` y `..._thumb.webp`.
6. Insertar fila en `media`.

**Videos:** sin transcodificar (pesado en el navegador). Límite de 25 MB y 30 s; se valida antes de subir. Se generará un póster (primer frame) como miniatura.

### Presupuesto de Storage (Free = 1 GB)
| Uso estimado por año | Fotos | MB |
|---|---|---|
| ~80 dates × 1 foto | 80 | ~35 |
| ~4 viajes × 30 fotos | 120 | ~50 |
| Fotos sueltas | ~100 | ~40 |
| Videos cortos (pocos) | 5 | ~60 |
| **Total por año** | | **~185 MB** |

Más la precarga inicial (~100 fotos, ~40 MB) → **unos 4–5 años** en el plan gratis. En Ajustes se muestra el uso (suma de `media.bytes`) con aviso al pasar el 80%. Cuando se llegue, las opciones serán: Supabase Pro, mover los archivos a Cloudflare R2 (10 GB gratis) o comprimir más.

### Lectura
- Bucket **privado**. Se usan `createSignedUrls` en lote (vencimiento de 1 h) para las miniaturas visibles; la imagen grande se pide al abrir el recuerdo.
- Cache del service worker para miniaturas ya vistas (estrategia `StaleWhileRevalidate` por `media_id`, no por URL firmada).

### Precarga masiva
- Pantalla `/recuerdos/importar` (pensada para la compu, también funciona en el celular).
- Cola con concurrencia 3, reintento individual y barra de progreso.
- Las fotos sin EXIF quedan en un grupo "sin fecha" → selector "asignar fecha a todas".
- Agrupación sugerida: fotos del mismo día → un recuerdo `photo` por día (editable).

---

## 7. Lugares y mapa

- **Búsqueda:** Google Places API (New): Autocomplete + Place Details con *field mask* mínimo (`id, displayName, formattedAddress, location`). Usar *session tokens* para que autocomplete + details cuenten como una sesión. Con 2 usuarios el uso queda muy por debajo del cupo gratuito mensual (verificar los cupos vigentes en la consola de Google Cloud; requiere cargar una tarjeta). La key se restringe por HTTP referrer (`kikina-app.vercel.app/*`) y solo a Places API.
- **Fallback sin tarjeta:** Photon (`photon.komoot.io`, OSM) para autocomplete. Peor con restaurantes chicos, pero gratis y sin key. El código abstrae `PlaceSearchProvider` para cambiar sin tocar la UI.
- **Desde Atajos:** iOS manda `place_name` + `lat/lng` (de "Obtener ubicación actual"); el servidor busca un `place` existente a < 80 m con nombre similar o crea uno `provider='apple'`.
- **Mapa:** MapLibre GL + estilo de OpenFreeMap (gratis, sin key). Clustering de pins nativo de MapLibre. Colores de pins según `DESIGN.md`.

---

## 8. Notificaciones (Web Push) — solo "pensé en vos"

### Setup
- Generar claves VAPID: `npx web-push generate-vapid-keys`.
- Service worker (Serwist) con handlers `push` y `notificationclick`.
- `POST /api/push/subscribe` guarda la suscripción (`endpoint`, `p256dh`, `auth`) del usuario logueado.
- Al insertar un `thought`, el cliente llama a `POST /api/thoughts/notify` (o el endpoint de Atajos lo hace directamente) → el servidor busca las suscripciones de `to_user` y envía con `web-push`. Si la respuesta es **404/410**, borra la suscripción.

### Particularidades de iOS (importante)
| Regla | Implicancia |
|---|---|
| Requiere **iOS/iPadOS 16.4 o superior** | Mostrar aviso si la versión es menor. |
| Solo funciona con la PWA **instalada** en la pantalla de inicio (`display: standalone`) | En Safari normal, el botón de notificaciones explica cómo instalar. Detectar con `navigator.standalone` / `matchMedia('(display-mode: standalone)')`. |
| El permiso **se pide desde un gesto del usuario** (tap) | Botón "Activar avisos de 'pensé en vos'", nunca al cargar la página. |
| **No hay push silencioso**: cada push tiene que mostrar una notificación | El handler `push` siempre llama a `showNotification`. |
| Las suscripciones pueden invalidarse (reinstalación, borrar datos) | Re-suscribir en cada apertura si el permiso está concedido y la suscripción cambió. |
| Badges | Opcional: `navigator.setAppBadge(n)` con los "pensé en vos" no vistos. |

**Android (Chrome):** funciona instalada o no. Mismo código.

### Payload
```json
{ "title": "💭", "body": "Facu pensó en vos", "url": "/inicio?pensamiento=<id>", "tag": "thought" }
```
Si hay mensajito: `body = "Facu: <mensaje>"`. `tag` agrupa para no llenar el centro de notificaciones.

---

## 9. API para Atajos (`/api/v1`)

### Autenticación
- En **Ajustes → Atajos**, el usuario genera un token: `kk_` + 32 bytes aleatorios en base64url. Se muestra **una sola vez** (con botón copiar). En la base solo queda `sha256(token)` y el prefijo.
- Header en cada request: `Authorization: Bearer kk_xxxxxxxx`.
- El handler hashea, busca en `api_tokens` (no revocado), actualiza `last_used_at` y actúa **como ese usuario** usando el cliente service role, fijando siempre `couple_id` y `created_by` del dueño del token.
- Rate limit simple en memoria/edge: 30 req/min por token.
- Errores: `401` token inválido, `422` validación, `500` genérico. Todas las respuestas incluyen `message` en castellano para mostrar en el Atajo.

### Endpoints

| Método y ruta | Body | Efecto | Respuesta |
|---|---|---|---|
| `GET /api/v1/ping` | — | Verifica el token | `{ok:true, user:"Kiki"}` |
| `POST /api/v1/thoughts` | JSON `{ message?: string }` | Crea un "pensé en vos" + push al otro | `{ok:true, message:"Listo 💭"}` |
| `POST /api/v1/dates` | `multipart/form-data`: `photo` (file), `place_name`, `lat?`, `lng?`, `address?`, `occurred_at?` | Comprime la foto en el servidor (`sharp`), crea `entry` tipo date + `media` + `place` | `{ok:true, id, message:"Date guardado 📸"}` |
| `POST /api/v1/media` | `multipart`: `files[]`, `date?` (YYYY-MM-DD) | Sube fotos sueltas (agrupa por día en recuerdos `photo`) | `{ok:true, count, message:"3 fotos subidas"}` |
| `POST /api/v1/counter/:slug` | JSON `{ delta?: 1 \| -1 }` | Suma al contador eterno del dueño del token (ej. `auto-amarillo`) | `{ok:true, total:47, message:"🚕 47"}` |

Notas:
- `/api/v1/dates` y `/api/v1/media` usan `sharp` en el servidor porque el Atajo manda la foto original; límite de body de Vercel (4.5 MB): el Atajo redimensiona antes de mandar (acción "Redimensionar imagen" a 1600 px de ancho + JPEG 0.8, ver `SHORTCUTS.md`).
- Función de Vercel con `runtime = 'nodejs'` para `sharp`.

### Compartir en Android (Web Share Target)
En `manifest.webmanifest`:
```json
"share_target": {
  "action": "/compartir",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": { "files": [{ "name": "files", "accept": ["image/*", "video/*"] }] }
}
```
El service worker intercepta el `POST /compartir`, guarda los archivos en IndexedDB y redirige a `/compartir` (GET), que muestra la pantalla de subida con fecha sugerida desde el EXIF. **iOS no soporta Share Target** → se resuelve con un Atajo que aparece en la hoja de compartir (ver `SHORTCUTS.md`).

---

## 10. Discreción — detalles técnicos

- Ruta `/discrecion/*` con layout propio que fuerza `data-theme="discrecion"` (oscuro).
- **Desbloqueo (Etapa 2):** es una puerta de UX, no de seguridad (los datos ya están protegidos por RLS).
  - Opción principal: WebAuthn (passkey de plataforma: Face ID / huella) con `@simplewebauthn/browser` verificado contra una credencial registrada en el dispositivo.
  - Fallback: PIN de 4 dígitos (`profiles.discretion_pin_hash`, bcrypt vía Route Handler).
  - Se mantiene desbloqueado 15 minutos (en `sessionStorage`).
- Selección de cartas: excluir las que tienen `pref='nunca'` de cualquiera de los dos; no repetir dentro de la sesión; alternar verdad/reto; turno alternado entre los dos perfiles.
- Dados: para el nivel N, cada dado toma caras con `min_level <= N`, con más peso para `min_level = N` (por ejemplo, 60%) para que se sienta el nivel.
- Nada de Discreción entra en búsquedas, timeline ni resúmenes (son tablas separadas: se cumple por diseño).

---

## 11. Estructura de carpetas

```
kikina/
├─ CLAUDE.md
├─ docs/  (PRD, TECH_SPEC, DESIGN, SHORTCUTS, ROADMAP)
├─ supabase/
│  ├─ migrations/0001_init.sql
│  ├─ seed.sql
│  └─ seed-data/{preguntas_kikina.json, discrecion_base.json}
├─ scripts/
│  ├─ seed.ts
│  └─ backup.ts                 (v1: usado por GitHub Actions)
├─ public/
│  ├─ icons/ (icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png)
│  └─ splash/ (pantallas de inicio de iOS)
├─ src/
│  ├─ app/
│  │  ├─ manifest.ts
│  │  ├─ sw.ts                  (Serwist)
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (app)/layout.tsx       (nav inferior, sesión)
│  │  ├─ (app)/inicio/page.tsx
│  │  ├─ (app)/recuerdos/page.tsx            (feed → capítulos/calendario/mapa)
│  │  ├─ (app)/recuerdos/[id]/page.tsx
│  │  ├─ (app)/recuerdos/importar/page.tsx
│  │  ├─ (app)/dates/nuevo/page.tsx
│  │  ├─ (app)/dates/ranking/page.tsx
│  │  ├─ (app)/juegos/page.tsx
│  │  ├─ (app)/juegos/[slug]/page.tsx        (marcador + historial + estadísticas)
│  │  ├─ (app)/juegos/[slug]/jugar/page.tsx  (anotador en vivo)
│  │  ├─ (app)/preguntas/page.tsx
│  │  ├─ (app)/sobres/page.tsx
│  │  ├─ (app)/ajustes/page.tsx              (atajos, notificaciones, export, uso de storage)
│  │  ├─ discrecion/layout.tsx               (tema oscuro + desbloqueo)
│  │  ├─ discrecion/page.tsx
│  │  ├─ discrecion/dados/page.tsx
│  │  ├─ discrecion/cartas/page.tsx
│  │  ├─ discrecion/lo-probamos/page.tsx
│  │  ├─ compartir/page.tsx                  (Share Target Android)
│  │  └─ api/
│  │     ├─ push/subscribe/route.ts
│  │     ├─ thoughts/notify/route.ts
│  │     └─ v1/{ping,thoughts,dates,media}/route.ts, v1/counter/[slug]/route.ts
│  ├─ components/
│  │  ├─ ui/                    (Button, Sheet, Card, Avatar, Dice, Envelope…)
│  │  ├─ memories/ games/ discretion/ questions/ thoughts/
│  ├─ lib/
│  │  ├─ supabase/{client.ts, server.ts, admin.ts, middleware.ts}
│  │  ├─ scorers/{truco,chinchon,scrabble,winner-only,rounds}.ts + __tests__/
│  │  ├─ images/{compress.ts, exif.ts, upload.ts}
│  │  ├─ places/{provider.ts, google.ts, photon.ts}
│  │  ├─ push/{send.ts, subscribe.ts}
│  │  ├─ api-auth.ts            (verificación de tokens de Atajos)
│  │  ├─ export/{buildZip.ts}
│  │  └─ dates.ts               (días juntos, formato es-AR)
│  ├─ types/database.ts         (generado: supabase gen types)
│  └─ middleware.ts
└─ .github/workflows/backup.yml (v1)
```

---

## 12. Variables de entorno

| Variable | Dónde | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente + servidor | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente + servidor | Key pública (anon/publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** | Endpoints de Atajos, push, backup |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | cliente | Suscripción push |
| `VAPID_PRIVATE_KEY` | **solo servidor** | Envío de push |
| `VAPID_SUBJECT` | servidor | `mailto:facundo@…` |
| `NEXT_PUBLIC_GOOGLE_PLACES_KEY` | cliente | Autocomplete (restringida por referrer) |
| `PLACES_PROVIDER` | cliente | `google` \| `photon` |
| `NEXT_PUBLIC_APP_URL` | ambos | `https://kikina-app.vercel.app` |
| `GOOGLE_DRIVE_FOLDER_ID` | GitHub Actions (v1) | Carpeta destino del backup |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | GitHub Actions (v1) | Credencial para subir a Drive |
| `SUPABASE_DB_URL` | GitHub Actions (v1) | `pg_dump` |

`.env.example` versionado con todas las claves vacías; `.env.local` en `.gitignore`.

---

## 13. Backup y exportación

### A. "Exportar todo" (Etapa 2) — en el navegador
Se arma en el cliente para no chocar con los límites de tiempo y memoria de las funciones de Vercel:
1. Trae todas las tablas de contenido (paginado) y las serializa a `data/<tabla>.json` + `data/<tabla>.csv`.
2. Recorre `media`, pide URLs firmadas y hace streaming de cada archivo al ZIP con `client-zip`.
3. Nombres legibles: `fotos/2025/05/2025-05-25_golf-newman_1.webp`.
4. Incluye `LEEME.txt` (estructura, fecha del export, versión del esquema).
5. Discreción solo si se tilda "Incluir Discreción".
6. Descarga: `kikina-export-AAAA-MM-DD.zip`.

### B. Backup mensual automático (v1) — GitHub Actions → Google Drive
`.github/workflows/backup.yml` con `schedule: cron '0 6 1 * *'` (día 1 de cada mes):
1. `pg_dump --data-only --format=custom $SUPABASE_DB_URL > db.dump` (más el esquema completo una vez por trimestre).
2. `scripts/backup.ts`: exporta las tablas a JSON/CSV y descarga los archivos de Storage **nuevos desde el último backup** (incremental por `media.created_at`).
3. Sube todo a la carpeta de Drive con una service account (la carpeta se comparte con el mail de la service account).
4. Retención: los últimos 12 backups de base; los archivos de fotos se acumulan (son inmutables).

> Nota: un proyecto pausado no responde → el backup de ese mes falla y GitHub manda mail. Sirve además como alarma de "che, se pausó Supabase".

### C. Independencia del proveedor
- Datos en Postgres estándar (sin extensiones exóticas) → migrables a cualquier Postgres.
- Fotos en archivos WebP con estructura de carpetas legible.
- El export es autocontenido: se puede abrir sin la app.

---

## 14. Seguridad (checklist)
- [ ] RLS habilitado en **todas** las tablas (test: con un tercer usuario de prueba, todas las queries devuelven vacío).
- [ ] Service role solo en Route Handlers y scripts; nunca en el cliente.
- [ ] Signups deshabilitados; `shouldCreateUser: false`.
- [ ] Tokens de Atajos hasheados, revocables, con `last_used_at` visible en Ajustes.
- [ ] Key de Places restringida por referrer y API.
- [ ] Headers: `Content-Security-Policy` básica, `Referrer-Policy: same-origin`.
- [ ] `noindex` (meta + `robots.txt`) para que la app no aparezca en buscadores.
