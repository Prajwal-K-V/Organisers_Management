-- player_code required on some hosted schemas; backfill and enforce uniqueness per tournament.

alter table public.players
  add column if not exists player_code text;

with numbered as (
  select
    id,
    'P' || lpad(
      (row_number() over (partition by tournament_id order by created_at nulls last, id))::text,
      3,
      '0'
    ) as code
  from public.players
  where player_code is null or trim(player_code) = ''
)
update public.players p
set player_code = n.code
from numbered n
where p.id = n.id;

alter table public.players
  alter column player_code set not null;

create unique index if not exists players_tournament_player_code_idx
  on public.players (tournament_id, player_code);
