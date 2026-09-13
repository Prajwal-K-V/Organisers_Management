-- Align players with app schema when the table was created without auction columns.

do $$
begin
  create type public.player_status as enum ('available', 'sold', 'unsold');
exception
  when duplicate_object then null;
end $$;

alter table public.players
  add column if not exists team_id uuid references public.teams (id) on delete set null;

alter table public.players
  add column if not exists base_price numeric(14, 2);

alter table public.players
  add column if not exists sold_price numeric(14, 2);

do $$
declare
  v_udt text;
begin
  select c.udt_name
  into v_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'players'
    and c.column_name = 'status';

  if v_udt is null then
    alter table public.players
      add column status public.player_status not null default 'available';
  elsif v_udt in ('text', 'varchar') then
    alter table public.players
      alter column status type public.player_status
      using coalesce(nullif(trim(status::text), ''), 'available')::public.player_status;
    alter table public.players
      alter column status set default 'available',
      alter column status set not null;
  end if;
end $$;

alter table public.players
  add column if not exists created_at timestamptz not null default now();

alter table public.players
  add column if not exists updated_at timestamptz not null default now();

update public.players
set base_price = coalesce(base_price, 0)
where base_price is null;

alter table public.players
  alter column base_price set default 0,
  alter column base_price set not null;

do $$
begin
  alter table public.players
    add constraint players_base_price_nonneg check (base_price >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.players
    add constraint players_sold_price_nonneg check (sold_price is null or sold_price >= 0);
exception
  when duplicate_object then null;
end $$;

create index if not exists players_tournament_id_idx on public.players (tournament_id);
create index if not exists players_status_idx on public.players (tournament_id, status);
