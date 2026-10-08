-- Run by hand in the Supabase SQL editor.
--
-- WHY: owners could not delete their own listings. The app's delete calls
-- were returning success with zero rows affected — a classic RLS gotcha:
-- when a row-level security policy blocks a delete, PostgREST does NOT
-- return an error, it just deletes nothing and reports 200 OK. The app
-- code now checks for that (see OwnerDashboard.tsx / edit-gear), but the
-- real fix is making sure a DELETE policy actually exists.
--
-- This project's tables were created by hand in the dashboard rather than
-- tracked migrations, so it's very possible SELECT/INSERT/UPDATE policies
-- were set up for listings but DELETE was simply never added.
--
-- Safe to run even if a policy with this name already exists (it replaces it).

drop policy if exists "listings_owner_delete" on listings;
create policy "listings_owner_delete"
  on listings for delete
  using (auth.uid() = user_id);

-- Same gap is plausible anywhere else users delete their own rows.
drop policy if exists "listing_images_owner_delete" on listing_images;
create policy "listing_images_owner_delete"
  on listing_images for delete
  using (exists (
    select 1 from listings
    where listings.id = listing_images.listing_id
    and listings.user_id = auth.uid()
  ));

drop policy if exists "notifications_owner_delete" on notifications;
create policy "notifications_owner_delete"
  on notifications for delete
  using (auth.uid() = user_id);

drop policy if exists "posts_owner_delete" on posts;
create policy "posts_owner_delete"
  on posts for delete
  using (auth.uid() = user_id);

drop policy if exists "post_comments_owner_delete" on post_comments;
create policy "post_comments_owner_delete"
  on post_comments for delete
  using (auth.uid() = user_id);

drop policy if exists "post_likes_owner_delete" on post_likes;
create policy "post_likes_owner_delete"
  on post_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "blog_comments_owner_delete" on blog_comments;
create policy "blog_comments_owner_delete"
  on blog_comments for delete
  using (auth.uid() = user_id);
