-- 004 DOWN: Roll back D12. Restore the galgame metadata columns on patch and the patch_alias table (no data).

BEGIN;

ALTER TABLE patch
    ADD COLUMN IF NOT EXISTS name_en_us         VARCHAR(1007) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS name_zh_cn         VARCHAR(1007) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS name_ja_jp         VARCHAR(1007) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS introduction_zh_cn VARCHAR(100007) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS introduction_ja_jp VARCHAR(100007) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS introduction_en_us VARCHAR(100007) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS banner             VARCHAR(1007) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS released           VARCHAR(107) NOT NULL DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS content_limit      VARCHAR(107) NOT NULL DEFAULT 'sfw',
    ADD COLUMN IF NOT EXISTS engine             JSONB NOT NULL DEFAULT '[]';

DROP INDEX IF EXISTS idx_patch_galgame_id;
ALTER TABLE patch DROP COLUMN IF EXISTS galgame_id;

ALTER TABLE patch ALTER COLUMN vndb_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS patch_alias (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(1007) NOT NULL,
    patch_id INT NOT NULL REFERENCES patch(id) ON DELETE CASCADE,
    created  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patch_alias_name ON patch_alias(name);
CREATE INDEX IF NOT EXISTS idx_patch_alias_patch_id ON patch_alias(patch_id);

COMMIT;
