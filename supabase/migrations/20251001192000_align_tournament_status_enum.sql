-- App uses draft | published | completed.
-- Step 1 of 2: add enum labels only (Postgres forbids using new enum values in the same transaction).
-- After this succeeds, run 20251001192100_migrate_tournament_status_legacy.sql

do $$
begin
  if to_regtype('public.tournament_status') is null then
    create type public.tournament_status as enum ('draft', 'published', 'completed');
  end if;
end $$;

do $$
declare
  v_label text;
begin
  if to_regtype('public.tournament_status') is null then
    return;
  end if;

  foreach v_label in array array['draft', 'published', 'completed']::text[]
  loop
    begin
      execute format('alter type public.tournament_status add value %L', v_label);
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;
