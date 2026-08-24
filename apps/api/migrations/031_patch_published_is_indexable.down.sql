-- Restores the column comment only if it existed; the backfill cannot
-- reconstruct pre-031 values. Rolling forward again is 031 up.

ALTER TABLE patch DROP COLUMN IF EXISTS published;
