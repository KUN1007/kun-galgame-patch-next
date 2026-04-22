-- 003 DOWN: 重建 patch_tag / patch_company 表结构（不含数据）
--
-- ⚠️ 注意：和 001 一样是单向迁移。数据已迁到 Galgame Wiki，该 down 只为 schema 回滚应急。

BEGIN;

CREATE TABLE IF NOT EXISTS patch_tag (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(107) NOT NULL,
    provider            VARCHAR(31) NOT NULL DEFAULT '',
    name_en_us          VARCHAR(107) NOT NULL DEFAULT '',
    introduction_zh_cn  VARCHAR(10007) NOT NULL DEFAULT '',
    introduction_ja_jp  VARCHAR(10007) NOT NULL DEFAULT '',
    introduction_en_us  VARCHAR(10007) NOT NULL DEFAULT '',
    count               INT NOT NULL DEFAULT 0,
    alias               JSONB NOT NULL DEFAULT '[]',
    category            TEXT NOT NULL DEFAULT 'sexual',
    created             TIMESTAMP NOT NULL DEFAULT NOW(),
    updated             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patch_tag_relation (
    id            SERIAL PRIMARY KEY,
    patch_id      INT NOT NULL REFERENCES patch(id) ON DELETE CASCADE,
    tag_id        INT NOT NULL REFERENCES patch_tag(id) ON DELETE CASCADE,
    spoiler_level INT NOT NULL DEFAULT 0,
    created       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (patch_id, tag_id)
);

CREATE TABLE IF NOT EXISTS patch_company (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(107) NOT NULL,
    logo                VARCHAR(1007) NOT NULL DEFAULT '',
    introduction        VARCHAR(10007) NOT NULL DEFAULT '',
    introduction_zh_cn  VARCHAR(10007) NOT NULL DEFAULT '',
    introduction_ja_jp  VARCHAR(10007) NOT NULL DEFAULT '',
    introduction_en_us  VARCHAR(10007) NOT NULL DEFAULT '',
    count               INT NOT NULL DEFAULT 0,
    primary_language    JSONB NOT NULL DEFAULT '[]',
    official_website    JSONB NOT NULL DEFAULT '[]',
    parent_brand        JSONB NOT NULL DEFAULT '[]',
    alias               JSONB NOT NULL DEFAULT '[]',
    created             TIMESTAMP NOT NULL DEFAULT NOW(),
    updated             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patch_company_relation (
    id         SERIAL PRIMARY KEY,
    patch_id   INT NOT NULL REFERENCES patch(id) ON DELETE CASCADE,
    company_id INT NOT NULL REFERENCES patch_company(id) ON DELETE CASCADE,
    created    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (patch_id, company_id)
);

COMMIT;
