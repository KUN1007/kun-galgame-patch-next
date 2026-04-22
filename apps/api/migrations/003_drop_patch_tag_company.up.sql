-- 003: 删除 patch_tag / patch_company 及其关联表（D11）
--
-- 背景：见 docs/proj/next-fiber/09-risks-and-decisions.md D11
-- 补丁不再在本地维护 tag / company 元数据，完全改用 Galgame Wiki Service
-- 的 tag / official（通过 patch.vndb_id 关联）。

BEGIN;

-- 先删关联表（FK 指向主表）
DROP TABLE IF EXISTS patch_tag_relation     CASCADE;
DROP TABLE IF EXISTS patch_company_relation CASCADE;

-- 再删主表
DROP TABLE IF EXISTS patch_tag     CASCADE;
DROP TABLE IF EXISTS patch_company CASCADE;

DO $$
DECLARE
    remaining INT;
BEGIN
    SELECT COUNT(*) INTO remaining
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('patch_tag', 'patch_tag_relation', 'patch_company', 'patch_company_relation');
    IF remaining > 0 THEN
        RAISE EXCEPTION '仍有 % 张 tag/company 表未被删除', remaining;
    END IF;
    RAISE NOTICE '✅ 4 张 tag/company 表全部删除成功';
END $$;

COMMIT;
