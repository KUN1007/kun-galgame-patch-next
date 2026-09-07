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

CREATE UNIQUE INDEX IF NOT EXISTS idx_patch_catalog_work
  ON patch (catalog_work_id) WHERE catalog_work_id IS NOT NULL;
