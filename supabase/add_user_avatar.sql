-- Run by hand in the Supabase SQL editor.
--
-- WHY: profile photos only ever got saved to the signed-in user's own auth
-- metadata (supabase.auth.updateUser), which nobody else can read - so no
-- other user could ever see your photo, only you, only on your own
-- session. This adds a column on the public `users` table (same place
-- full_name already lives) so a photo can actually be joined into
-- listings/profile/etc. and shown to other people.

alter table users add column if not exists avatar_url text;
grant update (avatar_url) on users to authenticated;
