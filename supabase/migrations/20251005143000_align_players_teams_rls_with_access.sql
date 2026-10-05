-- Keep players/teams writes aligned with organizer_tournament_access (co-organizers + primary organizer).

create or replace function public.is_tournament_organizer(p_tournament_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tournament_organizers to_
    where to_.tournament_id = p_tournament_id
      and to_.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.tournaments t
    where t.id = p_tournament_id
      and t.organizer_id = auth.uid()
  );
$$;

create or replace function public.organizer_tournament_access(p_tournament_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      public.is_super_admin()
      or exists (
        select 1
        from public.tournament_organizers to_
        where to_.tournament_id = p_tournament_id
          and to_.profile_id = auth.uid()
      )
      or exists (
        select 1
        from public.tournaments tr
        where tr.id = p_tournament_id
          and tr.organizer_id = auth.uid()
      )
    );
$$;

insert into public.tournament_organizers (tournament_id, profile_id)
select t.id, t.organizer_id
from public.tournaments t
where t.organizer_id is not null
on conflict do nothing;

drop policy if exists teams_tournament on public.teams;
create policy teams_tournament on public.teams for all to authenticated
  using (public.organizer_tournament_access(tournament_id))
  with check (public.organizer_tournament_access(tournament_id));

drop policy if exists players_tournament on public.players;
create policy players_tournament on public.players for all to authenticated
  using (public.organizer_tournament_access(tournament_id))
  with check (public.organizer_tournament_access(tournament_id));
