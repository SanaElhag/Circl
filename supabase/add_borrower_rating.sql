-- Run by hand in the Supabase SQL editor.
--
-- WHY: once a rental was done, a borrower could rate the gear and the gear
-- owner, but there was no way for the gear owner to rate the borrower back -
-- the ratings table only had `gear_rating` and `owner_rating` columns, both
-- written only by the borrower (as rater). This adds the missing column so
-- the owner's side of the same `ratings` row can carry their rating of the
-- borrower.

alter table ratings add column if not exists borrower_rating smallint;
alter table ratings add column if not exists borrower_comment text;
