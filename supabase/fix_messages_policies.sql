-- Run by hand in the Supabase SQL editor.
--
-- WHY: messages sent by a requester would appear for a second (optimistic
-- UI) then vanish — the insert was failing against RLS and getting rolled
-- back client-side, with no visible error. A message sent by the listing's
-- owner (confirmed live in the messages table) persisted fine, which points
-- at the insert policy only covering one side of the conversation (likely
-- just the owner), not both participants.
--
-- This replaces it with a policy that checks both directions: you can send
-- a message on a request if you're either the one who made the request, or
-- the owner of the listing it's on. Same idea for reading the thread.

drop policy if exists "messages_participant_insert" on messages;
create policy "messages_participant_insert"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from requests
      where requests.id = messages.request_id
      and (
        requests.requester_id = auth.uid()
        or requests.listing_id in (select id from listings where user_id = auth.uid())
      )
    )
  );

drop policy if exists "messages_participant_select" on messages;
create policy "messages_participant_select"
  on messages for select
  using (
    exists (
      select 1 from requests
      where requests.id = messages.request_id
      and (
        requests.requester_id = auth.uid()
        or requests.listing_id in (select id from listings where user_id = auth.uid())
      )
    )
  );
