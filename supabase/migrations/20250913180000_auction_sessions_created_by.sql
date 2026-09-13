-- Hosted auction_sessions often require created_by.

alter table public.auction_sessions
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

update public.auction_sessions s
set created_by = t.organizer_id
from public.tournaments t
where s.tournament_id = t.id
  and s.created_by is null;

create or replace function public.auction_sessions_before_insert_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;

  if new.status is null then
    new.status := 'scheduled';
  end if;

  return new;
end;
$$;

drop trigger if exists auction_sessions_before_insert_defaults on public.auction_sessions;
create trigger auction_sessions_before_insert_defaults
  before insert on public.auction_sessions
  for each row
  execute function public.auction_sessions_before_insert_defaults();
