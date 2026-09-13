-- Hosted players tables often require role, player_code, etc. Backfill + defaults + insert trigger.

alter table public.players
  add column if not exists role text;

do $$
declare
  v_typid oid;
  v_typtype "char";
  v_typname name;
  v_fallback text;
begin
  select a.atttypid, t.typtype, t.typname
  into v_typid, v_typtype, v_typname
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_type t on t.oid = a.atttypid
  where n.nspname = 'public'
    and c.relname = 'players'
    and a.attname = 'role'
    and not a.attisdropped;

  if v_typid is null then
    return;
  end if;

  if v_typtype = 'e' then
    for v_fallback in
      select unnest(array['batsman', 'bowler', 'all_rounder', 'wicket_keeper'])
    loop
      begin
        execute format('alter type public.%I add value %L', v_typname, v_fallback);
      exception
        when duplicate_object then null;
      end;
    end loop;

    v_fallback := 'all_rounder';
    begin
      execute format(
        'update public.players set role = %L::public.%I where role is null',
        v_fallback,
        v_typname
      );
      execute format(
        'alter table public.players alter column role set default %L::public.%I',
        v_fallback,
        v_typname
      );
    exception
      when others then
        select e.enumlabel
        into v_fallback
        from pg_enum e
        where e.enumtypid = v_typid
        order by e.enumsortorder
        limit 1;

        execute format(
          'update public.players set role = %L::public.%I where role is null',
          v_fallback,
          v_typname
        );
        execute format(
          'alter table public.players alter column role set default %L::public.%I',
          v_fallback,
          v_typname
        );
    end;
  else
    v_fallback := 'all_rounder';
    update public.players
    set role = coalesce(nullif(trim(role::text), ''), v_fallback)
    where role is null;
    alter table public.players
      alter column role set default v_fallback;
  end if;
end $$;

create or replace function public.players_before_insert_defaults()
returns trigger
language plpgsql
as $$
declare
  v_typid oid;
  v_typtype "char";
  v_typname name;
  v_fallback text;
  v_next_code text;
begin
  if new.base_price is null then
    new.base_price := 0;
  end if;

  if new.status is null and to_regtype('public.player_status') is not null then
    new.status := 'available';
  end if;

  if new.player_code is null or btrim(new.player_code) = '' then
    select
      'P' || lpad((count(*) + 1)::text, 3, '0')
    into v_next_code
    from public.players
    where tournament_id = new.tournament_id;

    new.player_code := coalesce(v_next_code, 'P001');
  end if;

  select a.atttypid, t.typtype, t.typname
  into v_typid, v_typtype, v_typname
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_type t on t.oid = a.atttypid
  where n.nspname = 'public'
    and c.relname = 'players'
    and a.attname = 'role'
    and not a.attisdropped;

  if v_typid is not null and new.role is null then
    if v_typtype = 'e' then
      select e.enumlabel
      into v_fallback
      from pg_enum e
      where e.enumtypid = v_typid
      order by e.enumsortorder
      limit 1;

      new.role := v_fallback;
    else
      new.role := 'all_rounder';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists players_before_insert_defaults on public.players;
create trigger players_before_insert_defaults
  before insert on public.players
  for each row
  execute function public.players_before_insert_defaults();
