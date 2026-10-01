-- Keep primary organizer_id mirrored in tournament_organizers so RLS and admin UI stay consistent.

create or replace function public.trg_sync_tournament_primary_organizer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organizer_id is not null and to_regclass('public.tournament_organizers') is not null then
    insert into public.tournament_organizers (tournament_id, profile_id)
    values (new.id, new.organizer_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists tournaments_sync_primary_organizer on public.tournaments;
create trigger tournaments_sync_primary_organizer
  after insert or update of organizer_id on public.tournaments
  for each row
  execute function public.trg_sync_tournament_primary_organizer();

insert into public.tournament_organizers (tournament_id, profile_id)
select t.id, t.organizer_id
from public.tournaments t
where t.organizer_id is not null
on conflict do nothing;
