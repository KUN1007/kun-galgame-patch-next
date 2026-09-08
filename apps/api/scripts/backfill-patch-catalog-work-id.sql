-- Fills patch.catalog_work_id from the catalog's exact vndb anchor — the same
-- resolution nextmoe-infra's import-favorites used to place this site's 61,796
-- flat favourites, so the column agrees with where those favourites landed.
--
-- Run after migration 034 and before deploying the folders feature. Run as a
-- superuser with -f, in one psql session:
--
--   sudo docker exec <postgres> psql -U postgres -v ON_ERROR_STOP=1 \
--     -f /path/to/backfill-patch-catalog-work-id.sql
--
-- link_kind 0 is the exact anchor; a probable anchor is a guess, and a guess
-- that lands someone's favourite on the wrong game is worse than a game that
-- cannot be favourited. entity_type 5 is the work — 1 is something else, and
-- reading it gives a clean, wrong, empty answer.
--
-- "Same resolution" is the whole contract, and the first version of this script
-- broke it: import-favorites resolves work → follows catalog_redirect → then
-- requires the target to be live, on BOTH shapes. This script checked liveness
-- on `wiki-<n>` only and followed no redirect at all, so a v-number anchored to
-- a since-merged work would have been stored as the merged id while the
-- favourite sat on the survivor — the list would render nothing and the star
-- would refuse. Every id written here is a live work, redirects followed.
--
-- Idempotent. `pending-<n>` placeholders have no work and stay NULL.

\set ON_ERROR_STOP on
\pset pager off

\c kun_catalog

CREATE TEMP TABLE live AS SELECT id FROM catalog_work WHERE status = 0;
ALTER TABLE live ADD PRIMARY KEY (id);

-- A merged work's survivor. merge_rehang collapses chains, so depth > 1 is a
-- guard against a chain that outlived one merge rather than an expected path —
-- the same 8-hop ceiling the importer uses.
CREATE TEMP TABLE survivor AS
WITH RECURSIVE walk(start_id, cur, depth) AS (
  SELECT old_id, current_id, 1 FROM catalog_redirect WHERE entity_type = 5
  UNION ALL
  SELECT w.start_id, r.current_id, w.depth + 1
    FROM walk w JOIN catalog_redirect r ON r.old_id = w.cur AND r.entity_type = 5
   WHERE w.depth < 8 AND r.current_id <> w.cur
)
SELECT DISTINCT ON (start_id) start_id, cur AS work_id
  FROM walk WHERE cur IN (SELECT id FROM live)
 ORDER BY start_id, depth;
ALTER TABLE survivor ADD PRIMARY KEY (start_id);

\echo '=== exact vndb work anchors, and how many survive the liveness rule'
SELECT count(*) AS anchors,
       count(*) FILTER (WHERE r.entity_id IN (SELECT id FROM live)) AS already_live,
       count(*) FILTER (WHERE r.entity_id NOT IN (SELECT id FROM live)
                          AND r.entity_id IN (SELECT start_id FROM survivor)) AS via_redirect,
       count(*) FILTER (WHERE r.entity_id NOT IN (SELECT id FROM live)
                          AND r.entity_id NOT IN (SELECT start_id FROM survivor)) AS dropped
  FROM catalog_external_ref r JOIN catalog_source s ON s.id = r.source_id
 WHERE s.key = 'vndb' AND r.entity_type = 5 AND r.link_kind = 0 AND r.dead_at IS NULL;

\copy (SELECT r.external_id, coalesce(sv.work_id, r.entity_id) AS work_id FROM catalog_external_ref r JOIN catalog_source s ON s.id = r.source_id LEFT JOIN survivor sv ON sv.start_id = r.entity_id WHERE s.key = 'vndb' AND r.entity_type = 5 AND r.link_kind = 0 AND r.dead_at IS NULL AND (r.entity_id IN (SELECT id FROM live) OR sv.work_id IS NOT NULL)) TO '/tmp/vndb_anchor.csv' CSV
\copy (SELECT id FROM live) TO '/tmp/live_work.csv' CSV
\copy (SELECT start_id, work_id FROM survivor) TO '/tmp/survivor.csv' CSV

\c kungalgame_patch
CREATE TEMP TABLE anchor (external_id TEXT PRIMARY KEY, work_id BIGINT NOT NULL);
\copy anchor FROM '/tmp/vndb_anchor.csv' CSV
CREATE TEMP TABLE live_work (id BIGINT PRIMARY KEY);
\copy live_work FROM '/tmp/live_work.csv' CSV
CREATE TEMP TABLE survivor (start_id BIGINT PRIMARY KEY, work_id BIGINT NOT NULL);
\copy survivor FROM '/tmp/survivor.csv' CSV

\echo '=== before'
SELECT count(*) FILTER (WHERE catalog_work_id IS NOT NULL) AS mapped,
       count(*) FILTER (WHERE catalog_work_id IS NULL) AS unmapped, count(*) AS total
  FROM patch;

BEGIN;
-- A full re-derivation, not an append. A row this rule no longer maps has to
-- LOSE the id an earlier run gave it: works get merged, anchors get marked
-- dead, and a column that only ever gains values keeps pointing at a work that
-- no longer exists. One transaction, so the column is never seen empty.
UPDATE patch SET catalog_work_id = NULL WHERE catalog_work_id IS NOT NULL;

-- v-numbers through the anchor, which the export already resolved to a live work
UPDATE patch p SET catalog_work_id = a.work_id
  FROM anchor a WHERE a.external_id = p.vndb_id;

-- `wiki-<n>` is a catalog work id with a prefix, written when this site adopted
-- a work that had no vndb entry. The number is followed through the same
-- redirect rule, then required to be live.
UPDATE patch p SET catalog_work_id = t.work_id
  FROM (SELECT p2.id AS patch_id,
               coalesce(sv.work_id, lw.id) AS work_id
          FROM patch p2
          LEFT JOIN live_work lw ON lw.id = substring(p2.vndb_id from 6)::bigint
          LEFT JOIN survivor sv ON sv.start_id = substring(p2.vndb_id from 6)::bigint
         WHERE p2.vndb_id ~ '^wiki-[0-9]+$') t
 WHERE p.id = t.patch_id AND t.work_id IS NOT NULL;
COMMIT;

\echo '=== after, by vndb_id shape'
SELECT CASE WHEN vndb_id LIKE 'v%' THEN 'v-number'
            WHEN vndb_id LIKE 'wiki-%' THEN 'wiki-N'
            WHEN vndb_id LIKE 'pending%' THEN 'pending (no work by design)'
            ELSE 'other' END AS shape,
       count(*) AS rows,
       count(catalog_work_id) AS mapped
  FROM patch GROUP BY 1 ORDER BY 1;

\echo '=== every id written is a live work (0 = the rule held)'
SELECT count(*) AS not_live
  FROM patch p WHERE p.catalog_work_id IS NOT NULL
   AND p.catalog_work_id NOT IN (SELECT id FROM live_work);

\echo '=== works named by more than one patch (the index is not unique for this reason)'
SELECT count(*) AS colliding_works FROM (
  SELECT catalog_work_id FROM patch WHERE catalog_work_id IS NOT NULL
   GROUP BY 1 HAVING count(*) > 1) x;

\echo '=== favourited patches that still have no work (their favourites cannot migrate)'
SELECT count(DISTINCT r.galgame_id) AS patches, count(*) AS favourite_rows
  FROM user_patch_favorite_relation r JOIN patch p ON p.id = r.galgame_id
 WHERE p.catalog_work_id IS NULL;
