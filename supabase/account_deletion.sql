-- Run by hand in the Supabase SQL editor.
--
-- WHY: "Permanently delete my account" in account settings only signed the
-- user out — nothing was actually removed from the database, despite the
-- UI promising listings, requests, reviews and posts would all be deleted.
--
-- This function does the real cleanup. It's SECURITY DEFINER so it can
-- delete across tables regardless of each table's own RLS policies, but it
-- always operates on auth.uid() — never a passed-in id — so a signed-in
-- user can only ever delete their own data this way.
--
-- It only touches public schema tables. The actual login (auth.users row)
-- is removed separately by the API route via the admin API, which is the
-- Supabase-recommended way to delete an auth user (it also cleans up
-- sessions/identities, which a raw SQL delete on auth.users would not).

create or replace function delete_my_account_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  owned_listing_ids uuid[];
  my_request_ids uuid[];
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select array_agg(id) into owned_listing_ids from listings where user_id = uid;

  -- requests on listings this user owns, plus requests this user made as a renter
  select array_agg(id) into my_request_ids
  from requests
  where listing_id = any(coalesce(owned_listing_ids, array[]::uuid[])) or requester_id = uid;

  if my_request_ids is not null then
    delete from messages where request_id = any(my_request_ids);
  end if;

  delete from ratings where rater_id = uid or ratee_id = uid
    or listing_id = any(coalesce(owned_listing_ids, array[]::uuid[]));

  if my_request_ids is not null then
    delete from requests where id = any(my_request_ids);
  end if;

  if owned_listing_ids is not null then
    delete from listing_images where listing_id = any(owned_listing_ids);
    delete from listings where id = any(owned_listing_ids);
  end if;

  delete from notifications where user_id = uid;
  delete from post_likes where user_id = uid;
  delete from post_comments where user_id = uid;
  delete from posts where user_id = uid;
  delete from blog_comments where user_id = uid;

  delete from users where id = uid;
end;
$$;

grant execute on function delete_my_account_data() to authenticated;
