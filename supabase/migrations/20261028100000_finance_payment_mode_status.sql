-- Add 'pending' entry type and payment_mode / status fields to the finance ledger.

-- 1. Extend the enum with the new 'pending' type
alter type public.ledger_entry_type add value if not exists 'pending';

-- 2. Add new columns to the main ledger table
alter table public.financial_ledger
  add column if not exists payment_mode text,
  add column if not exists status text not null default 'settled';

-- 3. Mirror the new columns in the history (audit) table
alter table public.financial_ledger_history
  add column if not exists payment_mode text,
  add column if not exists status text;

-- 4. Update the audit trigger function to snapshot the new fields
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
    payment_mode,
    status,
    changed_by
  )
  values (
    old.id,
    old.tournament_id,
    old.team_id,
    old.entry_type,
    old.amount,
    old.description,
    old.payment_mode,
    old.status,
    auth.uid()
  );
  return new;
end;
$$;

-- 5. Extend the RLS insert policy to allow 'pending' entries for manual insert
drop policy if exists ledger_insert_manual on public.financial_ledger;
create policy ledger_insert_manual on public.financial_ledger
  for insert to authenticated
  with check (
    entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income', 'pending')
    and (
      public.is_tournament_organizer(tournament_id)
      or public.is_super_admin()
    )
  );

-- 6. Extend the RLS update policy to allow editing 'pending' entries
drop policy if exists ledger_update_manual on public.financial_ledger;
create policy ledger_update_manual on public.financial_ledger
  for update to authenticated
  using (
    entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income', 'pending')
    and (
      public.is_tournament_organizer(tournament_id)
      or public.is_super_admin()
    )
  )
  with check (
    entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income', 'pending')
    and (
      public.is_tournament_organizer(tournament_id)
      or public.is_super_admin()
    )
  );
