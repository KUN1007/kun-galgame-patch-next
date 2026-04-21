-- 001: 删除已外移到 Galgame Wiki Service 的元数据表
--
-- 背景：见 docs/proj/next-fiber/09-risks-and-decisions.md 的 D8 决策。
-- 角色、声优/人物、发售信息、封面、截图统一由 Galgame Wiki Service
-- 管理，本项目通过 patch.vndb_id 外键 + GalgameClient HTTP 调用获取。
--
-- 删除顺序：先删关联表（依赖主表），再删别名表，最后删主表。
-- 所有 DROP 都用 CASCADE 兜底（清理外键、索引、触发器、依赖视图）。

BEGIN;

-- ─────────────────────────────────────────────────
-- 1. 关联/关系表（依赖 patch_char 和 patch_person）
-- ─────────────────────────────────────────────────
DROP TABLE IF EXISTS patch_char_person_relation CASCADE;
DROP TABLE IF EXISTS patch_char_relation        CASCADE;
DROP TABLE IF EXISTS patch_person_relation      CASCADE;

-- ─────────────────────────────────────────────────
-- 2. 别名表
-- ─────────────────────────────────────────────────
DROP TABLE IF EXISTS patch_char_alias   CASCADE;
DROP TABLE IF EXISTS patch_person_alias CASCADE;

-- ─────────────────────────────────────────────────
-- 3. 主数据表
-- ─────────────────────────────────────────────────
DROP TABLE IF EXISTS patch_char       CASCADE;
DROP TABLE IF EXISTS patch_person     CASCADE;
DROP TABLE IF EXISTS patch_release    CASCADE;
DROP TABLE IF EXISTS patch_cover      CASCADE;
DROP TABLE IF EXISTS patch_screenshot CASCADE;

-- 验证：应返回 0 行
DO $$
DECLARE
    remaining INT;
BEGIN
    SELECT COUNT(*) INTO remaining
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
          'patch_char', 'patch_char_alias', 'patch_char_relation',
          'patch_char_person_relation',
          'patch_person', 'patch_person_alias', 'patch_person_relation',
          'patch_release', 'patch_cover', 'patch_screenshot'
      );
    IF remaining > 0 THEN
        RAISE EXCEPTION '仍有 % 张废弃表未被删除', remaining;
    END IF;
    RAISE NOTICE '✅ 10 张 Wiki 化表全部删除成功';
END $$;

COMMIT;
