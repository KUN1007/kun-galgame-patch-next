-- 004: 把 patch 表里的游戏元数据列全部删掉（D12），元数据统一走 Galgame Wiki。
--
-- 同时新增 galgame_id 列，本项目创建 patch 时向 Wiki /galgame/check 查询一次拿到，
-- 后续展示列表/详情时用 Wiki /galgame/batch?ids=galgame_ids 批量富化。
--
-- 把 vndb_id 改成 NOT NULL：patch 必须关联一个 Wiki galgame。

BEGIN;

-- 回填：对 vndb_id IS NULL 的老数据，先置为 'pending'（几乎不会发生，但安全起见）
UPDATE patch SET vndb_id = 'pending-' || id WHERE vndb_id IS NULL;

-- 删除游戏元数据列（游戏名、介绍、封面、发售日期、年龄分级）
ALTER TABLE patch
    DROP COLUMN IF EXISTS name_en_us,
    DROP COLUMN IF EXISTS name_zh_cn,
    DROP COLUMN IF EXISTS name_ja_jp,
    DROP COLUMN IF EXISTS introduction_zh_cn,
    DROP COLUMN IF EXISTS introduction_ja_jp,
    DROP COLUMN IF EXISTS introduction_en_us,
    DROP COLUMN IF EXISTS banner,
    DROP COLUMN IF EXISTS released,
    DROP COLUMN IF EXISTS content_limit,
    DROP COLUMN IF EXISTS engine;

-- vndb_id 设为 NOT NULL
ALTER TABLE patch ALTER COLUMN vndb_id SET NOT NULL;

-- 新增 galgame_id 列（Wiki 里的 galgame.id，本地缓存避免每次都查一遍 /galgame/check）
ALTER TABLE patch ADD COLUMN IF NOT EXISTS galgame_id INT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_patch_galgame_id ON patch(galgame_id);

-- patch_alias 也废弃（别名是游戏属性，归 Wiki 管）
DROP TABLE IF EXISTS patch_alias CASCADE;

DO $$
DECLARE
    dropped INT;
BEGIN
    SELECT COUNT(*) INTO dropped
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patch'
      AND column_name IN ('name_en_us','name_zh_cn','name_ja_jp','introduction_zh_cn',
                          'introduction_ja_jp','introduction_en_us','banner','released',
                          'content_limit','engine');
    IF dropped > 0 THEN
        RAISE EXCEPTION '仍有 % 列游戏元数据未删除', dropped;
    END IF;
    RAISE NOTICE '✅ patch 表 10 列游戏元数据 + patch_alias 表已清理';
END $$;

COMMIT;
