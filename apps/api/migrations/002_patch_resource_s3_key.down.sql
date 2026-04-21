-- 002 DOWN: 回滚 patch_resource 的 D10 schema 变更
--
-- ⚠️ 注意：回滚会丢失新上传行的"随机 s3_key 段"信息
--   （因为旧 hash 列原本存的是 BLAKE3，回滚后 s3_key 里的随机串无处落脚）。
--   只适用于迁移后未产生新 S3 上传的场景。

BEGIN;

DROP INDEX IF EXISTS idx_patch_resource_s3_key;

ALTER TABLE patch_resource DROP COLUMN IF EXISTS s3_key;

ALTER TABLE patch_resource RENAME COLUMN blake3 TO hash;

COMMIT;
