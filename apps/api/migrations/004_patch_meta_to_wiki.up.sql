-- 004: Drop all galgame metadata columns from the patch table (D12); metadata is owned by the Galgame Wiki.
--
-- At the same time, add a galgame_id column. This project fetches it once from
-- Wiki /galgame/check when creating a patch, and later enriches lists/details
-- via Wiki /galgame/batch?ids=galgame_ids.
--
-- Also flip vndb_id to NOT NULL: every patch must be tied to a Wiki galgame.

BEGIN;

-- Backfill: for legacy rows with vndb_id IS NULL, stamp 'pending-<id>' (should not really happen, but safe)
UPDATE patch SET vndb_id = 'pending-' || id WHERE vndb_id IS NULL;

-- Drop galgame metadata columns (name, introduction, banner, release date, age rating)
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

-- Set vndb_id NOT NULL
ALTER TABLE patch ALTER COLUMN vndb_id SET NOT NULL;

-- Add the galgame_id column (Wiki's galgame.id, cached locally to avoid calling /galgame/check every time)
ALTER TABLE patch ADD COLUMN IF NOT EXISTS galgame_id INT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_patch_galgame_id ON patch(galgame_id);

-- patch_alias is also deprecated (aliases are a game attribute, owned by Wiki)
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
        RAISE EXCEPTION '% galgame metadata columns still not dropped', dropped;
    END IF;
    RAISE NOTICE 'OK: 10 galgame metadata columns on patch + patch_alias table cleaned up';
END $$;

COMMIT;
