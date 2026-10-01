-- Ledger edit audit trail and update policy for manual entries only.

create table public.financial_ledger_history (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.financial_ledger (id) on delete cascade,
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid,
  entry_type public.ledger_entry_type not null,
  amount numeric(14, 2) not null,
  description text,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index financial_ledger_history_ledger_id_idx
  on public.financial_ledger_history (ledger_id, changed_at desc);

create index financial_ledger_history_tournament_id_idx
  on public.financial_ledger_history (tournament_id, changed_at desc);

create or replace function public.financial_ledger_audit_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.financial_ledger_history (
    ledger_id,
    tournament_id,
    team_id,
    entry_type,
    amount,
    description,
    changed_by
  )
  values (
    old.id,
    old.tournament_id,
    old.team_id,
    old.entry_type,
    old.amount,
    old.description,
    auth.uid()
  );
  return new;
end;
$$;

create trigger financial_ledger_audit_update
  before update on public.financial_ledger
  for each row
  execute function public.financial_ledger_audit_update();

alter table public.financial_ledger_history enable row level security;

create policy ledger_history_select on public.financial_ledger_history
  for select to authenticated
  using (
    public.is_tournament_organizer(tournament_id)
    or public.is_super_admin()
  );

drop policy if exists ledger_update_manual on public.financial_ledger;
create policy ledger_update_manual on public.financial_ledger
  for update to authenticated
  using (
    entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income')
    and (
      public.is_tournament_organizer(tournament_id)
      or public.is_super_admin()
    )
  )
  with check (
    entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income')
    and (
      public.is_tournament_organizer(tournament_id)
      or public.is_super_admin()
    )
  );

create policy profiles_select_ledger_history_changers on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.financial_ledger_history flh
      where flh.changed_by = profiles.id
        and (
          public.is_tournament_organizer(flh.tournament_id)
          or public.is_super_admin()
        )
    )
  );
