-- 002: patch_resource schema adjustment (D10)
--
-- Background: see D10 in docs/proj/next-fiber/09-risks-and-decisions.md.
-- Rename the legacy hash column to blake3 (preserving existing BLAKE3 values),
-- and add a new s3_key column (the full S3 object key; all future PUT/DELETE/HEAD
-- operations use it directly).
--
-- Backfill for existing data: regex out the full S3 key from the content URL
-- so existing flows such as deletePatchResource do not need to change their
-- path-building logic.

BEGIN;

-- ─────────────────────────────────────────────────
-- 1. Rename hash -> blake3
-- ─────────────────────────────────────────────────
ALTER TABLE patch_resource RENAME COLUMN hash TO blake3;

-- ─────────────────────────────────────────────────
-- 2. Add the s3_key column (full S3 object key)
-- ─────────────────────────────────────────────────
ALTER TABLE patch_resource ADD COLUMN s3_key VARCHAR(2048) NOT NULL DEFAULT '';

-- ─────────────────────────────────────────────────
-- 3. Backfill existing rows: strip the URL prefix from content
--    content looks like "https://<host>/<bucket>/patch/<id>/<blake3>/<file>"
--    target s3_key       "patch/<id>/<blake3>/<file>"
--    Only processes rows where storage != 'user' (i.e. S3 resources) and
--    content matches the standard URL shape.
-- ─────────────────────────────────────────────────
UPDATE patch_resource
SET s3_key = REGEXP_REPLACE(content, '^https?://[^/]+/[^/]+/', '')
WHERE storage <> 'user'
  AND content ~ '^https?://[^/]+/[^/]+/.+';

-- ─────────────────────────────────────────────────
-- 4. Add a unique index on s3_key (optional, helps prevent duplicate writes before HeadObject)
-- ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patch_resource_s3_key ON patch_resource(s3_key) WHERE s3_key <> '';

-- Verification
DO $$
DECLARE
    total   INT;
    filled  INT;
    missing INT;
BEGIN
    SELECT COUNT(*) INTO total   FROM patch_resource WHERE storage <> 'user';
    SELECT COUNT(*) INTO filled  FROM patch_resource WHERE storage <> 'user' AND s3_key <> '';
    SELECT COUNT(*) INTO missing FROM patch_resource WHERE storage <> 'user' AND s3_key =  '';
    RAISE NOTICE 'OK: S3 resources total %, backfilled s3_key %, not backfilled % (likely non-standard URLs)', total, filled, missing;
END $$;

COMMIT;
