-- Run this by hand in the Supabase SQL editor (project has no migration tooling).
--
-- WHY: the "only admins can post" check for blog posts and campus news only
-- exists in the browser (app/community/blog/new/page.tsx and
-- app/community/news/new/page.tsx check an ADMIN_USER_IDS list before
-- showing the form). That's just UI - anyone signed in can call the
-- Supabase REST API directly with their own login token and skip it
-- entirely, unless the database itself also checks who's allowed to write.
-- This makes sure it does.
--
-- Also relevant: blog post content is rendered as raw HTML on the site
-- (see app/community/blog/[slug]/page.tsx), so this is the difference
-- between "a spammy post" and "anyone signed up can run script on every
-- visitor who opens that post."

alter table blog_posts enable row level security;
alter table campus_news enable row level security;

drop policy if exists "blog_posts_admin_write" on blog_posts;
create policy "blog_posts_admin_write"
  on blog_posts for all
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from users where id = auth.uid() and role = 'admin'));

drop policy if exists "campus_news_admin_write" on campus_news;
create policy "campus_news_admin_write"
  on campus_news for all
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from users where id = auth.uid() and role = 'admin'));

-- This only adds an extra "admins can always do anything" rule - it doesn't
-- remove whatever read policy already lets everyone see published posts.
-- Postgres combines multiple policies with OR, so the existing public read
-- access keeps working exactly as it does now.
