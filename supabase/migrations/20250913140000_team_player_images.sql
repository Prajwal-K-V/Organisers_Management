-- Image URLs (Supabase Storage public URLs)
alter table public.teams
  add column if not exists logo_url text;

alter table public.players
  add column if not exists image_url text;

-- Storage bucket for tournament media
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tournament-assets',
  'tournament-assets',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path layout: {tournament_id}/teams|players/{uuid}.{ext}
create policy tournament_assets_select on storage.objects
  for select to public
  using (bucket_id = 'tournament-assets');

create policy tournament_assets_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tournament-assets'
    and exists (
      select 1 from public.tournaments t
      where t.id = ((storage.foldername(name))[1])::uuid
        and (t.organizer_id = auth.uid() or public.is_super_admin())
    )
  );

create policy tournament_assets_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tournament-assets'
    and exists (
      select 1 from public.tournaments t
      where t.id = ((storage.foldername(name))[1])::uuid
        and (t.organizer_id = auth.uid() or public.is_super_admin())
    )
  );

create policy tournament_assets_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tournament-assets'
    and exists (
      select 1 from public.tournaments t
      where t.id = ((storage.foldername(name))[1])::uuid
        and (t.organizer_id = auth.uid() or public.is_super_admin())
    )
  );
