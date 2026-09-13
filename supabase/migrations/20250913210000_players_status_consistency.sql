-- Align players_status_consistency with app rules (available/unsold vs sold).

update public.players
set sold_price = null, team_id = null
where status::text in ('available', 'unsold')
  and (sold_price is not null or team_id is not null);

update public.players
set status = 'sold'
where team_id is not null
  and sold_price is not null
  and status::text <> 'sold';

alter table public.players
  drop constraint if exists players_status_consistency;

alter table public.players
  add constraint players_status_consistency check (
    (
      status::text in ('available', 'unsold')
      and team_id is null
      and sold_price is null
    )
    or (
      status::text = 'sold'
      and team_id is not null
      and sold_price is not null
    )
  );
