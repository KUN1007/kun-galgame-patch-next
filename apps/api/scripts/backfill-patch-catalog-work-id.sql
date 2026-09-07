-- Fills patch.catalog_work_id from the catalog's exact vndb anchor — the same
-- resolution nextmoe-infra's import-favorites used to place this site's 61,796
-- flat favourites, so the column agrees with where those favourites landed.
--
-- Run after migration 034 and before deploying the folders feature. Run as a
-- superuser with -f, in one psql session:
--
--   sudo docker exec -i <postgres> psql -U postgres -v ON_ERROR_STOP=1 \
--     -f /path/to/backfill-patch-catalog-work-id.sql
--
-- link_kind 0 is the exact anchor; a probable anchor is a guess, and a guess
-- that lands someone's favourite on the wrong game is worse than a game that
-- cannot be favourited. entity_type 5 is the work — 1 is something else, and
-- reading it gives a clean, wrong, empty answer.
--
-- Idempotent. `wiki-<n>` vndb ids are the catalog work id with a prefix and are
-- resolved directly; `pending-<n>` placeholders have no work and stay NULL.

\set ON_ERROR_STOP on
\pset pager off

\c kun_catalog
\echo '=== exact vndb work anchors available'
SELECT count(*) AS anchors, count(DISTINCT r.external_id) AS distinct_ids
  FROM catalog_external_ref r JOIN catalog_source s ON s.id = r.source_id
 WHERE s.key = 'vndb' AND r.entity_type = 5 AND r.link_kind = 0 AND r.dead_at IS NULL;

\copy (SELECT r.external_id, r.entity_id FROM catalog_external_ref r JOIN catalog_source s ON s.id = r.source_id WHERE s.key = 'vndb' AND r.entity_type = 5 AND r.link_kind = 0 AND r.dead_at IS NULL) TO '/tmp/vndb_anchor.csv' CSV
\copy (SELECT id FROM catalog_work WHERE status = 0) TO '/tmp/live_work.csv' CSV

\c kungalgame_patch
CREATE TEMP TABLE anchor (external_id TEXT PRIMARY KEY, work_id BIGINT NOT NULL);
\copy anchor FROM '/tmp/vndb_anchor.csv' CSV
CREATE TEMP TABLE live_work (id BIGINT PRIMARY KEY);
\copy live_work FROM '/tmp/live_work.csv' CSV

\echo '=== before'
SELECT count(*) FILTER (WHERE catalog_work_id IS NOT NULL) AS mapped,
       count(*) FILTER (WHERE catalog_work_id IS NULL) AS unmapped, count(*) AS total
  FROM patch;

BEGIN;
-- v-numbers through the anchor
UPDATE patch p SET catalog_work_id = a.work_id
  FROM anchor a
 WHERE a.external_id = p.vndb_id
   AND p.catalog_work_id IS DISTINCT FROM a.work_id;

-- wiki-<n> is the catalog work id with a prefix, kept only when that work is live
UPDATE patch p SET catalog_work_id = w.id
  FROM live_work w
 WHERE p.vndb_id LIKE 'wiki-%'
   AND w.id = substring(p.vndb_id from 6)::bigint
   AND p.catalog_work_id IS DISTINCT FROM w.id;
COMMIT;

\echo '=== after, by vndb_id shape'
SELECT CASE WHEN vndb_id LIKE 'v%' THEN 'v-number'
            WHEN vndb_id LIKE 'wiki-%' THEN 'wiki-N'
            WHEN vndb_id LIKE 'pending%' THEN 'pending (no work by design)'
            ELSE 'other' END AS shape,
       count(*) AS rows,
       count(catalog_work_id) AS mapped
  FROM patch GROUP BY 1 ORDER BY 1;

\echo '=== favourited patches that still have no work (their favourites cannot migrate)'
SELECT count(DISTINCT r.galgame_id)
  FROM user_patch_favorite_relation r JOIN patch p ON p.id = r.galgame_id
 WHERE p.catalog_work_id IS NULL;
