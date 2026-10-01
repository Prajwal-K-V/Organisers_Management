-- Per-tournament privilege: which organizers may delete manual ledger entries.

alter table public.tournament_organizers
  add column if not exists can_delete_ledger boolean not null default false;

-- Existing primary organizers may continue managing ledger deletions until an admin revokes it.
update public.tournament_organizers to_
set can_delete_ledger = true
from public.tournaments t
where to_.tournament_id = t.id
  and to_.profile_id = t.organizer_id;

create or replace function public.can_delete_ledger(p_tournament_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.tournament_organizers to_
      where to_.tournament_id = p_tournament_id
        and to_.profile_id = auth.uid()
        and to_.can_delete_ledger
    );
$$;

drop policy if exists ledger_delete_manual on public.financial_ledger;
create policy ledger_delete_manual on public.financial_ledger
  for delete to authenticated
  using (
    entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income')
    and public.can_delete_ledger(tournament_id)
  );

drop policy if exists tournament_organizers_admin_update on public.tournament_organizers;
create policy tournament_organizers_admin_update on public.tournament_organizers
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
