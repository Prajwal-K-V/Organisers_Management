-- Organizers must see creator/editor names on finance ledger rows (PostgREST embed + CSV).
-- Safe when financial_ledger_history is not deployed yet (history policies skipped).

create or replace function public.financial_ledger_set_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null and auth.uid() is not null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists financial_ledger_set_created_by on public.financial_ledger;
create trigger financial_ledger_set_created_by
  before insert on public.financial_ledger
  for each row
  execute function public.financial_ledger_set_created_by();

-- Co-organizers and primary organizers can read each other's display names.
drop policy if exists profiles_select_shared_tournament on public.profiles;
create policy profiles_select_shared_tournament on public.profiles
  for select to authenticated
  using (
    public.is_super_admin()
    or id = auth.uid()
    or exists (
      select 1
      from public.tournament_organizers mine
      inner join public.tournament_organizers peer
        on peer.tournament_id = mine.tournament_id
      where mine.profile_id = auth.uid()
        and peer.profile_id = profiles.id
    )
    or exists (
      select 1
      from public.tournaments t
      where t.organizer_id = auth.uid()
        and (
          profiles.id = t.organizer_id
          or exists (
            select 1
            from public.tournament_organizers to_
            where to_.tournament_id = t.id
              and to_.profile_id = profiles.id
          )
        )
    )
  );

drop policy if exists profiles_select_ledger_creators on public.profiles;
create policy profiles_select_ledger_creators on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.financial_ledger fl
      where fl.created_by = profiles.id
        and (
          public.organizer_tournament_access(fl.tournament_id)
          or public.is_super_admin()
        )
    )
  );

do $$
begin
  if to_regclass('public.financial_ledger_history') is null then
    return;
  end if;

  execute 'drop policy if exists profiles_select_ledger_history_changers on public.profiles';
  execute $policy$
    create policy profiles_select_ledger_history_changers on public.profiles
      for select to authenticated
      using (
        exists (
          select 1
          from public.financial_ledger_history flh
          where flh.changed_by = profiles.id
            and (
              public.organizer_tournament_access(flh.tournament_id)
              or public.is_super_admin()
            )
        )
      )
  $policy$;

  execute 'drop policy if exists ledger_history_select on public.financial_ledger_history';
  execute $policy$
    create policy ledger_history_select on public.financial_ledger_history
      for select to authenticated
      using (
        public.organizer_tournament_access(tournament_id)
        or public.is_super_admin()
      )
  $policy$;
end $$;

drop policy if exists ledger_select on public.financial_ledger;
create policy ledger_select on public.financial_ledger
  for select to authenticated
  using (
    public.organizer_tournament_access(tournament_id)
    or public.is_super_admin()
  );
