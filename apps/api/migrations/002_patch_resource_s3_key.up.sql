-- 002: patch_resource 表结构调整（D10）
--
-- 背景：见 docs/proj/next-fiber/09-risks-and-decisions.md D10
-- 把老的 hash 字段改名为 blake3（保留存量 BLAKE3 值），
-- 新增 s3_key 字段（存完整 S3 对象键，未来所有 PUT/DELETE/HEAD 操作直接用它）。
--
-- 存量迁移：从 content URL 里 regex 剥出完整 S3 key，
-- 保证 deletePatchResource 之类的既有流程不需要改动路径计算。

BEGIN;

-- ─────────────────────────────────────────────────
-- 1. 重命名 hash → blake3
-- ─────────────────────────────────────────────────
ALTER TABLE patch_resource RENAME COLUMN hash TO blake3;

-- ─────────────────────────────────────────────────
-- 2. 新增 s3_key 列（完整 S3 对象键）
-- ─────────────────────────────────────────────────
ALTER TABLE patch_resource ADD COLUMN s3_key VARCHAR(2048) NOT NULL DEFAULT '';

-- ─────────────────────────────────────────────────
-- 3. 存量回填：从 content URL 剥前缀
--    content 形如 "https://<host>/<bucket>/patch/<id>/<blake3>/<file>"
--    目标 s3_key       "patch/<id>/<blake3>/<file>"
--    仅对 storage != 'user'（即 S3 资源）和 content 匹配标准 URL 格式的行处理
-- ─────────────────────────────────────────────────
UPDATE patch_resource
SET s3_key = REGEXP_REPLACE(content, '^https?://[^/]+/[^/]+/', '')
WHERE storage <> 'user'
  AND content ~ '^https?://[^/]+/[^/]+/.+';

-- ─────────────────────────────────────────────────
-- 4. 给 s3_key 加唯一索引（可选，便于 HeadObject 前防重复落盘）
-- ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patch_resource_s3_key ON patch_resource(s3_key) WHERE s3_key <> '';

-- 校验
DO $$
DECLARE
    total   INT;
    filled  INT;
    missing INT;
BEGIN
    SELECT COUNT(*) INTO total   FROM patch_resource WHERE storage <> 'user';
    SELECT COUNT(*) INTO filled  FROM patch_resource WHERE storage <> 'user' AND s3_key <> '';
    SELECT COUNT(*) INTO missing FROM patch_resource WHERE storage <> 'user' AND s3_key =  '';
    RAISE NOTICE '✅ S3 资源总数 %，已回填 s3_key %，未回填 %（可能是非标准 URL）', total, filled, missing;
END $$;

COMMIT;
