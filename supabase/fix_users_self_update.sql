-- Run by hand in the Supabase SQL editor.
--
-- WHY: users could never actually save a Stripe account id, their payouts
-- status, or their own display name - there's no UPDATE policy letting a
-- signed-in user touch their own row in "users". Every one of these writes
-- was silently "succeeding" (no error) while touching zero rows. Confirmed
-- live: updating your own row as yourself returned {error: null, data: []}
-- and the value never actually changed in the database.
--
-- This is why "Set up payouts" kept creating a brand new Stripe account
-- every single time someone clicked it - the id from the last click never
-- actually got saved, so the app always thought no account existed yet.
--
-- role is deliberately left out of what a regular user can write at all,
-- enforced at the column-grant level (below and independent of RLS), so
-- nobody can hand themselves admin by calling
-- supabase.from("users").update({ role: "admin" }) on their own row. The
-- admin panel's role-change action now goes through a server route using
-- the service-role key instead of this policy.

revoke update on users from authenticated;
grant update (full_name, stripe_account_id, stripe_charges_enabled) on users to authenticated;

drop policy if exists "users_self_update" on users;
create policy "users_self_update"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
