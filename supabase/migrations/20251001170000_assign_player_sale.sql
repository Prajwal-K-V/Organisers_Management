-- Simple auction sale (player → team) with ledger bid row; bypasses RLS safely in one transaction.

drop policy if exists ledger_insert_bid on public.financial_ledger;
create policy ledger_insert_bid on public.financial_ledger
  for insert to authenticated
  with check (
    entry_type = 'bid'
    and (
      public.is_tournament_organizer(tournament_id)
      or public.is_super_admin()
    )
  );

create or replace function public.assign_player_sale(
  p_tournament_id uuid,
  p_player_id uuid,
  p_team_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_team public.teams%rowtype;
  v_spent numeric;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_tournament_organizer(p_tournament_id) and not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter a valid bid amount';
  end if;

  select * into v_player
  from public.players
  where id = p_player_id and tournament_id = p_tournament_id
  for update;

  if not found then
    raise exception 'Player not found';
  end if;

  if v_player.status = 'sold' then
    raise exception 'This player is already sold';
  end if;

  if p_amount < v_player.base_price then
    raise exception 'Bid must be at least %', v_player.base_price;
  end if;

  select * into v_team
  from public.teams
  where id = p_team_id and tournament_id = p_tournament_id
  for update;

  if not found then
    raise exception 'Team not found';
  end if;

  select coalesce(sum(sold_price), 0)
  into v_spent
  from public.players
  where tournament_id = p_tournament_id
    and team_id = p_team_id
    and status = 'sold';

  if p_amount > (v_team.purse_total - v_spent) then
    raise exception 'Team does not have enough purse remaining';
  end if;

  update public.players
  set status = 'sold', team_id = p_team_id, sold_price = p_amount
  where id = p_player_id;

  update public.teams
  set purse_remaining = v_team.purse_total - v_spent - p_amount
  where id = p_team_id;
end;
$$;

revoke all on function public.assign_player_sale(uuid, uuid, uuid, numeric) from public;
grant execute on function public.assign_player_sale(uuid, uuid, uuid, numeric) to authenticated;
