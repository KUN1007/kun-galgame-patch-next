-- Favourites move to the catalog (nextmoe-infra /v2/me/folders). A folder item
-- names a catalog WORK, and this site's patch.id is a different id space:
-- measured 2026-09-07, the offset between the two is not constant (185 for
-- 1,108 rows, 0 for 929, 4 for 907, 7 for 595, ...), so patch 923 and work 923
-- are different games. The only correct mapping is the vndb number, which both
-- sides already carry.
--
-- Resolving that per request would be an extra catalog call on every heart
-- click and, worse, would have no reverse direction: rendering "my favourites"
-- means turning a list of work ids back into patches, and work → vndb → patch
-- is one call per row. The column makes both directions a local index lookup
-- and lets the existing favourites query keep its SQL filtering and paging.
--
-- Nullable on purpose: 78 of 10,921 patches carry a `pending-<n>` placeholder
-- instead of a vndb number and have no work to point at. Those cannot be
-- favourited into the catalog and must fail loudly rather than silently land
-- on work 0.
ALTER TABLE patch ADD COLUMN IF NOT EXISTS catalog_work_id BIGINT;

-- NOT unique, and that was learned the hard way: this index shipped UNIQUE and
-- the production backfill died on it —
--   ERROR:  duplicate key value violates unique constraint "idx_patch_catalog_work"
--   DETAIL:  Key (catalog_work_id)=(61311) already exists.
-- Two works are each named by two patches, because this site dedupes on the
-- vndb_id STRING and the same game reaches it under two spellings: patch 61311
-- is `wiki-61311` while patch 61512 is `v65869`, and the catalog says those are
-- one work. A unique index here asserts this site has no duplicate game pages,
-- which is not this site's invariant to hold — the column points into somebody
-- else's id space. Both rows keep the work id, so a heart on either page is the
-- same favourite; PatchIDsByWorkIDs decides which page represents the work when
-- the list is rendered back.
CREATE INDEX IF NOT EXISTS idx_patch_catalog_work
  ON patch (catalog_work_id) WHERE catalog_work_id IS NOT NULL;
