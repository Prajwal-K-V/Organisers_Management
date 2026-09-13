-- Enums
create type public.user_role as enum ('super_admin', 'organizer');
create type public.tournament_status as enum ('draft', 'published', 'completed');
create type public.player_status as enum ('available', 'sold', 'unsold');
create type public.auction_session_status as enum ('scheduled', 'live', 'paused', 'ended');
create type public.ledger_entry_type as enum ('opening_balance', 'bid', 'adjustment', 'expense', 'refund', 'income');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'organizer',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- Tournaments
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  starts_at date,
  ends_at date,
  status public.tournament_status not null default 'draft',
  settings jsonb not null default '{"min_bid_increment": 1000}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tournaments_organizer_id_idx on public.tournaments (organizer_id);

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  name text not null,
  purse_total numeric(14, 2) not null default 0 check (purse_total >= 0),
  purse_remaining numeric(14, 2) not null default 0 check (purse_remaining >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, name)
);

create index teams_tournament_id_idx on public.teams (tournament_id);

-- Players
create table public.players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  player_code text not null,
  name text not null,
  role text not null default 'all_rounder',
  base_price numeric(14, 2) not null default 0 check (base_price >= 0),
  sold_price numeric(14, 2) check (sold_price is null or sold_price >= 0),
  status public.player_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index players_tournament_id_idx on public.players (tournament_id);
create index players_status_idx on public.players (tournament_id, status);
create unique index players_tournament_player_code_idx on public.players (tournament_id, player_code);

