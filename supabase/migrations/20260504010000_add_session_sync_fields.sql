alter table public.sessions
add column if not exists drill_type text not null default 'solo_session',
add column if not exists current_streak integer not null default 0,
add column if not exists best_streak integer not null default 0;

create unique index if not exists session_calibrations_session_id_key
on public.session_calibrations (session_id);
