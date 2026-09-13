-- Backfill profile for auth users created before handle_new_user trigger
create or replace function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if found then
    return v_profile;
  end if;

  select * into v_user from auth.users where id = auth.uid();
  if not found then
    raise exception 'Auth user not found';
  end if;

  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    v_user.id,
    coalesce(v_user.email, ''),
    coalesce(v_user.raw_user_meta_data->>'full_name', ''),
    'organizer',
    false
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
