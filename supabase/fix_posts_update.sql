-- Run by hand in the Supabase SQL editor.
--
-- WHY: owners could not edit their own community posts - there's no UPDATE
-- policy on "posts" letting a user touch their own row. Confirmed live:
-- updating your own post as yourself returned {error: null, data: []} and
-- the content never actually changed. Same gap as the other tables fixed
-- earlier this session (users, messages, listings) - these tables were set
-- up by hand in the dashboard rather than tracked migrations, so UPDATE
-- policies were likely just never added alongside SELECT/INSERT/DELETE.

drop policy if exists "posts_owner_update" on posts;
create policy "posts_owner_update"
  on posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
