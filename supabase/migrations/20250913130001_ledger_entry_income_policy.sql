-- Optional: refresh insert policy after income enum (skip if ledger not created yet).
do $$
begin
  if to_regclass('public.financial_ledger') is null then
    return;
  end if;

  execute 'drop policy if exists ledger_insert_adjustment on public.financial_ledger';
  execute $policy$
    create policy ledger_insert_adjustment on public.financial_ledger for insert to authenticated
    with check (
      entry_type in ('adjustment', 'expense', 'refund', 'opening_balance', 'income')
      and (public.is_tournament_organizer(tournament_id) or public.is_super_admin())
    )
  $policy$;
end $$;
