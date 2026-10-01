-- Step 2 of 2: map legacy status labels to published (run only after 20251001192000 has committed).

do $$
begin
  if to_regtype('public.tournament_status') is null then
    return;
  end if;

  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'tournament_status'
      and e.enumlabel = 'published'
  ) then
    raise exception 'Run 20251001192000_align_tournament_status_enum.sql first, then run this script.';
  end if;

  if exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'tournament_status'
      and e.enumlabel = 'active'
  ) then
    update public.tournaments
    set status = 'published'::public.tournament_status
    where status::text = 'active';
  end if;

  if exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'tournament_status'
      and e.enumlabel = 'live'
  ) then
    update public.tournaments
    set status = 'published'::public.tournament_status
    where status::text = 'live';
  end if;
end $$;
