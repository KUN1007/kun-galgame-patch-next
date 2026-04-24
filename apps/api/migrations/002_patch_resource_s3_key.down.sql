-- 002 DOWN: Roll back the D10 schema changes to patch_resource
--
-- Warning: rolling back loses the "random s3_key segment" info from any newly
--   uploaded rows (the old hash column stored BLAKE3, leaving nowhere for the
--   random portion of s3_key to land after rollback).
--   Only safe when no new S3 uploads have happened since the migration.

BEGIN;

DROP INDEX IF EXISTS idx_patch_resource_s3_key;

ALTER TABLE patch_resource DROP COLUMN IF EXISTS s3_key;

ALTER TABLE patch_resource RENAME COLUMN blake3 TO hash;

COMMIT;
