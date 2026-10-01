-- Multiple organizers per tournament (assign without replacing others)

create table public.tournament_organizers (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tournament_id, profile_id)
);

create index tournament_organizers_profile_id_idx on public.tournament_organizers (profile_id);

insert into public.tournament_organizers (tournament_id, profile_id)
select id, organizer_id from public.tournaments
on conflict do nothing;

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

alter table public.tournament_organizers enable row level security;

create policy tournament_organizers_select on public.tournament_organizers
  for select to authenticated
  using (
    public.is_super_admin()
    or profile_id = auth.uid()
    or public.is_tournament_organizer(tournament_id)
  );

create policy tournament_organizers_admin_insert on public.tournament_organizers
  for insert to authenticated
  with check (public.is_super_admin());

create policy tournament_organizers_admin_delete on public.tournament_organizers
  for delete to authenticated
  using (public.is_super_admin());

drop policy if exists tournaments_organizer_all on public.tournaments;

create policy tournaments_organizer_all on public.tournaments for all to authenticated
  using (public.is_tournament_organizer(id) or public.is_super_admin())
  with check (public.is_tournament_organizer(id) or public.is_super_admin());

drop policy if exists tournament_assets_insert on storage.objects;
drop policy if exists tournament_assets_update on storage.objects;
drop policy if exists tournament_assets_delete on storage.objects;

create policy tournament_assets_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tournament-assets'
    and exists (
      select 1 from public.tournaments t
      where t.id = ((storage.foldername(name))[1])::uuid
        and (public.is_tournament_organizer(t.id) or public.is_super_admin())
    )
  );

create policy tournament_assets_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tournament-assets'
    and exists (
      select 1 from public.tournaments t
      where t.id = ((storage.foldername(name))[1])::uuid
        and (public.is_tournament_organizer(t.id) or public.is_super_admin())
    )
  );

create policy tournament_assets_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tournament-assets'
    and exists (
      select 1 from public.tournaments t
      where t.id = ((storage.foldername(name))[1])::uuid
        and (public.is_tournament_organizer(t.id) or public.is_super_admin())
    )
  );
