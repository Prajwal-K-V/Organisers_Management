-- Add received_by_name to track who physically received or paid money for each ledger entry.

alter table public.financial_ledger
  add column if not exists received_by_name text;

alter table public.financial_ledger_history
  add column if not exists received_by_name text;

-- Update the audit trigger to snapshot received_by_name alongside other fields.
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
    received_by_name,
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
    old.received_by_name,
    auth.uid()
  );
  return new;
end;
$$;
