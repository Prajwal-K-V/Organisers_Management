-- Finance ledger (for projects that created teams/tournaments without initial_schema).

do $$
begin
  create type public.ledger_entry_type as enum (
    'opening_balance',
    'bid',
    'adjustment',
    'expense',
    'refund',
    'income'
  );
exception
  when duplicate_object then
    begin
      alter type public.ledger_entry_type add value 'income';
    exception
      when duplicate_object then null;
    end;
end $$;

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

create table if not exists public.financial_ledger (
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

create index if not exists financial_ledger_tournament_id_idx
  on public.financial_ledger (tournament_id, created_at desc);

alter table public.financial_ledger enable row level security;

drop policy if exists ledger_select on public.financial_ledger;
create policy ledger_select on public.financial_ledger for select to authenticated
  using (public.is_tournament_organizer(tournament_id) or public.is_super_admin());

drop policy if exists ledger_insert_adjustment on public.financial_ledger;
create policy ledger_insert_adjustment on public.financial_ledger for insert to authenticated
  with check (
    entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income')
    and (public.is_tournament_organizer(tournament_id) or public.is_super_admin())
  );
