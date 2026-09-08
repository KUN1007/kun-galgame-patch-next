-- Restores the column and its index, then refills it from bangumi_id. The
-- values come back; the rows that only ever existed after 035 get theirs from
-- the new column, which is the only place they were ever written.
ALTER TABLE patch ADD COLUMN IF NOT EXISTS bid integer;
UPDATE patch SET bid = bangumi_id WHERE bid IS NULL AND bangumi_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS patch_bid_key ON patch (bid);
