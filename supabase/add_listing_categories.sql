-- Run by hand in the Supabase SQL editor.
--
-- WHY: a listing could only ever have one category, but a lot of gear
-- genuinely belongs in more than one (a 4-season tent is both "camping"
-- and "hiking", a drysuit is both "water-sports" and "fishing"). This adds
-- a `categories` array column holding every category an owner picks.
--
-- `category` is left in place and keeps working exactly as before - every
-- existing read site that expects a single string (dashboard rows, the
-- admin table, messages, etc.) just keeps showing the first category an
-- owner picked, untouched. New code (posting, editing, browsing) reads
-- and writes `categories`; `category` is kept in sync as categories[0].

alter table listings add column if not exists categories text[];

update listings
set categories = array[category]
where categories is null and category is not null;
