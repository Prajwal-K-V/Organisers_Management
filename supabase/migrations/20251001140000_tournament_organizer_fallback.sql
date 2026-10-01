-- Keep access in sync when organizer_id is set but junction row is missing
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
