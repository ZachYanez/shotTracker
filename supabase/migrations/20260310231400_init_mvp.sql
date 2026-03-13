create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  dominant_hand text check (dominant_hand in ('left', 'right', 'either')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  total_attempts integer not null default 0,
  total_makes integer not null default 0,
  fg_pct numeric(5, 2) generated always as (
    case
      when total_attempts = 0 then 0
      else round((total_makes::numeric / total_attempts::numeric) * 100, 2)
    end
  ) stored,
  source text not null default 'mobile',
  status text not null default 'completed' check (status in ('active', 'completed', 'abandoned')),
  model_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shot_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp_ms integer not null,
  event_type text not null check (event_type in ('attempt', 'make', 'miss', 'release')),
  confidence numeric(5, 4),
  clip_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.session_calibrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  hoop_roi jsonb not null,
  shooter_seed jsonb,
  device_info jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_started_at_idx on public.sessions (user_id, started_at desc);
create index if not exists shot_events_session_timestamp_idx on public.shot_events (session_id, timestamp_ms);

create or replace view public.session_history_view
with (security_invoker = true) as
select
  s.id,
  s.user_id,
  date(s.started_at) as session_date,
  s.started_at,
  s.duration_seconds,
  s.total_attempts,
  s.total_makes,
  s.fg_pct
from public.sessions s
where s.status = 'completed';

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.shot_events enable row level security;
alter table public.session_calibrations enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "sessions_select_own"
on public.sessions
for select
using (auth.uid() = user_id);

create policy "sessions_insert_own"
on public.sessions
for insert
with check (auth.uid() = user_id);

create policy "sessions_update_own"
on public.sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "shot_events_select_own"
on public.shot_events
for select
using (auth.uid() = user_id);

create policy "shot_events_insert_own"
on public.shot_events
for insert
with check (auth.uid() = user_id);

create policy "shot_events_update_own"
on public.shot_events
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "session_calibrations_select_own"
on public.session_calibrations
for select
using (
  exists (
    select 1
    from public.sessions s
    where s.id = session_calibrations.session_id
      and s.user_id = auth.uid()
  )
);

create policy "session_calibrations_insert_own"
on public.session_calibrations
for insert
with check (
  exists (
    select 1
    from public.sessions s
    where s.id = session_calibrations.session_id
      and s.user_id = auth.uid()
  )
);

create policy "session_calibrations_update_own"
on public.session_calibrations
for update
using (
  exists (
    select 1
    from public.sessions s
    where s.id = session_calibrations.session_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.sessions s
    where s.id = session_calibrations.session_id
      and s.user_id = auth.uid()
  )
);
