-- Run by hand in the Supabase SQL editor.
--
-- WHY: NotificationBell.tsx and the chat thread in RequestView.tsx both
-- subscribe to postgres_changes so they update live without a refresh.
-- That only works if a table is added to Supabase's realtime publication —
-- tables created from the dashboard aren't added to it automatically.
--
-- Without this, nothing is actually broken: inserts still work, these
-- components just never get pushed a live update, so new notifications /
-- messages only show up once something else triggers a re-fetch.
--
-- Safe to re-run — skips a table that's already in the publication instead
-- of erroring (you already ran the "notifications" line once; only
-- "messages" is new here).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
