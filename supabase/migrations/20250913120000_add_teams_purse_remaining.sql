-- Align teams with app schema when the table was created without purse columns.
alter table public.teams
  add column if not exists purse_total numeric(14, 2);

alter table public.teams
  add column if not exists purse_remaining numeric(14, 2);

update public.teams
set
  purse_total = coalesce(purse_total, 0),
  purse_remaining = coalesce(purse_remaining, coalesce(purse_total, 0));

alter table public.teams
  alter column purse_total set default 0,
  alter column purse_total set not null,
  alter column purse_remaining set default 0,
  alter column purse_remaining set not null;

do $$
begin
  alter table public.teams
    add constraint teams_purse_total_nonneg check (purse_total >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.teams
    add constraint teams_purse_remaining_nonneg check (purse_remaining >= 0);
exception
  when duplicate_object then null;
end $$;
