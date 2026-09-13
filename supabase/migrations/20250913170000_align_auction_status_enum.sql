-- App uses scheduled | live | paused | ended (hosted DBs often define auction_status without them).

do $$
declare
  v_enum name;
  v_label text;
begin
  foreach v_enum in array array['auction_status', 'auction_session_status']::name[]
  loop
    if to_regtype('public.' || v_enum) is null then
      continue;
    end if;

    foreach v_label in array array['scheduled', 'live', 'paused', 'ended']::text[]
    loop
      begin
        execute format('alter type public.%I add value %L', v_enum, v_label);
      exception
        when duplicate_object then null;
      end;
    end loop;
  end loop;
end $$;

do $$
begin
  create type public.auction_session_status as enum ('scheduled', 'live', 'paused', 'ended');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.auction_sessions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  status public.auction_session_status not null default 'scheduled',
  current_player_id uuid references public.players (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If status column uses auction_status instead, cast-compatible labels were added above.
alter table public.auction_sessions
  add column if not exists current_player_id uuid references public.players (id) on delete set null;

alter table public.auction_sessions
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

alter table public.auction_sessions
  add column if not exists started_at timestamptz;

alter table public.auction_sessions
  add column if not exists ended_at timestamptz;

alter table public.auction_sessions
  add column if not exists created_at timestamptz not null default now();

alter table public.auction_sessions
  add column if not exists updated_at timestamptz not null default now();

create index if not exists auction_sessions_tournament_id_idx on public.auction_sessions (tournament_id);

create or replace function public.is_tournament_organizer(p_tournament_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tournaments t
    where t.id = p_tournament_id and t.organizer_id = auth.uid()
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

alter table public.auction_sessions enable row level security;

drop policy if exists auction_sessions_tournament on public.auction_sessions;
create policy auction_sessions_tournament on public.auction_sessions for all to authenticated
  using (public.is_tournament_organizer(tournament_id) or public.is_super_admin())
  with check (public.is_tournament_organizer(tournament_id) or public.is_super_admin());
