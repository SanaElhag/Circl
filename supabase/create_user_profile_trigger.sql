-- Run this by hand in the Supabase SQL editor (project has no migration tooling).
--
-- WHY: supabase.auth.signUp() only ever creates a row in Supabase's internal
-- auth.users table. Nothing has ever created the matching row in
-- public.users — the table every other page in the app actually reads from
-- (dashboard, listings, ratings, admin, Stripe Connect...). Every new signup
-- has been ending up with a working login and a completely broken profile.
--
-- Doing this from the client (an insert right after signUp() succeeds) can't
-- work here: email confirmation is required on this project, so the client
-- has no session — and therefore no RLS permission to insert into
-- public.users — until the user clicks the confirmation link. A trigger on
-- auth.users runs server-side with elevated privileges regardless of
-- session state, which is the standard Supabase pattern for this.
--
-- SECURITY DEFINER is required here so the trigger can write to public.users
-- on the new user's behalf, bypassing RLS for this one controlled insert
-- (the row it writes is exactly the auth.users row that just got created —
-- nothing user-controlled beyond their own name).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.users (id, email, full_name, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      'user'
    )
    on conflict (id) do nothing;
  exception when others then
    -- Never let a profile-row hiccup (an unexpected constraint, a duplicate,
    -- anything) block the actual account from being created. Worst case:
    -- same gap as today for that one signup, logged instead of silent.
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: anyone who already signed up during this bug and is stuck with
-- an auth account but no profile row. Safe to run even if there are none.
insert into public.users (id, email, full_name, role)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1)),
  'user'
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null
on conflict (id) do nothing;

-- Verify: this should return 0 rows once the backfill above has run.
-- select au.id, au.email from auth.users au
-- left join public.users pu on pu.id = au.id
-- where pu.id is null;