-- Auction sessions
create table public.auction_sessions (
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

create index auction_sessions_tournament_id_idx on public.auction_sessions (tournament_id);

-- Bids
create table public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_session_id uuid not null references public.auction_sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index bids_session_id_idx on public.bids (auction_session_id, created_at desc);
create index bids_player_id_idx on public.bids (player_id, created_at desc);

-- Financial ledger
create table public.financial_ledger (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  entry_type public.ledger_entry_type not null,
  amount numeric(14, 2) not null,
  reference_id uuid,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index financial_ledger_tournament_id_idx on public.financial_ledger (tournament_id, created_at desc);

-- Helpers
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger tournaments_updated_at before update on public.tournaments
  for each row execute function public.set_updated_at();
create trigger teams_updated_at before update on public.teams
  for each row execute function public.set_updated_at();
create trigger players_updated_at before update on public.players
  for each row execute function public.set_updated_at();
create trigger auction_sessions_updated_at before update on public.auction_sessions
  for each row execute function public.set_updated_at();

-- New user profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'organizer',
    false
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- place_bid RPC
create or replace function public.place_bid(
  p_auction_session_id uuid,
  p_team_id uuid,
  p_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.auction_sessions%rowtype;
  v_tournament_id uuid;
  v_player_id uuid;
  v_increment numeric;
  v_high_bid numeric;
  v_has_bids boolean;
  v_base_price numeric;
  v_team public.teams%rowtype;
  v_bid_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_session from public.auction_sessions where id = p_auction_session_id for update;
  if not found then
    raise exception 'Auction session not found';
  end if;

  if v_session.status <> 'live' then
    raise exception 'Auction is not live';
  end if;

  v_player_id := v_session.current_player_id;
  if v_player_id is null then
    raise exception 'No player selected for auction';
  end if;

  v_tournament_id := v_session.tournament_id;
  if not public.is_tournament_organizer(v_tournament_id) and not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  v_increment := 1000;
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournaments'
      and column_name = 'settings'
  ) then
    select coalesce((t.settings->>'min_bid_increment')::numeric, 1000)
    into v_increment
    from public.tournaments t
    where t.id = v_tournament_id;
  end if;

  select exists (
    select 1 from public.bids
    where auction_session_id = p_auction_session_id and player_id = v_player_id
  ) into v_has_bids;

  if v_has_bids then
    select max(amount) into v_high_bid
    from public.bids
    where auction_session_id = p_auction_session_id and player_id = v_player_id;
    if p_amount < v_high_bid + v_increment then
      raise exception 'Bid must be at least %', v_high_bid + v_increment;
    end if;
  else
    select base_price into v_base_price from public.players where id = v_player_id;
    if p_amount < v_base_price then
      raise exception 'Opening bid must be at least the base price';
    end if;
  end if;

  select * into v_team from public.teams where id = p_team_id and tournament_id = v_tournament_id for update;
  if not found then
    raise exception 'Team not found in tournament';
  end if;

  if v_team.purse_remaining < p_amount then
    raise exception 'Insufficient purse remaining';
  end if;

  insert into public.bids (auction_session_id, player_id, team_id, amount, created_by)
  values (p_auction_session_id, v_player_id, p_team_id, p_amount, auth.uid())
  returning id into v_bid_id;

  return v_bid_id;
end;
$$;

-- close_lot RPC
create or replace function public.close_lot(
  p_auction_session_id uuid,
  p_mark_unsold boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.auction_sessions%rowtype;
  v_player_id uuid;
  v_high_bid record;
  v_tournament_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_session from public.auction_sessions where id = p_auction_session_id for update;
  if not found then
    raise exception 'Auction session not found';
  end if;

  v_tournament_id := v_session.tournament_id;
  if not public.is_tournament_organizer(v_tournament_id) and not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  v_player_id := v_session.current_player_id;
  if v_player_id is null then
    return;
  end if;

  if p_mark_unsold then
    update public.players set status = 'unsold', team_id = null, sold_price = null where id = v_player_id;
  else
    select b.team_id, b.amount, b.id as bid_id into v_high_bid
    from public.bids b
    where b.auction_session_id = p_auction_session_id and b.player_id = v_player_id
    order by b.amount desc, b.created_at desc
    limit 1;

    if not found then
      update public.players set status = 'unsold', team_id = null, sold_price = null where id = v_player_id;
    else
      update public.players
      set status = 'sold', team_id = v_high_bid.team_id, sold_price = v_high_bid.amount
      where id = v_player_id;

      update public.teams
      set purse_remaining = purse_remaining - v_high_bid.amount
      where id = v_high_bid.team_id;

      insert into public.financial_ledger (tournament_id, team_id, entry_type, amount, reference_id, description, created_by)
      values (
        v_tournament_id,
        v_high_bid.team_id,
        'bid',
        -v_high_bid.amount,
        v_high_bid.bid_id,
        'Player sold via auction',
        auth.uid()
      );
    end if;
  end if;

  update public.auction_sessions set current_player_id = null where id = p_auction_session_id;
end;
$$;

grant execute on function public.place_bid(uuid, uuid, numeric) to authenticated;
grant execute on function public.close_lot(uuid, boolean) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.auction_sessions enable row level security;
alter table public.bids enable row level security;
alter table public.financial_ledger enable row level security;

-- Profiles policies
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy profiles_super_admin_all on public.profiles for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Tournaments
create policy tournaments_organizer_all on public.tournaments for all to authenticated
  using (organizer_id = auth.uid() or public.is_super_admin())
  with check (organizer_id = auth.uid() or public.is_super_admin());

-- Teams
create policy teams_tournament on public.teams for all to authenticated
  using (public.is_tournament_organizer(tournament_id) or public.is_super_admin())
  with check (public.is_tournament_organizer(tournament_id) or public.is_super_admin());

-- Players
create policy players_tournament on public.players for all to authenticated
  using (public.is_tournament_organizer(tournament_id) or public.is_super_admin())
  with check (public.is_tournament_organizer(tournament_id) or public.is_super_admin());

-- Auction sessions
create policy auction_sessions_tournament on public.auction_sessions for all to authenticated
  using (public.is_tournament_organizer(tournament_id) or public.is_super_admin())
  with check (public.is_tournament_organizer(tournament_id) or public.is_super_admin());

-- Bids select only (insert via RPC)
create policy bids_select on public.bids for select to authenticated
  using (
    exists (
      select 1 from public.auction_sessions s
      where s.id = auction_session_id
        and (public.is_tournament_organizer(s.tournament_id) or public.is_super_admin())
    )
  );

-- Financial ledger
create policy ledger_select on public.financial_ledger for select to authenticated
  using (public.is_tournament_organizer(tournament_id) or public.is_super_admin());

create policy ledger_insert_adjustment on public.financial_ledger for insert to authenticated
  with check (
    entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income')
    and (public.is_tournament_organizer(tournament_id) or public.is_super_admin())
  );

-- Realtime
alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.auction_sessions;
