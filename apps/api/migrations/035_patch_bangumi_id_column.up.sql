-- `bid` never said what it holds. It is a Bangumi subject id, and the code has
-- always known that without the schema saying so: the detail page builds
-- https://bangumi.tv/subject/${detail.bid} out of it, and the ratings block maps
-- source === 'bangumi' onto it. Nothing else in this database is called `bid`,
-- so the name carried no convention either — it just cost every reader one hop
-- through a template string to find out.
--
-- It came up on 2026-09-08 while looking for a way to map the patch pages the
-- vndb-only lane cannot see. 6,095 of 10,925 patches carry this id, catalog
-- holds 32,947 exact bangumi anchors, and the two had never been joined because
-- the column did not look like an external id. Confirmed by positive control
-- before renaming: for patches 1..5 the value equals the bangumi anchor of
-- catalog works 1..5 exactly, five for five.
--
-- STEP 1 OF 2, and the split is the whole point. A plain RENAME is not
-- backwards compatible, and this project deploys by running the migrate
-- container to completion and only THEN recreating the api container: for the
-- ten to thirty seconds in between, the OLD binary is live and still asking for
-- `bid`. GORM builds its column list from the model, so every query touching
-- the patch table would fail — the detail page and every card list. Adding the
-- new column instead leaves `bid` in place for that binary to keep reading, so
-- this step has no error window at all. 036 drops `bid` once nothing runs that
-- reads it.
ALTER TABLE patch ADD COLUMN IF NOT EXISTS bangumi_id integer;

UPDATE patch SET bangumi_id = bid WHERE bangumi_id IS NULL AND bid IS NOT NULL;

-- Unique like the index it replaces. This one is unique on this site's own
-- invariant ("no two patch pages are the same Bangumi subject"), which is a
-- different claim from idx_patch_catalog_work's — and that one is deliberately
-- NOT unique. See 034 for why mirroring somebody else's id space must not
-- assert their dedup quality.
CREATE UNIQUE INDEX IF NOT EXISTS patch_bangumi_id_key ON patch (bangumi_id);
