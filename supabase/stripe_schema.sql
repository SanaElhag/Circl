-- Run this by hand in the Supabase SQL editor (project has no migration tooling).
-- Adds the columns needed for Stripe Connect payouts + authorize/capture payments.

alter table users add column if not exists stripe_account_id text;
alter table users add column if not exists stripe_charges_enabled boolean not null default false;

alter table requests add column if not exists stripe_payment_intent_id text;
-- payment_status: unpaid | authorized | captured | canceled | refunded
alter table requests add column if not exists payment_status text not null default 'unpaid';
alter table requests add column if not exists amount_total_cents integer;
