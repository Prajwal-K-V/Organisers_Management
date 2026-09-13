-- Auction RPCs (place_bid, close_lot) for hosted DBs that skipped initial_schema.

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

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_session_id uuid not null references public.auction_sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists bids_session_id_idx on public.bids (auction_session_id, created_at desc);
create index if not exists bids_player_id_idx on public.bids (player_id, created_at desc);

alter table public.bids enable row level security;

drop policy if exists bids_select on public.bids;
create policy bids_select on public.bids for select to authenticated
  using (
    exists (
      select 1 from public.auction_sessions s
      where s.id = auction_session_id
        and (public.is_tournament_organizer(s.tournament_id) or public.is_super_admin())
    )
  );

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

  if v_session.status::text <> 'live' then
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

do $$
begin
  alter publication supabase_realtime add table public.bids;
exception
  when duplicate_object then null;
end $$;
