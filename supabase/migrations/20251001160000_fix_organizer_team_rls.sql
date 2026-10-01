-- Fix team/player RLS when primary organizer_id is set but junction row is missing,
-- or when is_tournament_organizer was updated without legacy fallback.

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

do $$
begin
  if to_regclass('public.tournament_organizers') is not null then
    insert into public.tournament_organizers (tournament_id, profile_id)
    select t.id, t.organizer_id
    from public.tournaments t
    where t.organizer_id is not null
    on conflict do nothing;
  end if;
end $$;

create or replace function public.ensure_my_tournament_organizer(p_tournament_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if to_regclass('public.tournament_organizers') is not null then
    insert into public.tournament_organizers (tournament_id, profile_id)
    select t.id, t.organizer_id
    from public.tournaments t
    where t.id = p_tournament_id
      and t.organizer_id = auth.uid()
    on conflict do nothing;
  end if;

  return public.is_tournament_organizer(p_tournament_id);
end;
$$;

revoke all on function public.ensure_my_tournament_organizer(uuid) from public;
grant execute on function public.ensure_my_tournament_organizer(uuid) to authenticated;
