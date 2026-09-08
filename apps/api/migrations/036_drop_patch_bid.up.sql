-- STEP 2 OF 2. 035 added bangumi_id beside `bid` and moved every reader and
-- writer onto it; this drops the old column. Deploy this only after the 035
-- release is actually running — the point of the split is that no live binary
-- may still be asking for `bid` when it disappears.
--
-- The re-copy is not belt-and-braces. Between 035's migrate container finishing
-- and its api container being recreated, the OLD binary was still live and its
-- GORM model still wrote `bid` and not `bangumi_id`, so a patch created in that
-- ten-to-thirty second window carries the old column and an empty new one. It
-- is a handful of rows at most and usually none, but "usually none" is not a
-- reason to drop the only copy of somebody's Bangumi link.
UPDATE patch SET bangumi_id = bid WHERE bangumi_id IS NULL AND bid IS NOT NULL;

DROP INDEX IF EXISTS patch_bid_key;
ALTER TABLE patch DROP COLUMN IF EXISTS bid;
