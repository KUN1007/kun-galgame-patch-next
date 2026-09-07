DROP INDEX IF EXISTS idx_patch_catalog_work;
ALTER TABLE patch DROP COLUMN IF EXISTS catalog_work_id;
