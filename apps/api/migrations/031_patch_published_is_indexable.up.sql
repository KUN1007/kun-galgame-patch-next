-- 031: `patch.published` is the sticky SEO/index flag.
--
-- 方案③: catalog is the existence layer, so a moyu patch page is reachable
-- for every work. `published` is true once a resource has been accepted on
-- this site, and it stays true if those rows are later deleted. Hidden/ban
-- still unpublishes in application code. The claim-event cron must not flip
-- this on live/draft.
--
-- Backfill is "has a resource today". Deleted history is gone, so ever-had
-- cannot be reconstructed.

BEGIN;

ALTER TABLE patch ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE patch p
SET published = EXISTS (
  SELECT 1 FROM patch_resource r WHERE r.galgame_id = p.id
);

COMMENT ON COLUMN patch.published IS
  'Sticky SEO/index flag (031). True after the first patch_resource on this row; not cleared when resources are deleted. Independent of catalog claim_state.';

COMMIT;
