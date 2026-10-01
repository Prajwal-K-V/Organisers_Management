-- Co-organizers assigned in tournament_organizers must see teams/players even if table RLS
-- or is_tournament_organizer() on the project is out of date.

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

create or replace function public.organizer_tournament_teams(p_tournament_id uuid)
returns setof public.teams
language sql
stable
security definer
set search_path = public
as $$
  select t.*
  from public.teams t
  where t.tournament_id = p_tournament_id
    and public.organizer_tournament_access(p_tournament_id)
  order by t.name;
$$;

create or replace function public.organizer_tournament_players(p_tournament_id uuid)
returns setof public.players
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.players p
  where p.tournament_id = p_tournament_id
    and public.organizer_tournament_access(p_tournament_id)
  order by p.player_code;
$$;

create or replace function public.organizer_my_tournaments()
returns setof public.tournaments
language sql
stable
security definer
set search_path = public
as $$
  select distinct tr.*
  from public.tournaments tr
  left join public.tournament_organizers to_ on to_.tournament_id = tr.id
  where auth.uid() is not null
    and (
      public.is_super_admin()
      or tr.organizer_id = auth.uid()
      or to_.profile_id = auth.uid()
    )
  order by tr.created_at desc;
$$;

revoke all on function public.organizer_tournament_access(uuid) from public;
revoke all on function public.organizer_tournament_teams(uuid) from public;
revoke all on function public.organizer_tournament_players(uuid) from public;
revoke all on function public.organizer_my_tournaments() from public;

grant execute on function public.organizer_tournament_access(uuid) to authenticated;
grant execute on function public.organizer_tournament_teams(uuid) to authenticated;
grant execute on function public.organizer_tournament_players(uuid) to authenticated;
grant execute on function public.organizer_my_tournaments() to authenticated;
