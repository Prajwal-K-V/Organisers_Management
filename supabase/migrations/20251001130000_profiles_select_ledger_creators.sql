-- Let tournament organizers read name/email of users who created ledger entries they can view.

create policy profiles_select_ledger_creators on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.financial_ledger fl
      where fl.created_by = profiles.id
        and (
          public.is_tournament_organizer(fl.tournament_id)
          or public.is_super_admin()
        )
    )
  );
